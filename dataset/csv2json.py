import pandas as pd
import json

# Load csv data
data = pd.read_csv("SABI_Export.csv")

# Remove unnecesary columns
data = data.drop(columns=["Country"])
data = data.drop(columns=["Index"])

# Save data to json
data.to_json("companies.json", orient="records")


