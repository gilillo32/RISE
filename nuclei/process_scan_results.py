import argparse
import os
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

def process_file(filename):
    try:
        db_manager.archive_last_scan()
        # Load the scan result
        print("Opening scan result file")
        with open(filename, "r") as file:
            print("Starting loop")
            for item in tqdm(ijson.items(file, "item"), desc="Processing items", unit="item", ascii=" ▖▘▝▗▚▞█"):
                converted_item = convert_decimal_to_float(item)
                db_manager.save_last_scan_item(converted_item)
        # Move the processed file
        processed_dir = os.path.join(os.path.dirname(filename), "processed")
        os.makedirs(processed_dir, exist_ok=True)
        shutil.move(filename, os.path.join(processed_dir, os.path.basename(filename)))
    except Exception as e:
        print("Error loading scan result")
        print(type(e))
        print(str(e))
        print(e)

# Get the filename of the scan result from arguments
parser = argparse.ArgumentParser()
parser.add_argument("-f", "--filename", help="Scan result filename")
args = parser.parse_args()

if args.filename:
    process_file(args.filename)
else:
    # Get the path of the script:
    script_path = os.path.dirname(os.path.abspath(__file__))
    results_dir = os.path.join(script_path, "shared-volume", "results")
    for filename in os.listdir(results_dir):
        if filename.endswith(".json"):
            process_file(os.path.join(results_dir, filename))

print("Scan result processed")

