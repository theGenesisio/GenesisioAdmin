import { Router as _Router } from "express";
import { Readable } from 'stream';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';

const Router = _Router();
// Set up GridFS
let gfsBilling, gfsDeposits, gfsProfilePics, gfsKYC, gfsTraderImg;
mongoose.connection.once('open', () => {
    gfsBilling = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'billingOptions' });
    gfsDeposits = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'deposits' });
    gfsProfilePics = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'profile_pics' });
    gfsKYC = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'kyc' });
    gfsTraderImg = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'traderImg' });
});

// Configure Multer for file uploads (store temporarily in memory)
const storageBilling = multer.memoryStorage();
const storageTrader = multer.memoryStorage();
const storageDeposits = multer.memoryStorage();
const uploadBilling = multer({ storageBilling });
const uploadTraderImg = multer({ storageTrader });
const uploadDeposits = multer({ storage: storageDeposits });
// view deposit receipt
Router.route('/image/deposit/:id')
    .get((req, res) => {
        const fileId = req.params.id;
        // MongoDB ObjectId regex pattern
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;

        // Validate fileId against the regex
        if (!objectIdRegex.test(fileId)) {
            return res.status(400).json({ message: 'Invalid fileId format' });
        }
        const downloadStream = gfsDeposits.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on('error', (err) => {
            console.error('Error retrieving deposit:', err);
            res.status(404).json({ message: 'File not found' });
        });

        downloadStream.on('file', (file) => {
            res.setHeader('Content-Type', file.contentType || 'application/octet-stream'); // Adjust MIME type as needed
        });

        downloadStream.pipe(res);
    });
// view trader img
Router.route('/image/trader/:id')
    .get((req, res) => {
        const fileId = req.params.id;
        // MongoDB ObjectId regex pattern
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;

        // Validate fileId against the regex
        if (!objectIdRegex.test(fileId)) {
            return res.status(400).json({ message: 'Invalid fileId format' });
        }
        const downloadStream = gfsTraderImg.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on('error', (err) => {
            console.error('Error retrieving trader  img:', err);
            res.status(404).json({ message: 'File not found' });
        });

        downloadStream.on('file', (file) => {
            res.setHeader('Content-Type', file.contentType || 'application/octet-stream'); // Adjust MIME type as needed
        });

        downloadStream.pipe(res);
    });
// view kyc docs
Router.route('/image/kyc/:id')
    .get((req, res) => {
        const fileName = req.params.id;
        gfsKYC.find({ filename: fileName }).toArray()
            .then(files => {
                if (!files || files.length === 0) {
                    return res.status(404).json({ message: 'File not found' });
                }
                const file = files[0];
                const stream = gfsKYC.openDownloadStream(file._id);

                stream.on('error', (err) => {
                    console.error('Error retrieving KYC:', err);
                    res.status(404).json({ message: 'File not found' });
                });
                res.setHeader('Content-Type', file.contentType || 'application/octet-stream'); // Adjust MIME type as needed
                stream.pipe(res);
            })
            .catch(err => {
                console.error('Error retrieving KYC:', err);
                res.status(500).json({ message: 'Internal server error' });
            });
    });
// view propfile pics
Router.route('/image/profile-pic/:id')
    .get((req, res) => {
        const fileId = req.params.id;
        // MongoDB ObjectId regex pattern
        const objectIdRegex = /^[a-fA-F0-9]{24}$/;

        // Validate fileId against the regex
        if (!objectIdRegex.test(fileId)) {
            return res.status(400).json({ message: 'Invalid fileId format' });
        }
        const downloadStream = gfsProfilePics.openDownloadStream(new mongoose.Types.ObjectId(fileId));

        downloadStream.on('error', (err) => {
            console.error('Error retrieving profile picture:', err);
            res.status(404).json({ message: 'File not found' });
        });

        res.setHeader('Content-Type', 'image/jpeg'); // Adjust MIME type as needed
        downloadStream.pipe(res);
    });
export {
    gfsBilling, gfsDeposits, gfsProfilePics, gfsKYC, uploadDeposits, uploadBilling, gfsTraderImg, uploadTraderImg
}
export default Router;
