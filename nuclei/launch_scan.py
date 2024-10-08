import argparse
import pymongo
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import os

from .db_manager import DbManager
from .process_scan_results import companies_collection

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("-y", "--skip-confirmation", action="store_true", help="Skip confirmation")
parser.add_argument("-n", "--number-companies", type=int, help="Number of companies to scan")
parser.add_argument("-nt", "--no-telegram", action="store_true", help="Do not send telegram messages")
parser.add_argument("-s", "--split", type=int, const=10, nargs='?',
                    help="Number of companies per iteration")
args = parser.parse_args()

loop = None
bot = None
if not args.no_telegram:
    try:
        print("Setting telegram bot up. . .")
        import asyncio
        from telegram_bot_manager import TelegramBotController

        bot = TelegramBotController()
        loop = asyncio.get_event_loop()
    except Exception as e:
        print("Error setting telegram bot up")
        print(e)
        exit()

load_dotenv()
db_manager = DbManager()
db = db_manager.db
companies_collection = db_manager.get_collection("companies")

if args.number_companies:
    pipeline = [
        {"$group": {"_id": "$web", "doc": {"$first": "$$ROOT"}}},
        {"$sample": {"size": args.number_companies}},
        {"$replaceRoot": {"newRoot": "$doc"}}
    ]
    companies_urls = [doc['web'] for doc in companies_collection.aggregate(pipeline)]
else:
    companies_urls = companies_collection.distinct("web")

num_companies = 0

# Ask if the user wants to launch the scan
if not args.skip_confirmation:
    print(f"{len(companies_urls)} targets are going to be scanned. Do you want continue? (y/n): ")
    answer = input().lower()
    if answer != "y":
        print("Scan canceled :/")
        exit()

current_dir = os.path.dirname(os.path.realpath(__file__))
targets_file_path = os.path.join(current_dir, "shared-volume/targets.txt")
if args.split:
    for i in range(0, len(companies_urls), args.split):
        num_iterations = len(companies_urls) // args.split
        current_iteration = i // args.split + 1
        with open(targets_file_path, "w") as file:
            num_companies = 0
            for company in companies_urls[i:i + args.split]:
                file.write(company + "\n")
                num_companies += 1
        current_date = datetime.now().strftime("%Y-%m-%d")
        file_name = f"scan-result-{current_date}-iteration-{current_iteration}.json"
        shared_volume_path = os.path.join(current_dir, "shared-volume")
        command = f"docker run -v {shared_volume_path}:/go/src/app:rw \
        --rm --net=container:vpn projectdiscovery/nuclei:latest \
        -l /go/src/app/targets.txt -config /go/src/app/rise-config.yml > {shared_volume_path}/results/{file_name}"
        everything_ok = False
        try:
            print(f"Launching scan {current_iteration}/{num_iterations} . . .")
            if not args.no_telegram:
                loop.run_until_complete(bot.send_message(f"Launching scan "
                                                         f"{current_iteration}/{num_iterations} with "
                                                         f"{num_companies} companies"))
            subprocess.run(command, shell=True)
            new_file_name = f"scan-result-{current_date}-iteration-{current_iteration}-n{num_companies}-completed.json"
            os.rename(os.path.join(shared_volume_path, "results", file_name),
                      os.path.join(shared_volume_path, "results",
                                   new_file_name))
            everything_ok = True
        except Exception as e:
            print("Error launching scan :(")
            print(e)
            exit()
        finally:
            if everything_ok:
                print("Scan completed :)")
                if not args.no_telegram:
                    loop.run_until_complete(
                        bot.send_message(f"✅Scan segment {current_iteration}/{num_iterations} completed with "
                                         f"{num_companies} companies :)"))
            else:
                print("Scan interrupted :/")
                if not args.no_telegram:
                    loop.run_until_complete(bot.send_message(f"🔴Scan segment {current_iteration} interrupted :/"))

else:
    with open(targets_file_path, "w") as file:
        for company in companies_urls:
            file.write(company + "\n")
            num_companies += 1

    print(f"Added {num_companies} companies to targets.txt")

    current_date = datetime.now().strftime("%Y-%m-%d")
    file_name = f"scan-result-{current_date}.json"
    shared_volume_path = os.path.join(current_dir, "shared-volume")
    command = f"docker run -v {shared_volume_path}:/go/src/app:rw \
    --rm --net=container:vpn projectdiscovery/nuclei:latest \
    -l /go/src/app/targets.txt -config /go/src/app/rise-config.yml > {shared_volume_path}/results/{file_name}"
    everything_ok = False
    try:
        print("Launching scan . . .")
        if not args.no_telegram:
            loop.run_until_complete(bot.send_message(f"Launching scan with {num_companies} companies [NO SPLIT]"))
        subprocess.run(command, shell=True)
        new_file_name = f"scan-result-{current_date}-n{num_companies}-completed.json"
        os.rename(os.path.join(shared_volume_path, "results", file_name), os.path.join(shared_volume_path, "results",
                                                                                       new_file_name))
        everything_ok = True
    except Exception as e:
        print("Error launching scan :(")
        print(e)
        exit()
    finally:
        if everything_ok:
            print("Scan completed :)")
            if not args.no_telegram:
                loop.run_until_complete(bot.send_message(f"✅Scan completed with {num_companies} companies :)"))
        else:
            print("Scan interrupted :/")
            if not args.no_telegram:
                loop.run_until_complete(bot.send_message(f"🔴Scan interrupted :/"))
