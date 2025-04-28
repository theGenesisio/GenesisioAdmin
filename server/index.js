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

// Database connection
mongoose.connect(process.env.MONGO_ATLAS_URI, {
    serverSelectionTimeoutMS: 100000,
})
    .then(() => console.log('Connected to zenith db successfully'))
    .catch(err => console.log(`ERROR In Connection to zenith db: \n ${err}`));

// CORS Configuration
const allowedOrigins = {
    development: 'http://localhost:1234',
    production: 'https://zenithadmin.vercel.app',
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
