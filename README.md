# RISE
Web platform for the diagnosis and prevention of cybersecurity risks (RISE) project.

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
Customize Nuclei configuration file `rise-config.yaml` and execute the `launch_analysis.py` script with
the `-y` flag to run the analysis without confirmation. This step may take a few days to complete.
```bash
python launch_analysis.py -y
```
## About
