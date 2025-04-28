import { isValidObjectId } from 'mongoose';
import { Admin, Billing, Deposit, Investment, KYC, LiveTrade, Trader, User, Whatsapp, WithdrawalRequest } from '../models.js';

/**
 * Update or create a deposit option.
 * @param {Object} optionData - The data for the deposit option.
 * @returns {Object|boolean} - The updated or created deposit option, or false if an error occurred.
 */
const updateDepositOption = async (optionData) => {
    try {
        const option = await Billing.findOneAndUpdate(
            { name: optionData.name },
            { $set: optionData },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );
        return option;
    } catch (error) {
        console.error('Error updating or creating deposit option:', error);
        return false;
    }
};
/**
 * Update or create a trader.
 * @param {Object} traderData - The data for the trader.
 * @returns {Object|boolean} - The updated or created trader, or false if an error occurred.
 */
const updateTrader = async (traderData) => {
    try {
        const option = await Trader.findOneAndUpdate(
            { name: traderData.name },
            { $set: traderData },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );
        return option;
    } catch (error) {
        console.error('Error updating or trader:', error);
        return false;
    }
};

/**
 * Update a deposit entry.
 * @param {string} depositId - The ID of the deposit entry.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated deposit entry, or false if an error occurred.
 */
const updateDepositEntry = async (depositId, updatedFields) => {
    try {
        const result = await Deposit.findByIdAndUpdate(
            depositId,
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!result) {
            throw new Error('Deposit entry not found');
        }
        return result;
    } catch (error) {
        console.error('Error updating deposit entry:', error);
        return false;
    }
};
/**
 * Update a deposit entry.
 * @param {string} id - The ID of the livetrade instance.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated deposit entry, or false if an error occurred.
 */
const updateLivetrade = async (id, updatedFields) => {
    try {
        const result = await LiveTrade.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!result) {
            throw new Error('Live trade entry not found');
        }
        return result;
    } catch (error) {
        console.error('Error updating live trade entry:', error);
        return false;
    }
};
/**
 * Update admin fields.
 * @param {string} adminId - The ID of the admin.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated admin, or false if an error occurred.
 */
const updateAdminFields = async (adminId, updatedFields) => {
    try {
        const result = await Admin.findOneAndUpdate(
            { _id: adminId },
            { $set: updatedFields },
            { new: true }
        );
        return result;
    } catch (error) {
        console.error('Error updating admin:', error);
        return false;
    }
};

/**
 * Update default admin fields.
 * @param {string} username - The username of the admin.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated admin, or false if an error occurred.
 */
const updateDefaultAdminFields = async (username, updatedFields) => {
    try {
        const result = await Admin.findOneAndUpdate(
            { username },
            { $set: updatedFields },
            {
                new: true,
                upsert: true
            }
        );
        return result;
    } catch (error) {
        console.error('Error updating admin:', error);
        return false;
    }
};

/**
 * Update the WhatsApp number.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated WhatsApp number, or false if an error occurred.
 */
const updateWhatsappNumber = async (updatedFields) => {
    try {
        const result = await Whatsapp.findOneAndUpdate(
            { number: { $exists: true } },
            { $set: updatedFields },
            {
                new: true,
                upsert: true
            }
        );
        return result;
    } catch (error) {
        console.error('Error updating WhatsApp number:', error);
        return false;
    }
};

/**
 * Confirm a deposit.
 * @param {Object} deposit - The deposit details.
 * @returns {Object|boolean} - The updated user, or false if an error occurred.
 */
