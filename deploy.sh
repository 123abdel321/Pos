#!/bin/bash

echo "🚀 Iniciando despliegue..."

git pull

echo "📦 Instalando dependencias..."
npm install --production

echo "🏗️ Generando build de producción..."
npm run build

echo "🔄 Reiniciando servidor con PM2..."
pm2 restart pos || pm2 start npm --name "pos" -- start

echo "✅ Despliegue completado."
