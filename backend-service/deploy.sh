#!/usr/bin/env bash
set -e

BRANCH="${1:-main}"

echo "🚀 Deploying backend branch: $BRANCH..."

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

npm install --omit=dev

mkdir -p uploads

if [ "$2" == "--seed" ]; then
  echo "🌱 Running database seeds..."
  npm run seed
fi

if pm2 list | grep -q "backend-service"; then
  echo "🔄 Reloading PM2 process..."
  pm2 reload backend-service --update-env
else
  echo "▶️ Starting PM2 process..."
  pm2 start index.js --name "backend-service" -i max --env production
fi

pm2 save
pm2 status backend-service
echo "✅ Deployment finished successfully!"