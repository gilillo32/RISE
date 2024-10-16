#!/bin/bash

SERVICE_PATH="/etc/systemd/system/rise_scan.service"
SCRIPT_PATH="/home/RISE/nuclei/run_scan_process.sh"
DOCKER_COMPOSE_PATH="/home/RISE/docker-compose.yml"
API_URL="http://localhost/api/createUser"

# Declare function to start containers
start_docker_containers() {
  echo "Verifying containers. . ."
  docker compose -f "$DOCKER_COMPOSE_PATH" ps | grep "Up"
  if [ $? -ne 0 ]; then
    echo "Containers are down. Starting containers. . ."
    docker compose -f "$DOCKER_COMPOSE_PATH" up -d
  else
    echo "Containers are already up."
  fi
}

# Check if docker-compose.yml exists
if [[ ! -f $DOCKER_COMPOSE_PATH ]]; then
    echo "docker-compose.yml not found. Exiting."
    exit 1
fi

# Create a function to create a user
create_user() {
  username="$1"
  password="$2"

  # Input validation
  if [[ -z "$username" || -z "$password" || "$username" =~ ^[[:space:]]*$ || "$password" =~ ^[[:space:]]*$ ]]; then
    echo "Error: Username and password are required arguments."
    exit 1
  fi

  # Call API endpoint
  response=$(curl -s -X POST -H "Content-Type: application/json" \
                  -d "{\"username\": \"$username\", \"password\": \"$password\"}" \
                  "$API_URL")

  # Check response status
  if [[ $? -eq 0 ]]; then
    if command -v jq &> /dev/null; then
      success=$(echo "$response" | jq '.success')
      if [[ "$success" == true ]]; then
        echo "User '$username' created successfully."
      else
        echo "Error creating user '$username': $response"
      fi
    else
      # Handle response without jq
      echo "User creation response: $response"
    fi
  else
    echo "Error creating user: cURL request failed (exit code: $?)."
  fi
}

# Read username and password
# If PLATFORM_USERNAME and PLATFORM_PASSWORD are set, use them as default values
# Load .env file
if [[ -f .env ]]; then
  export $(grep -v '^#' .env | xargs)
fi

if [[ -z "$PLATFORM_USERNAME" ]]; then
  read -r -p "Enter the username: " username
else
  username="$PLATFORM_USERNAME"
fi

if [[ -z "$PLATFORM_PASSWORD" ]]; then
  read -r -p "Enter the password: " password
else
  password="$PLATFORM_PASSWORD"
fi


# Create the user
create_user "$username" "$password"

# Create the service file
echo "Creating systemd service file..."

cat <<EOL > $SERVICE_PATH
[Unit]
Description=RISE Scan and Process Service
After=docker.service

[Service]
Type=simple
ExecStart=$SCRIPT_PATH
Restart=always
User=$USER
WorkingDirectory=/home/RISE

# Add environment variables for username and password (optional)
Environment="USER_CREATE_USERNAME=$username"
Environment="USER_CREATE_PASSWORD=$password"  # Consider security implications

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd and start service
echo "Reloading systemd and enabling the service..."
systemctl daemon-reload
systemctl enable rise_scan.service
systemctl start rise_scan.service

echo "Service setup complete and started."