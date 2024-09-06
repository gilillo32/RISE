import argparse
import decimal
from db_manager import DbManager
from tqdm import tqdm
from dotenv import load_dotenv
import ijson

load_dotenv()
db_manager = DbManager()
companies_collection = db_manager.get_collection("companies")

def convert_decimal_to_float(data):
    if isinstance(data, dict):
        return {k: convert_decimal_to_float(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_decimal_to_float(i) for i in data]
    elif isinstance(data, decimal.Decimal):
        return float(data)
    return data

# Get the filename of the scan result from arguments
parser = argparse.ArgumentParser()
parser.add_argument("filename", help="Scan result filename")
args = parser.parse_args()
filename = args.filename

try:
    db_manager.archive_last_scan()
    # Load the scan result
    print("Opening scan result file")
    with open(filename, "r") as file:
        print("Starting loop")
        for item in tqdm(ijson.items(file, "item"), desc="Processing items", unit="item", ascii=" ▖▘▝▗▚▞█"):
            converted_item = convert_decimal_to_float(item)
            db_manager.save_last_scan_item(converted_item)
except Exception as e:
    print("Error loading scan result")
    print(type(e))
    print(str(e))

    print(e)

print("Scan result processed")

