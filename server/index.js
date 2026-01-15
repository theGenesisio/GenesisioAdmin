import dotenv from 'dotenv';
dotenv.config();

import express, { json, urlencoded } from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Initialize express app and set port
const app = express();
const port = process.env.PORT || 1000;

// Handle file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = process.env.NODE_ENV === 'production' ? path.join(process.cwd(), "/server") : __dirname;

// Database connection with DNS fallback and retry logic
const connectToDatabase = async () => {
    const connectionOptions = {
        serverSelectionTimeoutMS: 100000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    };

    try {
        await mongoose.connect(process.env.MONGO_ATLAS_URI, connectionOptions);
        console.log('Connected to Genesisio db successfully');
    } catch (err) {
        console.error(`Initial connection failed: ${err.message}`);

        // If DNS error (ESERVFAIL, ENOTFOUND), retry after a short delay
        if (err.code === 'ESERVFAIL' || err.code === 'ENOTFOUND' || err.syscall === 'queryTxt') {
            console.log('DNS lookup failed, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                await mongoose.connect(process.env.MONGO_ATLAS_URI, {
                    ...connectionOptions,
                    family: 4, // Force IPv4 to avoid IPv6 DNS issues
                });
                console.log('Connected to Genesisio db successfully (retry)');
            } catch (retryErr) {
                console.error(`ERROR In Connection to Genesisio db: \n ${retryErr}`);
            }
        } else {
            console.error(`ERROR In Connection to Genesisio db: \n ${err}`);
        }
    }
};

// Start database connection
connectToDatabase();

// CORS Configuration
const allowedOrigins = {
    development: 'http://localhost:1234',
    production: 'https://admin-genesisio.vercel.app',
};

const corsOptions = {
    origin: allowedOrigins[process.env.NODE_ENV],
    methods: ["POST", "GET", "PATCH", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions)); // Handle CORS
app.use(json()); // Parse JSON bodies
app.use(urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(baseDir, "./public/"))); // Serve static files
app.set('trust proxy', 1); // Trust first proxy

// Import routes and cronjobs
import './src/cronjobs/refreshTokenJob.js';
import './src/cronjobs/Investmentjob.js';
import './src/cronjobs/ProfitsJob.js';
import './src/cronjobs/LivepricesJob.js';
import authRouter from './src/auth/JWT.js';
import indexRouter from './src/routes/indexRouter.js';
import imageRouter from './src/routes/imageRouter.js';

// API routes
app.use('/api/admin', indexRouter);
app.use('/api/admin/img', imageRouter);
app.use('/api/admin/auth', authRouter);

// Root endpoint
app.get('/', (req, res) => res.json({ message: ':)' }));

// Start the server
app.listen(port, () => console.log(`Admin server listening on http://localhost:${port}/`));
