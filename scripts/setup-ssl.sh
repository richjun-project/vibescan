#!/bin/bash

# VibeScan SSL Certificate Setup Script
# Let's Encrypt SSL 인증서 발급을 위한 스크립트

set -e  # 에러 발생시 스크립트 중단

echo "=================================="
echo "VibeScan SSL Certificate Setup"
echo "=================================="
echo ""

# 환경변수 로드
if [ -f .env.production ]; then
    export $(cat .env.production | grep DOMAIN | xargs)
else
    echo "❌ Error: .env.production 파일을 찾을 수 없습니다."
    exit 1
fi

# 도메인 확인
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: DOMAIN 환경변수가 설정되지 않았습니다."
    exit 1
fi

echo "🌐 도메인: $DOMAIN"
echo ""

# 이메일 입력
read -p "📧 이메일 주소를 입력하세요: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Error: 이메일 주소가 필요합니다."
    exit 1
fi

echo ""
echo "📋 설정 정보:"
echo "  - 도메인: $DOMAIN"
echo "  - 이메일: $EMAIL"
echo ""
read -p "계속하시겠습니까? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""
echo "🔧 nginx 및 certbot 컨테이너 시작 중..."
docker-compose -f docker-compose.prod.yml up -d nginx certbot

echo ""
echo "⏳ nginx가 완전히 시작될 때까지 5초 대기..."
sleep 5

echo ""
echo "🔐 SSL 인증서 발급 시작..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL 인증서가 성공적으로 발급되었습니다!"
    echo ""
    echo "🔄 nginx 재시작 중..."
    docker-compose -f docker-compose.prod.yml restart nginx

    echo ""
    echo "=================================="
    echo "✅ SSL 설정 완료!"
    echo "=================================="
    echo ""
    echo "📝 다음 단계:"
    echo "  1. https://$DOMAIN 으로 접속 확인"
    echo "  2. SSL 인증서 자동 갱신은 certbot 컨테이너가 처리합니다"
    echo ""
else
    echo ""
    echo "❌ SSL 인증서 발급에 실패했습니다."
    echo ""
    echo "트러블슈팅:"
    echo "  1. DNS 레코드가 올바르게 설정되었는지 확인하세요"
    echo "     - A 레코드: $DOMAIN -> 서버 IP"
    echo "     - A 레코드: www.$DOMAIN -> 서버 IP"
    echo "  2. 방화벽에서 80, 443 포트가 열려있는지 확인하세요"
    echo "  3. nginx 로그를 확인하세요:"
    echo "     docker-compose -f docker-compose.prod.yml logs nginx"
    echo ""
    exit 1
fi
