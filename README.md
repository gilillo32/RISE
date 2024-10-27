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
3. Deploy the containers:
    ```bash
    docker-compose up -d
    ```
4. Create a new user:
```bash
curl --location 'rise.eus:80/api/createUser' \
--data-urlencode 'username=<username>' \
--data-urlencode 'password=<password>'    
```
### How to setup scans
- How to launch an isolated scan:  
Customize Nuclei configuration file `rise-config.yaml` and execute the `launch_analysis.py` script.  
Execute `python launch_analysis.py -h` for more information:
```bash
usage: launch_scan.py [-h] [-y] [-n NUMBER_COMPANIES] [-nt] [-s [SPLIT]]

options:
  -h, --help            show this help message and exit
  -y, --skip-confirmation
                        Skip confirmation
  -n NUMBER_COMPANIES, --number-companies NUMBER_COMPANIES
                        Number of companies to scan
  -nt, --no-telegram    Do not send telegram messages
  -s [SPLIT], --split [SPLIT]
                        Number of companies per iteration

```

- How to enable the scan service daemon:  
Change file permissions to make scripts executable:  
```bash
   chmod +x ./setup_rise_service.sh
   chmod +x ./nuclei/run_scan_process.sh
```
Setup the daemon with the script:  
```bash
   ./setup_rise_service.sh
```  
Adittionally, this script will create a new user with the username and password specified in the environment variables.  
If they are not set, it will ask for them interactively.
If there is already a user in the DB, it will not create a new one.

### Environment variables
The required environment variables are:
```bash
APP_PORT
EXPRESS_SESSION_SECRET
PLATFORM_USERNAME
PLATFORM_PASSWORD
MONGO_USER
MONGO_PASS
DB_NAME
DB_HOST
DB_HOST_OUTS_DOCK
DB_PORT
TELEGRAM_BOT_TOKEN
TELEGRAM_RECEIVERS
PIA_USERNAME
PIA_PASSWORD
LOGIN_PATH
```
## About
This project has been developed as a Final Grade Project by Iñigo Gil, student of University of the Basque Country.