import argparse
import pymongo
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import os

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("-y", action="store_true", help="Skip confirmation")
parser.add_argument("-n", type=int, help="Number of companies to scan")
args = parser.parse_args()

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
    # Comment for testing commit names
    print(e)
    exit()

if args.n:
    pipeline = [
        {"$group": {"_id": "$web", "doc": {"$first": "$$ROOT"}}},
        {"$sample": {"size": args.n}},
        {"$replaceRoot": {"newRoot": "$doc"}}
    ]
    companies_urls = [doc['web'] for doc in collection.aggregate(pipeline)]
else:
    companies_urls = collection.distinct("web")

num_companies = 0
with open("./shared-volume/targets.txt", "w") as file:
    for company in companies_urls:
        file.write(company + "\n")
        num_companies += 1

print(f"Added {num_companies} companies to targets.txt")

# Ask if the user wants to launch the scan
if not args.y:
    print(f"{num_companies} targets are going to be scanned. Do you want continue? (y/n): ")
    answer = input().lower()
    if answer != "y":
        print("Scan canceled")
        exit()

current_date = datetime.now().strftime("%Y-%m-%d")
file_name = f"scan-result-{current_date}.json"
command = f"docker run -v ./shared-volume:/go/src/app:rw --rm --net=container:vpn projectdiscovery/nuclei \
-l /go/src/app/targets.txt -je /go/src/app/{file_name} -config /go/src/app/rise-config.yml"


subprocess.run(command, shell=True)
