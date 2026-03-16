const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'kanban_db';

async function setupDatabase() {
    const config = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'postgres',
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to PostgreSQL...');

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Database ${DB_NAME} not found. Creating...`);
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`Database ${DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }

    const dbClient = new Client({
        ...config,
        database: DB_NAME,
    });

    try {
        await dbClient.connect();
        console.log(`Connected to ${DB_NAME}...`);

        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema initialization...');
        await dbClient.query(sql);
        console.log('Schema initialized successfully.');
    } catch (err) {
        console.error('Error initializing schema:', err);
        process.exit(1);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
