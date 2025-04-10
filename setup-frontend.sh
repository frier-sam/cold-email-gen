!bin/bash

cd ../frontend

# Install dependencies
npm install

# Create .env file for the frontend
cat > .env << EOL
VITE_API_URL=http://localhost:8000/api
EOL

# Build the frontend
npm run build

# Create a systemd service file for the frontend
sudo tee /etc/systemd/system/cold-email-frontend.service > /dev/null << EOL
[Unit]
Description=Cold Email Generator Frontend
After=network.target

[Service]
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which npm) run preview -- --host 127.0.0.1 --port 3000
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
sudo systemctl enable cold-email-frontend
sudo systemctl start cold-email-frontend