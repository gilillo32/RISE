#!/bin/bash

SERVICE_PATH="/etc/systemd/system/rise_scan.service"
SCRIPT_PATH="/home/RISE/nuclei/run_scan_process.sh"

# Crear el archivo del servicio
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

[Install]
WantedBy=multi-user.target
EOL

# Recargar systemd y habilitar el servicio
echo "Reloading systemd and enabling the service..."
systemctl daemon-reload
systemctl enable rise_scan.service
systemctl start rise_scan.service

echo "Service setup complete and started."
