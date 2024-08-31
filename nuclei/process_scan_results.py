import argparse
from db_manager import DbManager
from tqdm import tqdm
from dotenv import load_dotenv
import ijson

load_dotenv()
db_manager = DbManager()
db = db_manager.db
companies_collection = db_manager.get_collection("companies")

def process_item(current_item):
   if current_item["info"]["severity"] == "info":
           name = current_item["info"]["name"]
           matcher_name = current_item.get("matcher-name")
           if matcher_name is not None:
               name += f" ({matcher_name})"
               # Remove port from url
               host = current_item["host"].split(":")[0]
               companies_collection.update_one({"web": {"$regex": '.*'+host+'*'}}, {"$addToSet": {"detectedTech": name}},
                upsert=True)
   elif current_item["info"]["severity"] in ["critical", "high", "medium", "low", "unknown"]:
       name = current_item["info"]["name"]
       matcher_name = current_item.get("matcher-name")
       if matcher_name is not None:
           name += f" ({matcher_name})"
           # Remove port from url
           host = current_item["host"].split(":")[0]
           companies_collection.update_one({"web": {"$regex": '.*'+host+'*'}}, {"$addToSet": {"vulnerabilities": name}},
            upsert=True)


# Get the filename of the scan result from arguments
parser = argparse.ArgumentParser()
parser.add_argument("filename", help="Scan result filename")
args = parser.parse_args()
filename = args.filename

try:
    # Load the scan result
    print("Opening scan result file")
    with open(filename, "r") as file:
        print("Starting loop")
        for item in tqdm(ijson.items(file, "item"), desc="Processing items", unit="item", ascii=" ▖▘▝▗▚▞█"):
            process_item(item)
            db_manager.save_scan_item(item)
except Exception as e:
    print("Error loading scan result")
    print(type(e))
    print(str(e))

    print(e)

print("Scan result processed")

