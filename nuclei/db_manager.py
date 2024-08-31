import pymongo
import os
from dotenv import load_dotenv

load_dotenv()
# URL format: mongodb://<username>:<password>@<host>:<port>
DATABASE_URL = (
           f'mongodb://{os.getenv("MONGO_USER")}:'
           f'{os.getenv("MONGO_PASS")}@'
           f'{os.getenv("DB_HOST")}:'
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

    def save_scan_item(self, item):
        scan_results_collection = self.get_collection("scan_results")
        scan_results_collection.insert_one(item)