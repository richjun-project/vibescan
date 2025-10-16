"use strict";
exports.__esModule = true;
var postgresql_1 = require("@mikro-orm/postgresql");
var config = {
    driver: postgresql_1.PostgreSqlDriver,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'vibescan',
    password: process.env.DATABASE_PASSWORD || 'vibescan_password',
    dbName: process.env.DATABASE_NAME || 'vibescan',
    entities: ['./dist/entities/**/*.js'],
    entitiesTs: ['./src/entities/**/*.ts'],
    debug: process.env.NODE_ENV === 'development',
    allowGlobalContext: true
};
exports["default"] = config;
