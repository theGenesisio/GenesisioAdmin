import { isValidObjectId } from 'mongoose';
import { Admin, AdminRefreshToken, Billing, CopyTrade, Investment, KYC, Mail, models, Notification, Plan, Trader, User } from '../models.js';

/**
 * Delete an admin refresh token entry.
 * @param {string} token - The refresh token to delete.
 * @returns {boolean} - True if the token was deleted, false otherwise.
 */
const deleteAdminRefreshTokenEntry = async (token) => {
    try {
        // Attempt to delete the document based on the token
        const result = await AdminRefreshToken.findOneAndDelete({ token });

        // If the document is found and deleted
        if (result) {
            return true; // Indicating success
        } else {
            console.warn(`No refresh token found with token: ${token}`);
            return false; // If no token matched, return false
        }
    } catch (error) {
        // Log the error with more context for easier debugging
        console.error('Error deleting refresh token entry:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false; // Return false if there was an error during the deletion process
    }
};

/**
 * Delete a billing option.
 * @param {string} _id - The ID of the billing option to delete.
 * @returns {boolean} - True if the billing option was deleted, false otherwise.
 */
const deleteBillingOption = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the billing option by ID
        const result = await Billing.findByIdAndDelete(_id);

        if (result) {
            console.log(`Billing option deleted successfully: ${_id}`);
            return true;
        } else {
            console.warn(`Billing option not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting billing option:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a trader.
 * @param {string} _id - The ID of the trader to delete.
 * @returns {boolean} - True if the trader was deleted, false otherwise.
 */
const deleteTrader = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the billing option by ID
        const result = await Trader.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Trader not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting Trader:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Delete a transaction entry (deposit or withdrawal).
 * @param {string} _id - The ID of the transaction entry to delete.
 * @param {number} modelIndex - The index of the model to use (default is 4).
 * @returns {boolean} - True if the transaction entry was deleted, false otherwise.
 */
const deleteTransactionEntry = async (_id, modelIndex = 4) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            console.error('Invalid _id provided:', _id);
            return false;
        }

        // Attempt to delete the transaction entry by ID
        const result = await models[modelIndex].findByIdAndDelete(_id);

        if (result) {
            console.log(`Transaction entry deleted successfully: ${_id}`);
            return true;
        } else {
            console.warn(`Transaction entry not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting transaction entry:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};

/**
 * Delete a notification.
 * @param {string} _id - The ID of the notification to delete.
 * @returns {boolean} - True if the notification was deleted, false otherwise.
 */
const deleteNotification = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the notification by ID
        const result = await Notification.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Notification not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting notification:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a mail log.
 * @param {string} _id - The ID of the mail log to delete.
 * @returns {boolean} - True if the mail log was deleted, false otherwise.
 */
const deleteMailLog = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the mailLog by ID
        const result = await Mail.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Mail log not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting mail log:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a plan.
 * @param {string} _id - The ID of the plan to delete.
 * @returns {boolean} - True if the plan was deleted, false otherwise.
 */
const deletePlan = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the doc by ID
        const result = await Plan.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Plan not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting plan:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a copy trade.
 * @param {string} _id - The ID of the trade to delete.
 * @returns {boolean} - True if the trade was deleted, false otherwise.
 */
const deleteCopyTrade = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the doc by ID
        const result = await CopyTrade.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Copy trade not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting copy trade:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete an investment.
 * @param {string} _id - The ID of the investment to delete.
 * @returns {boolean} - True if the investment was deleted, false otherwise.
 */
const deleteInvestment = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the doc by ID
        const result = await Investment.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Investment not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting investment:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a user.
 * @param {string} _id - The ID of the user to delete.
 * @returns {boolean} - True if the user was deleted, false otherwise.
 */
const deleteUser = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the user by ID
        const result = await User.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`User not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting user:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete an admin.
 * @param {string} _id - The ID of the admin to delete.
 * @returns {boolean} - True if the admin was deleted, false otherwise.
 */
const deleteAdmin = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the admin by ID
        const result = await Admin.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`Admin not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting admin:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
/**
 * Delete a KYC Record.
 * @param {string} _id - The ID of the record to delete.
 * @returns {boolean} - True if the record was deleted, false otherwise.
 */
const deleteKYC = async (_id) => {
    try {
        // Validate _id as a valid MongoDB ObjectId
        if (!isValidObjectId(_id)) {
            throw new Error('Invalid _id provided');
        }

        // Attempt to delete the user by ID
        const result = await KYC.findByIdAndDelete(_id);

        if (result) {
            return true;
        } else {
            console.warn(`KYC record not found or not deleted: ${_id}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting kyc record:', {
            message: error.message || error,
            stack: error.stack || 'No stack trace available',
        });
        return false;
    }
};
export {
    deleteAdminRefreshTokenEntry,
    deleteBillingOption,
    deleteTransactionEntry,
    deleteNotification,
    deletePlan,
    deleteInvestment,
    deleteUser,
    deleteKYC,
    deleteAdmin,
    deleteMailLog, deleteTrader, deleteCopyTrade
};