import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): MikroOrmModuleOptions => ({
  driver: PostgreSqlDriver,
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  user: configService.get<string>('DATABASE_USER', 'vibescan'),
  password: configService.get<string>('DATABASE_PASSWORD', 'vibescan_password'),
  dbName: configService.get<string>('DATABASE_NAME', 'vibescan'),
  entities: ['./dist/entities/**/*.js'],
  entitiesTs: ['./src/entities/**/*.ts'],
  debug: configService.get<string>('NODE_ENV') === 'development',
  allowGlobalContext: true,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});
