!bin/bash

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/cold-email-generator.conf > /dev/null << EOL
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:8000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Create a symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/cold-email-generator.conf /etc/nginx/sites-enabled/

# Test the configuration and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Configure SSL with Let's Encrypt (if you have a domain)
#sudo certbot --nginx -d your-domain.com -d www.your-domain.com