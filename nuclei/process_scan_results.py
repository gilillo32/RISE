import pymongo
import json

load_dotenv()
DATABASE_URL = (
           f'mongodb://{os.getenv("MONGO_USER")}:'
           f'{os.getenv("MONGO_PASS")}@'
           f'{os.getenv("DB_HOST")}:'
           f'{os.getenv("DB_PORT")}'
           )
DATABASE_NAME = os.getenv("DB_NAME")