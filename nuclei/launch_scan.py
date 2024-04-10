import pymongo
import subprocess
from dotenv import load_dotenv
import os


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

try:
    client = pymongo.MongoClient(DATABASE_URL)
    db = client[DATABASE_NAME]  # Reemplaza "mydatabase" con el nombre de tu base de datos
    collection = db["companies"]  # Reemplaza "companies" con el nombre de tu colección
    print("Connected to database")

except Exception as e:
    print("Error connecting to database")
    print(e)
    exit()

companies = collection.find({}, {"web": 1, "_id": 0})

with open("./shared-volume/targets.txt", "w") as file:
    for company in companies:
        file.write(company["web"] + "\n")

command = "docker run -v ./shared-volume:/go/src/app:rw projectdiscovery/nuclei \
-l /go/src/app/targets.txt -je /go/src/app/result.json -config /go/src/app/rise-config.yml"

subprocess.run(command, shell=True)
