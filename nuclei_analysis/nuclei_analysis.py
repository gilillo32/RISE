import pymongo
import subprocess
from dotenv import load_dotenv


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

result = subprocess.run(["docker", "run", "-v", "$(pwd):/nuclei", "projectdiscovery/nuclei",
            "-l", "/nuclei/targets.txt"], capture_output=True, text=True)

print(result.stdout)