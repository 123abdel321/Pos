#!/bin/bash

echo "🚀 Iniciando despliegue de React/Next.js..."

# Ir al directorio del proyecto
cd /var/www/pos || exit

echo "📥 Ejecutando git pull..."
git pull

echo "📦 Instalando dependencias (si es necesario)..."
npm install --production

echo "🏗️ Compilando el proyecto..."
npm run build

echo "🔁 Reiniciando PM2..."
pm2 restart pos

echo "✅ Despliegue completado con éxito."
