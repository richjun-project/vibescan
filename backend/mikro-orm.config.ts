import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export default defineConfig({
  driver: PostgreSqlDriver,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'vibescan',
  password: process.env.DATABASE_PASSWORD || 'vibescan_password',
  dbName: process.env.DATABASE_NAME || 'vibescan',
  entities: ['./dist/entities/**/*.js'],
  entitiesTs: ['./src/entities/**/*.ts'],
  debug: true,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
});
