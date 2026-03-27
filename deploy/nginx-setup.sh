#!/bin/bash
# ================================================
# LOCSA — Configuration Nginx + HTTPS (Certbot)
# Usage: bash nginx-setup.sh votre-domaine.com
# ================================================

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: bash nginx-setup.sh votre-domaine.com"
  exit 1
fi

echo "Configuration Nginx pour : $DOMAIN"

# Config Nginx
sudo tee /etc/nginx/sites-available/locsa > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/locsa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS avec Certbot
echo "Génération du certificat SSL..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo ""
echo "======================================"
echo " Nginx + HTTPS configurés !"
echo " App disponible sur : https://$DOMAIN"
echo "======================================"
