import pymongo
import subprocess
from dotenv import load_dotenv
import os


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")


client = pymongo.MongoClient(DATABASE_URL)
db = client[DATABASE_NAME]  # Reemplaza "mydatabase" con el nombre de tu base de datos
collection = db["companies"]  # Reemplaza "companies" con el nombre de tu colección

companies = collection.find({}, {"web": 1, "_id": 0})

with open("targets.txt", "w") as file:
    for company in companies:
        file.write(company["web"] + "\n")

exit()
subprocess.run(["docker", "compose", "start", "nuclei"])

result = subprocess.run(["docker", "compose", "exec", "-T", "nuclei", "nuclei",
            "-l", "/nuclei/targets.txt", "-o", "/nuclei/results.json"], capture_output=True, text=True)

print(result.stdout)

subprocess.run(["docker", "compose", "stop", "nuclei"])