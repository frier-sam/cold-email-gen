!/bin/bash
# This script sets up the backend for the Cold Email Generator project.


cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
DATABASE_URL=sqlite:///./coldmail.db
SECRET_KEY=your-secure-secret-key
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-35-turbo
DEFAULT_MAX_COMPANIES=5
DEFAULT_MAX_WEBSITES_PER_EMAIL=3
DEFAULT_MAX_EMAILS_PER_DAY=10
EOL

# Create a systemd service file for the backend
sudo tee /etc/systemd/system/cold-email-backend.service > /dev/null << EOL
[Unit]
Description=Cold Email Generator Backend
After=network.target

[Service]
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
Environment="PATH=$(pwd)/venv/bin"

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
sudo systemctl enable cold-email-backend
sudo systemctl start cold-email-backend