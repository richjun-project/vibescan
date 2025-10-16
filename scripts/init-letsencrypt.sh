#!/bin/bash

# Let's Encrypt SSL 인증서 초기 설정 스크립트
# 사용법: ./scripts/init-letsencrypt.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정 파일에서 환경변수 로드
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production 파일이 없습니다!${NC}"
    echo "먼저 .env.production.example을 복사하여 .env.production을 생성하고 설정을 완료하세요."
    exit 1
fi

source .env.production

# 필수 환경변수 확인
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Error: DOMAIN과 EMAIL 환경변수가 설정되어야 합니다!${NC}"
    exit 1
fi

echo -e "${GREEN}=== VibeScan Let's Encrypt SSL 초기 설정 ===${NC}"
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo ""

# 기존 SSL 인증서 확인
if [ -d "nginx/ssl/live/$DOMAIN" ]; then
    read -p "기존 SSL 인증서가 존재합니다. 삭제하고 새로 발급하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}작업이 취소되었습니다.${NC}"
        exit 0
    fi
    echo -e "${YELLOW}기존 인증서를 삭제합니다...${NC}"
    sudo rm -rf nginx/ssl/live/$DOMAIN
    sudo rm -rf nginx/ssl/archive/$DOMAIN
    sudo rm -rf nginx/ssl/renewal/$DOMAIN.conf
fi

# 필요한 디렉토리 생성
echo -e "${GREEN}디렉토리 생성 중...${NC}"
mkdir -p nginx/ssl/live/$DOMAIN
mkdir -p nginx/certbot-www

# 더미 인증서 생성 (Nginx가 처음 시작할 수 있도록)
echo -e "${GREEN}더미 인증서 생성 중...${NC}"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot

# Docker Compose 서비스 시작 (Nginx 제외)
echo -e "${GREEN}데이터베이스 서비스 시작 중...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo -e "${GREEN}스캐너 서비스 시작 중...${NC}"
docker-compose -f docker-compose.prod.yml up -d nuclei zap trivy gitleaks

echo -e "${GREEN}백엔드 및 프론트엔드 빌드 및 시작 중...${NC}"
docker-compose -f docker-compose.prod.yml up -d backend frontend

# Nginx 시작
echo -e "${GREEN}Nginx 시작 중...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

# 더미 인증서 삭제
echo -e "${GREEN}더미 인증서 삭제 중...${NC}"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# 실제 Let's Encrypt 인증서 발급
echo -e "${GREEN}Let's Encrypt 인증서 발급 요청 중...${NC}"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN" certbot

# Nginx 재시작하여 새 인증서 적용
echo -e "${GREEN}Nginx 재시작 중...${NC}"
docker-compose -f docker-compose.prod.yml restart nginx

# Certbot 자동 갱신 컨테이너 시작
echo -e "${GREEN}Certbot 자동 갱신 서비스 시작 중...${NC}"
docker-compose -f docker-compose.prod.yml up -d certbot

echo ""
echo -e "${GREEN}=== SSL 인증서 발급 완료! ===${NC}"
echo -e "${GREEN}https://$DOMAIN 으로 접속 가능합니다.${NC}"
echo ""
echo "인증서는 자동으로 90일마다 갱신됩니다."
echo ""
echo "서비스 상태 확인: docker-compose -f docker-compose.prod.yml ps"
echo "로그 확인: docker-compose -f docker-compose.prod.yml logs -f"
