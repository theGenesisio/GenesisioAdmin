import { Admin, AdminRefreshToken, CopyTrade, Mail, Notification, Plan, Topup, User } from '../models.js';
import { dbSaveDoc } from './middlewares.js';
import bcrypt from 'bcryptjs';

/**
 * Create a new admin.
 * @param {Object} adminData - The data for the new admin.
 * @returns {Object|boolean} - The created admin, or false if an error occurred.
 */
const createAdmin = async (adminData = {}) => {
    const { password, username, id, admin } = adminData;

    // Check for missing required fields
    const requiredFields = ['username', 'password', 'id', 'admin'];
    const missingFields = requiredFields.filter(field => !adminData[field]);

    try {
        if (missingFields.length > 0) {
            throw new Error(`Missing ${missingFields.length} required fields: ${missingFields.join(', ')}`);
        }

        // Check if the username already exists
        const existingUser = await Admin.findOne({ username });
        if (existingUser) {
            throw new Error("Admin already exists");
        }
    } catch (error) {
        console.error('Error creating admin:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }

    // Hash the password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
        console.error('Error hashing password:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }

    // Prepare admin object
    const newAdmin = new Admin({
        createdBy: {
            id: id,
            username: admin
        },
        password: hashedPassword,
        username,
        lastSeen: new Date().toISOString()
    });

    try {
        // Save the admin
        const result = await dbSaveDoc(newAdmin);
        return result
    } catch (error) {
        console.error('Error creating admin:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Create a new notification.
 * @param {Object} details - The details of the notification.
 * @returns {Object|boolean} - The created notification, or false if an error occurred.
 */
const createNotification = async (details = {}) => {
    const { message, type, expiryDate, targets } = details;
    const requiredFields = ['message', 'type', 'expiryDate', 'targets'];
    const missingFields = requiredFields.filter(field => !details[field]);

    if (missingFields.length > 0) {
        console.warn(`Missing ${missingFields.length} required fields:\n${missingFields.join(', ')}`);
        return false;
    }

    const notification = new Notification({
        message,
        type,
        expiryDate,
        targets,
    });

    try {
        const result = await dbSaveDoc(notification);
        return result;
    } catch (error) {
        console.error('Error creating notification:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Create a new plan.
 * @param {Object} details - The details of the plan.
 * @param {string} details.name - The name of the plan.
 * @param {number} details.max - The maximum limit for the plan.
 * @param {number} details.min - The minimum limit for the plan.
 * @param {number} details.ROIPercentage - The ROI percentage for the plan.
 * @param {number} details.duration - The duration of the plan.
 * @returns {Object|boolean} - The created plan, or false if an error occurred.
 */
const createPlan = async (details = {}) => {
    const { name, max, min, ROIPercentage, duration } = details;
    const requiredFields = ['name', 'max', 'min', 'ROIPercentage', 'duration'];
    const missingFields = requiredFields.filter(field => !details[field]);

    if (missingFields.length > 0) {
        console.warn(`Missing ${missingFields.length} required fields:\n${missingFields.join(', ')}`);
        return false;
    }

    const plan = new Plan({
        name, limits: { max, min }, ROIPercentage, duration
    });

    try {
        const result = await dbSaveDoc(plan);
        return result;
    } catch (error) {
        console.error('Error creating plan:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Create a new refresh token entry.
 * @param {Object} tokenData - The data for the refresh token.
 * @returns {Object|boolean} - The created refresh token entry, or false if an error occurred.
 */
const createRefreshTokenEntry = async (tokenData) => {
    const refreshToken = new AdminRefreshToken({ token: tokenData });

    try {
        const result = await dbSaveDoc(refreshToken);
        return result;
    } catch (error) {
        console.error('Error creating refresh token entry:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Create a new top-up record and update the user's wallet.
 * @param {Object} details - The details of the top-up.
 * @param {number} details.amount - The amount to top up.
 * @param {string} details.description - The description of the top-up.
 * @param {string} details.userDetails - The details of the user to top up.
 * @returns {Object|boolean} - The updated user, or false if an error occurred.
 */
const createTopup = async (details = {}) => {
    const { amount, description, userDetails, affectedBalance } = details;
    const requiredFields = ['amount', 'description', 'userDetails', 'affectedBalance'];
    const missingFields = requiredFields.filter(field => !details[field]);

    if (missingFields.length > 0) {
        console.warn(`Missing ${missingFields.length} required fields:\n${missingFields.join(', ')}`);
        return false;
    }
    const allowedBalances = ['balance', 'totalDeposit', 'totalBonus', 'profits', 'withdrawn', 'referral'];

    if (!allowedBalances.includes(affectedBalance)) {
        console.warn("Invalid affected balance type.");
        return false
    }
    const user = await User.findById(userDetails.userId);
    if (!user) {
        console.warn('User not found');
        return false;
    }

    const topup = new Topup({
        amount, description, user: userDetails, affectedBalance
    });

    try {
        const result = await dbSaveDoc(topup);
        if (!result) {
            throw new Error('Topup was not saved.');
        }
        const newTopup = parseFloat(user.wallet.topup) + parseFloat(amount);
        const newAffectedBalance = parseFloat(user.wallet[affectedBalance]) + parseFloat(amount);

        const updatedUser = await User.findByIdAndUpdate(
            userDetails.userId,
            {
                $set: {
                    'wallet.topup': newTopup,
                    [`wallet.${affectedBalance}`]: newAffectedBalance, // Dynamic key syntax
                }
            },
            { new: true, runValidators: true }
        );
        return updatedUser;
    } catch (error) {
        console.error('Error creating topup:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
const createMail = async (mailData) => {
    try {
        const mailLog = new Mail(mailData);
        // Use custom dbSaveDoc instead of the native save method
        const result = await dbSaveDoc(mailLog);
        if (!result) {
            throw new Error('Mail log was not saved.');
        }
        return !!result;
    } catch (error) {
        console.error('Error saving mail log:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Create a live trade entry.
 * @param {Object} params - Parameters for the copy trade.
 * @param {Object} params.details - The details of the copy trade.
 * @returns {Promise<boolean>} - True if the copy trade was created and balance debited successfully, otherwise false.
 */
const createCopyTrade = async ({ details }) => {
    // Initialize the live trade document with provided details and user info
    const copyTrade = new CopyTrade({
        type: details.type,
        currencyPair: details.currencyPair,
        entryPrice: details.entryPrice,
        stopLoss: details.stopLoss,
        takeProfit: details.takeProfit,
        action: details.action,
        time: details.time,
        trader: details.trader
    });

    try {
        // Save the copy trade document to the database
        const result = await dbSaveDoc(copyTrade);
        if (!result) {
            throw new Error('Failed to save copy trade document');
        }
        return !!result
    } catch (error) {
        console.error('Error creating copy trade entry:', {
            message: error.message,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
export { createRefreshTokenEntry, createAdmin, createNotification, createPlan, createTopup, createMail, createCopyTrade };
