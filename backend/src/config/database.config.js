"use strict";
exports.__esModule = true;
exports.getDatabaseConfig = void 0;
var postgresql_1 = require("@mikro-orm/postgresql");
var getDatabaseConfig = function (configService) { return ({
    driver: postgresql_1.PostgreSqlDriver,
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get('DATABASE_PORT', 5432),
    user: configService.get('DATABASE_USER', 'vibescan'),
    password: configService.get('DATABASE_PASSWORD', 'vibescan_password'),
    dbName: configService.get('DATABASE_NAME', 'vibescan'),
    entities: ['./dist/entities/**/*.js'],
    entitiesTs: ['./src/entities/**/*.ts'],
    debug: configService.get('NODE_ENV') === 'development',
    allowGlobalContext: true,
    migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations'
    }
}); };
exports.getDatabaseConfig = getDatabaseConfig;
