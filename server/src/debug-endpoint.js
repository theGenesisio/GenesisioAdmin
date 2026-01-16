// TEMPORARY DEBUGGING ENDPOINT - Add to index.js before app.listen()
// Visit https://your-deployment.vercel.app/api/admin/debug to see what's wrong
// DELETE THIS FILE AND THE ENDPOINT AFTER DEBUGGING!

/*
Add this to your index.js:

import debugRouter from './src/debug-endpoint.js';
app.use('/api/admin', debugRouter);
*/

import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/debug', async (req, res) => {
    const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    // Test database read operation
    let dbTestResult = {
        success: false,
        error: null,
        userCount: null,
        executionTime: null
    };

    try {
        const startTime = Date.now();
        // Import User model for a lightweight read test
        const { models } = await import('./mongodb/models.js');
        const User = models[1]; // User model is at index 1

        const count = await User.countDocuments().maxTimeMS(5000); // 5 second timeout
        const executionTime = Date.now() - startTime;

        dbTestResult = {
            success: true,
            error: null,
            userCount: count,
            executionTime: `${executionTime}ms`
        };
    } catch (error) {
        dbTestResult = {
            success: false,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                syscall: error.syscall
            },
            userCount: null,
            executionTime: null
        };
    }

    const debug = {
        timestamp: new Date().toISOString(),
        server: 'GenesisioAdmin',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            isProduction: process.env.NODE_ENV === 'production',
            isVercel: !!process.env.VERCEL,
            vercelEnv: process.env.VERCEL_ENV
        },
        database: {
            hasConnectionString: !!process.env.MONGO_ATLAS_URI,
            connectionStringStart: process.env.MONGO_ATLAS_URI
                ? process.env.MONGO_ATLAS_URI.substring(0, 30) + '...'
                : 'NOT SET',
            mongooseState: mongoStates[mongoose.connection.readyState],
            stateCode: mongoose.connection.readyState,
            connectionName: mongoose.connection.name || 'not connected',
            host: mongoose.connection.host || 'no host',
        },
        databaseTest: dbTestResult,
        environment_variables: {
            hasJwtAccessSecret: !!process.env.JWT_ACCESS_TOKEN_SECRET,
            hasJwtRefreshSecret: !!process.env.JWT_REFRESH_TOKEN_SECRET,
            hasClientUrl: !!process.env.CLIENT_URL,
            hasResendKey: !!process.env.RESEND_API_KEY,
            clientUrl: process.env.CLIENT_URL || 'NOT SET'
        }
    };

    const status = mongoose.connection.readyState === 1 && dbTestResult.success ? 200 : 503;
    res.status(status).json(debug);
});

export default router;
