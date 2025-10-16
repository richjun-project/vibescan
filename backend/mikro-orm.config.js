"use strict";
exports.__esModule = true;
var core_1 = require("@mikro-orm/core");
var postgresql_1 = require("@mikro-orm/postgresql");
exports["default"] = (0, core_1.defineConfig)({
    driver: postgresql_1.PostgreSqlDriver,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'vibescan',
    password: process.env.DATABASE_PASSWORD || 'vibescan_password',
    dbName: process.env.DATABASE_NAME || 'vibescan',
    entities: ['./dist/entities/**/*.js'],
    entitiesTs: ['./src/entities/**/*.ts'],
    debug: true,
    migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations'
    }
});
