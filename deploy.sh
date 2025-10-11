#!/bin/bash

# Nombre de la aplicación en PM2
APP_NAME="pos"
PROJECT_ROOT=$(pwd)

echo "--- 🚀 Iniciando Despliegue de $APP_NAME ---"
echo "Ubicación: $PROJECT_ROOT"

# 1. ACTUALIZACIÓN DE CÓDIGO
echo "-> 1. Actualizando código fuente con Git pull..."
if ! git pull; then
  echo "🚨 ERROR: Fallo al ejecutar git pull. Abortando despliegue."
  exit 1
fi

# --- CAMBIO CLAVE AQUÍ ---
# 2. INSTALACIÓN DE DEPENDENCIAS (Incluyendo devDependencies para el build)
echo "-> 2. Instalando TODAS las dependencias (incluye DevDeps para el build)..."
if ! npm install; then # Se eliminó --production
  echo "🚨 ERROR: Fallo al instalar dependencias. Abortando despliegue."
  exit 1
fi
# -------------------------

# 3. GENERACIÓN DEL BUILD
echo "-> 3. Generando build de producción..."
if ! npm run build; then
  echo "🚨 ERROR: Fallo al generar el build. Abortando despliegue."
  exit 1
fi

# 4. DESPLIEGUE SIN INTERRUPCIÓN (Zero Downtime) con PM2
echo "-> 4. Verificando y reiniciando el servicio con PM2 (Zero Downtime)..."

if pm2 show $APP_NAME > /dev/null; then
  echo "🔄 Servidor '$APP_NAME' ya existe. Usando 'pm2 reload' (Zero Downtime)."
  if ! pm2 reload $APP_NAME --update-env; then
    echo "⚠️ ADVERTENCIA: 'pm2 reload' falló. Intentando 'pm2 restart' como fallback."
    pm2 restart $APP_NAME --update-env
  fi
else
  echo "✨ Servidor '$APP_NAME' no encontrado. Iniciando por primera vez."
  if ! pm2 start npm --name "$APP_NAME" -- start; then
    echo "🚨 ERROR: Fallo al iniciar la aplicación con PM2."
    exit 1
  fi
fi

echo "--- ✅ Despliegue Completado y Servidor Reiniciado ---"