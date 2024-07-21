import argparse
import pymongo
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import os

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("-y", "--skip-confirmation", action="store_true", help="Skip confirmation")
parser.add_argument("-n", "--number-companies", type=int, help="Number of companies to scan")
parser.add_argument("-nt", "--no-telegram", action="store_true", help="Do not send telegram messages")
args = parser.parse_args()

loop = None
bot = None
if not args.no_telegram:
    try:
        print("Setting telegram bot up. . .")
        import asyncio
        from telegram_bot_controller import TelegramBotController
        bot = TelegramBotController()
        loop = asyncio.get_event_loop()
    except Exception as e:
        print("Error setting telegram bot up")
        print(e)
        exit()

load_dotenv()
DATABASE_URL = (
           f'mongodb://{os.getenv("MONGO_USER")}:'
           f'{os.getenv("MONGO_PASS")}@'
           f'{os.getenv("DB_HOST")}:'
           f'{os.getenv("DB_PORT")}'
           )
DATABASE_NAME = os.getenv("DB_NAME")

try:
    client = pymongo.MongoClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    collection = db["companies"]
    print("Connected to database")

except Exception as e:
    print("Error connecting to database")
    print(e)
    exit()

if args.number_companies:
    pipeline = [
        {"$group": {"_id": "$web", "doc": {"$first": "$$ROOT"}}},
        {"$sample": {"size": args.number_companies}},
        {"$replaceRoot": {"newRoot": "$doc"}}
    ]
    companies_urls = [doc['web'] for doc in collection.aggregate(pipeline)]
else:
    companies_urls = collection.distinct("web")

num_companies = 0

# Get current directory
current_dir = os.path.dirname(os.path.realpath(__file__))
targets_file_path = os.path.join(current_dir, "shared-volume/targets.txt")
with open(targets_file_path, "w") as file:
    for company in companies_urls:
        file.write(company + "\n")
        num_companies += 1

print(f"Added {num_companies} companies to targets.txt")

# Ask if the user wants to launch the scan
if not args.skip_confirmation:
    print(f"{num_companies} targets are going to be scanned. Do you want continue? (y/n): ")
    answer = input().lower()
    if answer != "y":
        print("Scan canceled :/")
        exit()

# Remove stderr.txt if exists
stderr_path = os.path.join(current_dir, "shared-volume/stderr.txt")
if os.path.exists(stderr_path):
    os.remove(stderr_path)

current_date = datetime.now().strftime("%Y-%m-%d")
file_name = f"scan-result-{current_date}.json"
shared_volume_path = os.path.join(current_dir, "shared-volume")
command = (f"docker run -v {shared_volume_path}:/go/src/app:rw \
--rm --net=container:vpn projectdiscovery/nuclei:latest \
-l /go/src/app/targets.txt -j -config /go/src/app/rise-config.yml > {shared_volume_path}/results/{file_name} | "
           f"tee -a stderr.txt")
everything_ok = False
try:
    print("Launching scan . . .")
    if not args.no_telegram:
        loop.run_until_complete(bot.send_message(f"Launching scan with {num_companies} companies"))
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
            loop.run_until_complete(bot.send_message(f"Scan completed with {num_companies} companies :)"))
    else:
        print("Scan interrupted :/")
        if not args.no_telegram:
            loop.run_until_complete(bot.send_message(f"Scan interrupted :/"))
