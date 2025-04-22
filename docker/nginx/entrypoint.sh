#!/bin/sh
set -e
# Verifica si el certificado ya existe
if [ ! -f /etc/nginx/certs/selfsigned.crt ]; then
 echo "Generando certificado autofirmado..."
 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
 -subj "/C=ES/ST=Granada/L=Granada/O=IESHLANZ/OU=DAWT/CN=Fernando_Rodriguez_Arcos/emailAddress=FRA@ieshlanz.es" \
 -keyout /etc/nginx/certs/selfsigned.key \
 -out /etc/nginx/certs/selfsigned.crt
fi
# Ejecuta Nginx en primer plano
exec nginx -g "daemon off;"