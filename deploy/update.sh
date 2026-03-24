#!/bin/bash
# ================================================
# LOCSA — Script de mise à jour
# Usage: bash update.sh
# ================================================

cd /home/ubuntu/locsa

echo "Mise à jour de LOCSA..."
git pull origin main
docker-compose down
docker-compose up -d --build
echo "Mise à jour terminée !"