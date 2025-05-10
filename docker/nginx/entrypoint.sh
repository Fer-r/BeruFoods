#!/bin/sh
set -e

CERT_COUNTRY=${CERT_COUNTRY:-"ES"}
CERT_STATE=${CERT_STATE:-"Granada"}
CERT_CITY=${CERT_CITY:-"Granada"}
CERT_ORG=${CERT_ORG:-"IESHLANZ"}
CERT_OU=${CERT_OU:-"DAWT"}
CERT_CN=${CERT_CN:-"Fernando Rodriguez Arcos"}
CERT_EMAIL=${CERT_EMAIL:-"frodarc876@g.educaand.es"}

# Verifica si el certificado ya existe
if [ ! -f /etc/nginx/certs/selfsigned.crt ]; then
 echo "Generando certificado autofirmado..."
 openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
 -subj "/C=${CERT_COUNTRY}/ST=${CERT_STATE}/L=${CERT_CITY}/O=${CERT_ORG}/OU=${CERT_OU}/CN=${CERT_CN}/emailAddress=${CERT_EMAIL}" \
 -keyout /etc/nginx/certs/selfsigned.key \
 -out /etc/nginx/certs/selfsigned.crt
fi
# Ejecuta Nginx en primer plano
exec nginx -g "daemon off;"