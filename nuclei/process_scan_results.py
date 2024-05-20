import pymongo
import argparse
import json
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = (
           f'mongodb://{os.getenv("MONGO_USER")}:'
           f'{os.getenv("MONGO_PASS")}@'
           f'{os.getenv("DB_HOST")}:'
           f'{os.getenv("DB_PORT")}'
           )
DATABASE_NAME = os.getenv("DB_NAME")

try:
    # Connect to the database
    client = pymongo.MongoClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    collection = db["companies"]
    print("Connected to database")
except:
    print("Error connecting to database")
    exit()

# Get the filename of the scan result from arguments
parser = argparse.ArgumentParser()
parser.add_argument("filename", help="Scan result filename")
args = parser.parse_args()
filename = args.filename

# Load the scan result
with open(filename, "r") as file:
    scan_result = json.load(file)

for item in scan_result:
    if item["info"]["severity"] == "info":
        name = item["info"]["name"]
        matcher_name = item.get("matcher-name")
        if matcher_name is not None:
            name += f" ({matcher_name})"
        collection.update_one({"web": {"$regex": '.*'+item["host"]+'*'}}, {"$addToSet": {"detectedTech": name}}, upsert=True)