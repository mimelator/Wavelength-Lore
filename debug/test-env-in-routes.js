#!/usr/bin/env node

const express = require('express');
const app = express();

app.get('/test-env', (req, res) => {
    console.log('Environment check in route:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- FIREBASE_SERVICE_ACCOUNT exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    res.json({
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
    });
});

const server = app.listen(3003, () => {
    console.log('Env test server on 3003');
    setTimeout(() => {
        server.close();
        process.exit(0);
    }, 2000);
});