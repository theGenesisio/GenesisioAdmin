import dotenv from 'dotenv'
dotenv.config()
import { Router as _Router } from 'express';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { generateAccessToken } from './helpers.js'
import { createAdmin, createRefreshTokenEntry } from '../mongodb/methods/create.js';
import { findAny, findOneFilter } from '../mongodb/methods/read.js';
import { getSafeAdmin, parseUserAgentWithFallback } from '../helpers.js';
import { updateAdminFields } from '../mongodb/methods/update.js';
import { addDefaultAdmin, authenticate } from './middlware.js';
import { deleteAdmin, deleteAdminRefreshTokenEntry } from '../mongodb/methods/delete.js';
const Router = _Router();
Router.route('/login')
    .post(addDefaultAdmin, async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        const admin = await findOneFilter({ username: username }, 7);

        if (!admin) {
            return res.status(404).json({ message: 'No admin found' });
        }
        if (admin.blocked) {
            return res.status(401).json({ message: 'Admin account is blocked, contact other admins to clarify' });
        }
        try {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }
            if (passwordMatch) {
                const { _id } = admin;
                const safeAdminData = await getSafeAdmin(admin);
                const ACCESS_TOKEN = await generateAccessToken(safeAdminData);
                const REFRESH_TOKEN = JWT.sign(safeAdminData, process.env.JWT_REFRESH_TOKEN_SECRET);

                // Extract IP Address
                const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

                // Parse User-Agent with fallback
                const userAgentHeader = req.headers['user-agent'] || '';
                const { browser, os, device } = parseUserAgentWithFallback(userAgentHeader);

                const lastLoginDetails = {
                    ipAddress,
                    browser,
                    os,
                    device,
                };

                // Update admin fields with last login details
                const [updatedAdmin, savedToken] = await Promise.all([
                    updateAdminFields(_id, {
                        active: true,
                        lastSeen: new Date().toUTCString(),
                        lastLoginDetails,
                    }),
                    createRefreshTokenEntry(REFRESH_TOKEN),
                ]);

                let adminToSend = await getSafeAdmin(updatedAdmin);

                return res.status(200).json({
                    accessToken: ACCESS_TOKEN,
                    refreshToken: savedToken?.token || null,
                    admin: adminToSend,
                    message: 'Login successful',
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'An error occurred during login' });
        }
    });
Router.route('/logout')
    .delete(authenticate, async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: 'Refresh token is required' });
            }
            const [updateResult, deleteResult] = await Promise.all([
                updateAdminFields(req.admin._id, { active: false }),
                deleteAdminRefreshTokenEntry(refreshToken)
            ]);

            const result = updateResult && deleteResult;

            if (!result) {
                return res.status(500).json({ message: 'Logout failed, token not found or deletion failed' });
            }

            // Respond with success if token is deleted
            res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            // Handle any other unexpected errors
            console.error('Error during logout process:', error);
            res.status(500).json({ message: 'An error occurred during logout' });
        }
    });
Router.route('/manage-admins')
    .post(authenticate, async (req, res) => {
        const { username: newAdminUsername, password } = req.body;

        // Validate request body
        if (!newAdminUsername || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        const { _id, username: admin } = req.admin;

        try {
            // Create new admin
            const newAdmin = await createAdmin({ username: newAdminUsername, password, id: _id, admin });
            if (!newAdmin) {
                return res.status(500).json({ message: 'Admin creation failed' });
            }

            return res.status(200).json({ message: 'Admin created successfully', success: true });
        } catch (error) {
            console.error('Error creating admin:', error);
            return res.status(500).json({ message: 'An error occurred during admin creation' });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const admins = await findAny(7); // Adjust the filter and projection as needed
            if (!admins) {
                return res.status(404).json({ message: 'No admins found' });
            }
            return res.status(200).json({ message: 'Admins found', admins });
        } catch (error) {
            console.error('Error fetching admins:', error);
            return res.status(500).json({ message: 'An error occurred while fetching admins' });
        }
    })
    .put(authenticate, async (req, res) => {
        const { _id, status } = req.body;

        if (!_id || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const updatedAdmin = await updateAdminFields(_id, { blocked: status === 'blocked' });
            if (!updatedAdmin) {
                return res.status(500).json({ message: 'Failed to update admin status' });
            }

            return res.status(200).json({ message: 'Admin status updated successfully', success: true });
        } catch (error) {
            console.error('Error updating admin status:', error);
            return res.status(500).json({ message: 'An error occurred while updating admin status' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const deletedAdmin = await deleteAdmin(_id);
            if (!deletedAdmin) {
                return res.status(500).json({ message: 'Failed to delete admin' });
            }

            return res.status(200).json({ message: 'Admin deleted successfully', success: true });
        } catch (error) {
            console.error('Error deleting admin:', error);
            return res.status(500).json({ message: 'An error occurred while deleting admin' });
        }
    });
export default Router;