#!/bin/bash
# ==============================================================================
# Script de Inicialização e Emissão de Certificados SSL Let's Encrypt via Certbot
# Subdomínio: guilermiii.duckdns.org
# ==============================================================================

set -e

DOMAINS=("guilermiii.duckdns.org" "www.guilermiii.duckdns.org")
RSA_KEY_SIZE=4096
DATA_PATH="./certbot"
EMAIL="${EMAIL:-guilermiii2003@gmail.com}" # E-mail para notificações de renovação da Let's Encrypt
STAGING="${STAGING:-0}" # Defina STAGING=1 para testar contra o ambiente de homologação do Let's Encrypt

PRIMARY_DOMAIN="${DOMAINS[0]}"

echo "=================================================="
echo "🔐 INICIANDO BOOTSTRAP SSL PARA: ${DOMAINS[*]}"
echo "=================================================="

if [ -d "$DATA_PATH/conf/live/$PRIMARY_DOMAIN" ] && [ -f "$DATA_PATH/conf/live/$PRIMARY_DOMAIN/fullchain.pem" ]; then
    echo "✔ Certificados SSL válidos já existem para $PRIMARY_DOMAIN."
    echo "Subindo o Nginx..."
    docker compose up -d nginx
    exit 0
fi

# Monta argumentos de domínio
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

# Argumento de staging
if [ "$STAGING" != "0" ]; then
    STAGING_ARG="--staging"
    echo "⚠ Modo STAGING ativado (certificados de teste da Let's Encrypt)."
else
    STAGING_ARG=""
fi

# Argumento de e-mail
if [ -z "$EMAIL" ]; then
    EMAIL_ARG="--register-unsafely-without-email"
else
    EMAIL_ARG="--email $EMAIL"
fi

echo "Passo 1: Garantindo que a porta 80 esteja livre parando o Nginx..."
docker compose stop nginx 2>/dev/null || true

echo "Passo 2: Solicitando certificado oficial Let's Encrypt via Certbot Standalone..."
docker run --rm -p 80:80 \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --standalone \
    --non-interactive \
    $STAGING_ARG \
    $EMAIL_ARG \
    $DOMAIN_ARGS \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos

echo "Passo 3: Iniciando Nginx com os novos certificados oficiais..."
docker compose up -d nginx

echo "=================================================="
echo "🎉 Certificados SSL emitidos e ativados com sucesso!"
echo "Acesse: https://$PRIMARY_DOMAIN"
echo "=================================================="
