#!/bin/bash
PROJECT_PATH="/www/wwwroot/bpi-app"
ZIP_PATH="/www/wwwroot/bpi-app.zip"

echo "--- Remote Deployment Started ---"
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH || { echo "Failed to cd to $PROJECT_PATH"; exit 1; }

echo "Unzipping files..."
unzip -o $ZIP_PATH -d .

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
node migrate.js || echo "Migration warning: could not finish migrations"

# echo "Syncing Process Steps to Action Tracker..."
# node sync_tasks.js || echo "Sync warning: could not finish task sync"

echo "Building application..."
rm -rf .next
npm run build

echo "Restarting PM2 process..."
pm2 stop bpi_app_v03 || true
pm2 delete bpi_app_v03 || true
pm2 start server.js --name "bpi_app_v03" --env production

echo "Cleaning up..."
rm $ZIP_PATH

echo "--- Remote Deployment Finished ---"
