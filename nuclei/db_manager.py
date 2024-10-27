import pymongo
import os
import json
from dotenv import load_dotenv

load_dotenv()
# URL format: mongodb://<username>:<password>@<host>:<port>
DATABASE_URL = (
           f'mongodb://{os.getenv("MONGO_USER")}:'
           f'{os.getenv("MONGO_PASS")}@'
           f'{os.getenv("DB_HOST_OUTS_DOCK")}:'
           f'{os.getenv("DB_PORT")}'
           )
DATABASE_NAME = os.getenv("DB_NAME")


class DbManager:
    """
    Singleton class to manage the connection to the database.
    It also provides methods to interact with the database.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DbManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'db'):
            self._connect_to_database()

    def _connect_to_database(self):
        try:
            # Connect to the database
            client = pymongo.MongoClient(DATABASE_URL)
            db = client[DATABASE_NAME]
            print("Connected to database")
            self.db = db
        except:
            print("Error connecting to database")
            exit()

    def get_collection(self, collection_name):
        return self.db[collection_name]

    def archive_last_scan(self):
        try:
            last_scan_collection = self.get_collection("last_scan")
            archived_scan_collection = self.get_collection("archived_scans")

            # Ensure collections exist
            if not last_scan_collection.count_documents({}):
                print("No documents found in last_scan collection to archive.")
                return

            if not archived_scan_collection.count_documents({}):
                self.db.create_collection("archived_scans")

            # Fetch documents from last_scan collection
            documents = list(last_scan_collection.find())

            if documents:
                archived_scan_collection.insert_many(documents)
                last_scan_collection.drop()
            else:
                print("No documents found in last_scan collection to archive.")

            # Empty the companies vulnerabilities and detectedTech array fields
            companies_collection = self.get_collection("companies")
            companies_collection.update_many({}, {"$set": {"vulnerabilities": [], "detectedTech": []}})
        except Exception as e:
            print("Error archiving last scan")
            print(type(e))
            print(str(e))

    def setScanActive(self, active):
        try:
            if active:
                # Ensure there is only one active scan
                active_scan_collection = self.get_collection("is_scan_active")
                active_scan_collection.delete_many({})
                active_scan_collection.insert_one({"active": True})
            else:
                active_scan_collection = self.get_collection("is_scan_active")
                active_scan_collection.delete_many({})
                active_scan_collection.insert_one({"active": False})
        except Exception as e:
            print("Error setting scan active")
            print(str(e))

    def save_last_scan_item(self, item):
        last_scan_collection = self.get_collection("last_scan")
        last_scan_collection.insert_one(item)

        # Update the company document with the new vulnerabilities and detected technologies
        companies_collection = self.get_collection("companies")
        company = companies_collection.find_one({"web": item["host"]})
        if item['info']['severity'] == "info":
            # Add to detectedTech array
            info_to_save = item['info']['name']
            companies_collection.update_one({"web": item["host"]}, {"$addToSet": {"detectedTech": info_to_save}})
        else:
            # Add to vulnerabilities array
            info_to_save = item['info']['name']
            # Append matcher name if exists
            if "matcher_name" in item['info']:
                info_to_save += " - " + item['info']['matcher_name']
            companies_collection.update_one({"web": item["host"]}, {"$addToSet": {"vulnerabilities": info_to_save}})
        # Parse timestamp to date:
        item["timestamp"] = item["timestamp"].split("T")[0]
        # Set last scan date
        companies_collection.update_one({"web": item["host"]}, {"$set": {"lastScan": item["timestamp"]}})