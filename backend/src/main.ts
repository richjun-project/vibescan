import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://vibescan.co.kr',  // New custom domain (main)
    'https://www.vibescan.co.kr',  // New custom domain (www)
    'https://ourvibescan.netlify.app',  // Production Netlify app (backup)
    'https://*.netlify.app',  // Netlify 배포된 앱
    'https://*.netlify.com',   // Netlify 프리뷰 배포
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // origin이 없으면 (같은 도메인) 허용
      if (!origin) return callback(null, true);

      // 허용된 origin 목록 체크
      const isAllowed = allowedOrigins.some(pattern => {
        if (pattern.includes('*')) {
          // 와일드카드 패턴 매칭
          const regex = new RegExp(pattern.replace('*', '.*'));
          return regex.test(origin);
        }
        return pattern === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Cloud Run uses PORT environment variable (default 8080)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');  // Listen on all interfaces for Cloud Run

  console.log(`🚀 VibeScan API running on http://0.0.0.0:${port}/api`);
}

bootstrap();
