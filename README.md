# RISE
Online service map of companies in the Basque Country for the detection, diagnosis, and early warning of vulnerabilities
and cybersecurity risks, as part of the RISE project (diagnóstico y prevención de RIesgos de ciberSEguridad).
## Setup
### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Python](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/en/download/)

### Installation
1. [Optional] Create a virtual python environment:
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```
2. Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Deploy the database:
    ```bash
    docker-compose up -d
    ```
4. Deploy the web server:
    ```bash
    node server.js
   ```
5. Access the web server and import data from `dataset` folder.

### How to launch an analysis
Customize Nuclei configuration file `rise-config.yaml` and execute the `launch_analysis.py` script.  
Execute `python launch_analysis.py -h` for more information:
```bash
usage: launch_scan.py [-h] [-y] [-n N]

options:
  -h, --help  show this help message and exit
  -y          Skip confirmation
  -n N        Number of companies to scan
```
## About
