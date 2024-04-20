import argparse
import pymongo
import subprocess
from dotenv import load_dotenv
import os

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("-y", action="store_true", help="Skip confirmation")
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
    db = client[DATABASE_NAME]  # Reemplaza "mydatabase" con el nombre de tu base de datos
    collection = db["companies"]  # Reemplaza "companies" con el nombre de tu colección
    print("Connected to database")

except Exception as e:
    print("Error connecting to database")
    print(e)
    exit()

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
file_name = f"scan_result_{current_date}.json"
command = f"docker run -v ./shared-volume:/go/src/app:rw projectdiscovery/nuclei \
-l /go/src/app/targets.txt -je /go/src/app/{file_name} -config /go/src/app/rise-config.yml"


subprocess.run(command, shell=True)