const confirmDeposit = async (deposit) => {
    const requiredFields = ['_id', 'status', 'originalAmount', 'updatedAmount', 'user'];
    const missingFields = requiredFields.filter(field => !deposit[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing ${missingFields.length} required fields: ${missingFields.join(', ')}`);
    }
    if (deposit.status !== 'completed') {
        throw new Error('Status has to be "completed"');
    }
    if (!isValidObjectId(deposit._id)) {
        throw new Error('Invalid _id provided');
    }
    try {
        const user = await User.findById(deposit.user);
        if (!user) {
            throw new Error('User not found');
        }
        const { balance, totalDeposit, totalBonus, withdrawn } = user.wallet;
        const parsedBalance = parseFloat(balance);
        const parsedUpdatedAmount = parseFloat(deposit.updatedAmount);
        const parsedOriginalAmount = parseFloat(deposit.originalAmount);
        const parsedTotalDeposit = parseFloat(totalDeposit);
        const parsedTotalBonus = parseFloat(totalBonus);

        const newBalance = parsedBalance + parsedUpdatedAmount;
        const newTotalDeposit = parsedTotalDeposit + parsedOriginalAmount;
        const newTotalBonus = parsedTotalBonus + (parsedUpdatedAmount - parsedOriginalAmount);

        const result = await User.findByIdAndUpdate(
            deposit.user,
            { wallet: { balance: newBalance, totalDeposit: newTotalDeposit, totalBonus: newTotalBonus, withdrawn } },
            { new: true, runValidators: true }
        );
        return result;
    } catch (error) {
        console.error('Error confirming deposit:', error);
        return false;
    }
};

/**
 * Confirm a withdrawal.
 * @param {string} _id - The ID of the withdrawal request.
 * @returns {Object|boolean} - The updated user, or false if an error occurred.
 */
const confirmWithdrawal = async (_id) => {
    if (!isValidObjectId(_id)) {
        throw new Error('Invalid _id provided');
    }
    const withdrawal = await WithdrawalRequest.findById(_id);
    if (!withdrawal) {
        throw new Error('Withdrawal request not found');
    }
    let user;
    try {
        user = await User.findById(withdrawal.user);
    } catch (error) {
        console.error('Error finding user:', error);
        throw new Error('Error finding user');
    }
    if (!user) {
        throw new Error('User not found');
    }
    try {
        const { balance, totalDeposit, totalBonus, withdrawn } = user.wallet;
        const parsedBalance = parseFloat(balance);
        const parsedWithdrawalAmount = parseFloat(withdrawal.amount);
        const parsedWithdrawn = parseFloat(withdrawn);

        const newBalance = parsedBalance - parsedWithdrawalAmount;
        if (newBalance < 0) {
            throw new Error('Requested amount exceeds available balance');
        }
        const newWithdrawn = parsedWithdrawn + parsedWithdrawalAmount;

        const result = await User.findByIdAndUpdate(
            withdrawal.user,
            { wallet: { balance: newBalance, totalDeposit, totalBonus, withdrawn: newWithdrawn } },
            { new: true, runValidators: true }
        );
        return result;
    } catch (error) {
        console.error('Error confirming withdrawal:', error);
        return false;
    }
};

/**
 * Update a withdrawal entry.
 * @param {string} withdrawalId - The ID of the withdrawal entry.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated withdrawal entry, or false if an error occurred.
 */
const updateWithdrawalEntry = async (withdrawalId, updatedFields) => {
    try {
        // Check if status is "completed" and run confirmWithdrawal
        if (updatedFields.status === "completed") {
            const confirmationResult = await confirmWithdrawal(withdrawalId);
            if (!confirmationResult) {
                throw new Error('Withdrawal confirmation failed');
            }
        }
        const result = await WithdrawalRequest.findByIdAndUpdate(
            withdrawalId,
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!result) {
            throw new Error('Withdrawal entry not found');
        }
        return result;
    } catch (error) {
        console.error('Error updating withdrawal entry:', error);
        return false;
    }
};
/**
 * Update an investment entry.
 * @param {string} _id - The ID of the deposit entry.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated investment entry, or false if an error occurred.
 */
const updateInvestment = async (_id, status) => {
    try {
        const investment = await Investment.findById(_id);
        if (!investment) {
            throw new Error('Investment entry not found');
        }
        investment.status = status;
        await investment.save();  // This will trigger the pre-save hook
        return investment;
    } catch (error) {
        console.error('Error updating investment entry:', error);
        return false;
    }
};
/**
 * Update a livetrade and handle associated wallet updates.
 * @param {string} _id - The ID of the livetrade entry.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated livetrade entry or error details.
 */
const closeLiveTrade = async (_id, updatedFields) => {
    try {
        const trade = await LiveTrade.findById(_id);
        if (!trade) throw new Error('Investment entry not found');

        // Update trade fields
        Object.assign(trade, updatedFields, { closedAt: new Date() });
        await trade.save();

        // Exit early for negative exit prices
        if (trade.exitPrice < 0) return trade;

        const user = await User.findById(trade.user.id);
        if (!user) throw new Error('User not found');

        // Calculate updated wallet values for only profit since the cronjob will do the balance every 24 hours
        const updatedProfits = user.wallet.profits + trade.profitLoss;
        // Update wallet atomically
        const creditResult = await User.findByIdAndUpdate(
            user._id,
            { 'wallet.profits': updatedProfits },
            { new: true, runValidators: true }
        );
        return creditResult ? trade : false;
    } catch (error) {
        console.error('Error closing livetrade:', error.message);
        return { error: error.message };
    }
};

/**
 * Update user fields by user ID.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated user document or false on error.
 */
const updateUserFields = async (userId, updatedFields) => {
    try {
        const result = await User.findOneAndUpdate(
            { _id: userId },          // Filter criteria
            { $set: updatedFields },  // Fields to update
            { new: true }             // Return updated document
        );
        return result;
    } catch (error) {
        console.error(`Error updating user with ID ${userId}:`, error);
        return false;
    }
}
/**
 * Update a KYC record.
 * @param {string} id - The ID of the KYC entry.
 * @param {Object} updatedFields - The fields to update.
 * @returns {Object|boolean} - The updated KYC entry, or false if an error occurred.
 */
const updateKYCRecord = async (id, updatedFields) => {
    try {
        const result = await KYC.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true, runValidators: true }
        );
        if (!result) {
            throw new Error('KYC entry not found');
        }
        return result;
    } catch (error) {
        console.error('Error updating KYC entry:', error);
        return false;
    }
};

export {
    updateDepositOption,
    updateAdminFields,
    updateDefaultAdminFields,
    updateDepositEntry,
    updateWithdrawalEntry,
    updateWhatsappNumber,
    confirmDeposit,
    updateInvestment,
    updateUserFields,
    updateKYCRecord,
    updateLivetrade,
    closeLiveTrade,
    updateTrader
};