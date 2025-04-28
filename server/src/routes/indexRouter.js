import { Router as _Router } from "express";
import { authenticate } from '../auth/middlware.js';
import { findAfterDate, findAny, findAnyFilter, findLastCreatedObjects, findOneFilter } from '../mongodb/methods/read.js';
import { uploadBilling, gfsBilling, gfsDeposits, gfsProfilePics, gfsKYC, uploadTraderImg, gfsTraderImg } from './imageRouter.js';
import { closeLiveTrade, confirmDeposit, updateDepositEntry, updateDepositOption, updateInvestment, updateKYCRecord, updateLivetrade, updateTrader, updateUserFields, updateWhatsappNumber, updateWithdrawalEntry } from '../mongodb/methods/update.js';
import { Readable } from 'stream';
import mongoose, { isValidObjectId } from 'mongoose';
import { deleteBillingOption, deleteNotification, deleteTransactionEntry, deletePlan, deleteInvestment, deleteUser, deleteKYC, deleteMailLog, deleteTrader, deleteCopyTrade } from '../mongodb/methods/delete.js';
import { User } from '../mongodb/models.js';
import { createCopyTrade, createMail, createNotification, createPlan, createTopup } from '../mongodb/methods/create.js';
import { mail } from '../auth/helpers.js';
import { getSafeAdmin } from '../helpers.js';

const Router = _Router();
// Route to get and delete transaction history
Router.route('/history/:type')
    .get(authenticate, async (req, res) => {
        const { type } = req.params;

        if (!['deposit', 'withdrawal', 'livetrade'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid history type. Allowed types are "deposit" and "withdrawal".',
            });
        }

        try {
            const history = await findAny(type === 'deposit' ? 4 : type === 'withdrawal' ? 5 : 14);

            if (!history || history.length === 0) {
                return res.status(404).json({
                    message: `${type.charAt(0).toUpperCase() + type.slice(1)} history not found.`,
                });
            }

            return res.status(200).json({
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} history found.`,
                history,
            });
        } catch (error) {
            console.error(`Error in fetching ${type} history data:`, error);
            return res.status(500).json({
                message: `An unexpected error occurred while fetching ${type} history.`,
            });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id, receipt = null } = req.body;
        const { type } = req.params;

        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }

        if (!['deposit', 'withdrawal', 'livetrade'].includes(type)) {
            return res.status(400).json({
                message: 'Invalid history type. Allowed types are "deposit","livetrade" and "withdrawal".',
            });
        }

        try {
            const modelIndex = type === 'deposit' ? 4 : type === 'withdrawal' ? 5 : 14;
            const result = await deleteTransactionEntry(_id, modelIndex);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }

            res.status(200).json({
                message: 'Successfully deleted transaction',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting transaction entry:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting.',
            });
        } finally {
            if (receipt && isValidObjectId(receipt)) {
                try {
                    await gfsDeposits.delete(new mongoose.Types.ObjectId(receipt));
                } catch (cleanupError) {
                    console.error('Error during cleanup of previous QR Code:', cleanupError);
                }
            }
        }
    });
// Route to edit transaction status
Router.route('/edit/:type')
    .put(authenticate, async (req, res) => {
        const { _id, status } = req.body;
        const type = req.params.type;
        try {
            let updatedTransaction;

            if (type === 'deposit') {
                updatedTransaction = await updateDepositEntry(_id, { status });
            } else if (type === 'withdrawal') {
                updatedTransaction = await updateWithdrawalEntry(_id, { status });
            } else {
                updatedTransaction = await updateLivetrade(_id, { status });
            }
            if (!updatedTransaction) {
                return res.status(500).json({ message: 'Error updating transaction entry' });
            }
            res.status(200).json({ message: 'Update successful', success: true });
        } catch (error) {
            console.error('Error updating transaction:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .post(authenticate, async (req, res) => {
        const { type } = req.params;

        try {
            // Handle deposit confirmation
            if (type === 'deposit') {
                const { _id, status, originalAmount, updatedAmount, user } = req.body;

                // Confirm deposit
                const confirmed = await confirmDeposit({ _id, status, originalAmount, updatedAmount, user });
                if (!confirmed) {
                    return res.status(500).json({ message: 'Error confirming deposit' });
                }

                // Update deposit entry with calculated bonus
                const bonus = updatedAmount - originalAmount;
                const updatedTransaction = await updateDepositEntry(_id, { bonus, status });
                if (!updatedTransaction) {
                    return res.status(500).json({ message: 'Error updating deposit entry' });
                }

                return res.status(200).json({ message: 'Deposit confirmed', success: true });
            }

            // Handle live trade updates
            if (type === 'livetrade') {
                const { _id, status, exitPrice, profitLoss } = req.body;

                // Prepare fields to update
                const updateFields = {
                    status,
                    exitPrice: parseFloat(exitPrice), // Ensure exit price is a number
                    profitLoss: parseFloat(profitLoss), // Ensure profit/loss is a number
                };
                // Update live trade entry
                const updatedTrade = await closeLiveTrade(_id, updateFields);
                if (!updatedTrade) {
                    return res.status(500).json({ message: 'Error updating live trade' });
                }

                return res.status(200).json({ message: 'Live trade closed successfully', success: true });
            }

            // Handle unknown types
            return res.status(400).json({ message: 'Invalid transaction type' });
        } catch (error) {
            console.error('Error handling transaction:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });

// Route to handle billing options
Router.route('/billing')
    .get(authenticate, async (req, res) => {
        try {
            const options = await findAny(3);
            if (!options || options.length < 1) {
                return res.status(404).json({ message: 'No billing options currently available' });
            }
            return res.status(200).json({ message: 'Billing options found', options });
        } catch (error) {
            console.error('Error in getting billing options:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .post(authenticate, uploadBilling.single('image'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No QR Code uploaded' });
        }
        const { name, address } = req.body;
        const fileName = `${req.admin._id}_billingOption_${name}_${Date.now()}`;
        const readableStream = Readable.from(req.file.buffer);

        const uploadStream = gfsBilling.openUploadStream(fileName, {
            contentType: req.file.mimetype,
        });

        readableStream.pipe(uploadStream)
            .on('error', (err) => {
                console.error('Error updating billing option:', err);
                res.status(500).json({ message: 'Error updating billing option' });
            })
            .on('finish', async () => {
                try {
                    const option = await updateDepositOption({
                        address, qrCode: uploadStream.id, name
                    });
                    if (!option) {
                        return res.status(500).json({ message: 'Error updating billing option' });
                    }
                    return res.status(200).json({ message: 'Update successful', success: true });
                } catch (error) {
                    console.error('Error updating billing option:', error);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }
            });
    })
    .delete(authenticate, async (req, res) => {
        const { _id, qrCode = null } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteBillingOption(_id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting billing option:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting.',
            });
        } finally {
            if (qrCode && isValidObjectId(qrCode)) {
                try {
                    await gfsBilling.delete(new mongoose.Types.ObjectId(qrCode));
                } catch (cleanupError) {
                    console.error('Error during cleanup of previous QR Code:', cleanupError);
                }
            }
        }
    });
// Route to handle WhatsApp number updates
Router.route('/whatsapp')
    .put(authenticate, async (req, res) => {
        const { phoneNumber } = req.body;
        // todo validate phoneNumber
        // return 400 if false
        try {
            const updatedNumber = await updateWhatsappNumber({ number: phoneNumber });
            if (!updatedNumber) {
                return res.status(404).json({ message: 'Update failed, please retry later' });
            }
            return res.status(200).json({ message: 'Update successful', updatedNumber });
        } catch (error) {
            console.error('Error in updating whatsapp number:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while updating whatsapp number.',
            });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const [number] = await findAny(9) || [];
            if (!number) {
                return res.status(404).json({ message: 'No whatsapp number currently available, please retry later' });
            }
            return res.status(200).json({ message: 'Whatsapp number found', number });
        } catch (error) {
            console.error('Error in getting current whatsapp number:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
// Route to handle notifications
Router.route('/notifications')
    .post(authenticate, async (req, res) => {
        const { message, type, expiryDate, targets } = req.body;
        const validTargets = [];
        const invalidTargets = [];
        const matchedTargets = [];

        // Remove duplicate entries from targets
        const uniqueTargets = [...new Set(targets)];

        // Validate each _id in the target array
        uniqueTargets.forEach(target => {
            if (isValidObjectId(target)) {
                validTargets.push(target);
            } else {
                invalidTargets.push(target);
            }
        });

        try {
            // Check each valid _id against the list of user._ids in the database
            const users = await User.find({ _id: { $in: validTargets } });
            users.forEach(user => {
                matchedTargets.push(user._id.toString());
            });

            // Create the notification
            const details = {
                message,
                type,
                expiryDate,
                targets: matchedTargets.length > 0 ? matchedTargets : '*',
            };
            const result = await createNotification(details);
            if (!result) {
                return res.status(500).json({
                    message: 'Failed to create notification. Please try again later.',
                });
            }
            res.status(200).json({
                message: 'Notification sent successfully',
                invalidTargets: targets.length === 1 && targets[0] === "*" ? 0 : invalidTargets.length,
                success: true,
                matchedTargets: targets.length === 1 && targets[0] === "*" ? "All users" : matchedTargets.length
            });
        } catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({
                message: 'An unexpected error occurred while sending the notification.',
            });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const notifications = await findAny(10);
            if (!notifications) {
                return res.status(404).json({ message: 'No notification available' });
            }
            return res.status(200).json({ message: 'Notifications found', notifications });
        } catch (error) {
            console.error('Error in getting notifications:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        if (!isValidObjectId(req.body?._id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteNotification(req.body._id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting notification:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting.',
            });
        }
    })
// Route for mailing users
Router.route('/mailing')
    .post(authenticate, async (req, res) => {
        const { message, subject, targets, header } = req.body;
        const validTargets = [];
        const invalidTargets = [];
        const matchedTargets = [];

        // Remove duplicate entries
        const uniqueTargets = [...new Set(targets)];

        // Validate email addresses
        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        uniqueTargets.forEach(target => {
            if (target === "*" || isValidEmail(target)) {
                validTargets.push(target);
            } else {
                invalidTargets.push(target);
            }
        });

        try {
            let allUsers = false;

            if (targets.length === 1 && targets[0] === "*") {
                allUsers = true;
                // Fetch all users with an email
                const users = await User.find({ email: { $exists: true } });
                users.forEach(user => matchedTargets.push(user.email));
            } else {
                // Fetch users matching valid targets
                const users = await User.find({ email: { $in: validTargets } });
                users.forEach(user => matchedTargets.push(user.email));
            }

            // Send emails and collect results
            const mailingResults = await Promise.allSettled(
                matchedTargets.map(email =>
                    mail({ email, subject, message, header })
                )
            );

            const successfulEmails = mailingResults
                .filter(result => result.status === 'fulfilled' && result.value.success)
                .map(result => result.value.accepted)
                .flat();

            const failedEmails = mailingResults
                .filter(result => result.status === 'rejected' || !result.value.success)
                .map((result, index) => ({
                    email: matchedTargets[index],
                    error: result.reason || result.value.error,
                }));

            const responsePayload = {
                message: 'Mailing completed',
                invalidTargets: allUsers ? 0 : invalidTargets.length,
                success: successfulEmails.length > 0,
                matchedTargets: allUsers ? "All users" : matchedTargets.length,
                successfulEmails,
                failedEmails,
            };

            // Save the mailing operation log
            await createMail({
                subject,
                message,
                header,
                originalTargets: targets,
                validTargets,
                invalidTargets,
                matchedTargets,
                successfulEmails,
                failedEmails,
                success: successfulEmails.length > 0,
                allUsers,
            });

            res.status(200).json(responsePayload);
        } catch (error) {
            console.error('Error sending mail(s):', error);
            res.status(500).json({
                message: 'An unexpected error occurred while sending mail(s).',
            });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const mailLog = await findAny(15);
            if (!mailLog) {
                return res.status(404).json({ message: 'No mail log available' });
            }
            return res.status(200).json({ message: 'Mail logs found', mailLog });
        } catch (error) {
            console.error('Error in getting mail logs:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        if (!isValidObjectId(req.body?._id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteMailLog(req.body._id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting mail log:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting.',
            });
        }
    })
// Route to handle plans
Router.route('/plans')
    .get(authenticate, async (req, res) => {
        try {
            const plans = await findAny(11);
            if (!plans) {
                return res.status(404).json({ message: 'No plan available' });
            }
            return res.status(200).json({ message: 'Plans found', plans });
        } catch (error) {
            console.error('Error in getting plans:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .post(authenticate, async (req, res) => {
        const { name, max, min, ROIPercentage, duration } = req.body;
        // Validate required fields
        const requiredFields = ['name', 'max', 'min', 'ROIPercentage', 'duration'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing ${missingFields.length} required fields: ${missingFields.join(', ')}`,
            });
        }

        try {
            // Create the plan
            const details = { name, max, min, ROIPercentage, duration };
            const plan = await createPlan(details);

            if (!plan) {
                return res.status(500).json({
                    message: 'Failed to create plan. Please try again later.',
                });
            }

            return res.status(200).json({
                message: 'Plan created successfully',
                success: true,
            });
        } catch (error) {
            console.error('Error creating plan:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while creating the plan.',
            });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deletePlan(_id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted plan',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting plan:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting the plan.',
            });
        }
    });
// Route to handle investments
Router.route('/investments')
    .get(authenticate, async (req, res) => {
        try {
            const investments = await findAny(12);
            if (!investments) {
                return res.status(404).json({ message: 'No investments available' });
            }
            return res.status(200).json({ message: 'Investments found', investments });
        } catch (error) {
            console.error('Error in getting investments:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteInvestment(_id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted plan',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting plan:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting the plan.',
            });
        }
    })
    .put(authenticate, async (req, res) => {
        const { _id, status } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const updatedInvestment = await updateInvestment(_id, status)
            if (!updatedInvestment) {
                return res.status(500).json({ message: 'Error updating investment entry' });
            }
            res.status(200).json({ message: 'Update successful', success: true });
        } catch (error) {
            console.error('Error updating transaction:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
Router.route('/users')
    .get(authenticate, async (req, res) => {
        try {
            const users = await findAny(1);
            if (!users) {
                return res.status(404).json({ message: 'No users available' });
            }
            return res.status(200).json({ message: 'Users found', users });
        } catch (error) {
            console.error('Error in getting users:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .put(authenticate, async (req, res) => {
        const { _id, status } = req.body
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        if (status !== 'blocked' && status !== 'unblocked') {
            return res.status(400).json({ message: 'Invalid suspension status provided' });
        }
        try {
            const updatedUser = await updateUserFields(_id, { blocked: status === 'blocked' ? true : false })
            if (!updatedUser) {
                return res.status(500).json({ message: 'Error updating suspension status' });
            }
            res.status(200).json({ message: `User ${status}`, success: true });
        } catch (error) {
            console.error('Error updating suspension status:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id, profilePic, KYC } = req.body;

        // Validate the _id
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }

        try {
            // Attempt to find the user to delete based on provided data
            const userToDelete = await findOneFilter({
                _id: _id,
                imageFilename: profilePic,
                KYC: KYC,
            }, 1);

            if (!userToDelete) {
                return res.status(404).json({ message: 'User not found or no matching data' });
            }

            // Proceed to delete the user
            const deleted = await deleteUser(userToDelete._id);
            if (!deleted) {
                return res.status(500).json({
                    message: 'Failed to delete user. Possible server error or invalid data.',
                });
            }

            res.status(200).json({
                message: 'User successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting user:', error);
            return res.status(500).json({
                message: 'Unexpected server error occurred during deletion.',
            });
        } finally {
            // Cleanup profile picture if provided and valid
            if (profilePic && isValidObjectId(profilePic)) {
                try {
                    await gfsProfilePics.delete(new mongoose.Types.ObjectId(profilePic));
                    console.log(`Deleted profile picture with ID: ${profilePic}`);
                } catch (cleanupError) {
                    console.error('Error cleaning up profile picture:', cleanupError);
                }
            }

            // Cleanup KYC files if provided and valid
            if (KYC && isValidObjectId(KYC)) {
                try {
                    const kycRecord = await findOneFilter({ _id: KYC }, 2);
                    if (!kycRecord) {
                        console.warn('No matching KYC record found for cleanup.');
                        return;
                    }

                    // Collect files for deletion
                    const { frontFilename = null, backFilename = null } = kycRecord;
                    const filesToDelete = [frontFilename, backFilename].filter(Boolean);

                    if (filesToDelete.length > 0) {
                        const deletionResults = await Promise.allSettled(
                            filesToDelete.map(async (filename) => {
                                const file = await gfsKYC.find({ filename }).toArray();
                                if (file.length > 0) {
                                    console.log(`Deleting file: ${filename}`);
                                    return gfsKYC.delete(file[0]._id);
                                }
                            })
                        );
                        console.log('KYC deletion results:', deletionResults);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up KYC records:', cleanupError);
                } finally {
                    try {
                        const deletedKYC = await deleteKYC(KYC);
                        if (!deletedKYC) {
                            console.error('Error deleting KYC record');
                        } else {
                            console.log('KYC record successfully deleted');
                        }
                    } catch (deleteError) {
                        console.error('Error deleting KYC record:', deleteError);
                    }
                }
            }
        }
    });
Router.route('/user/:userId')
    .get(authenticate, async (req, res) => {
        try {
            const user = await findOneFilter({ _id: req.params.userId }, 1);
            if (!user) {
                return res.status(404).json({ message: 'No mathcing user available' });
            }
            const safeUser = await getSafeAdmin(user)
            return res.status(200).json({ message: 'User found', user });
        } catch (error) {
            console.error('Error in getting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
Router.route('/kyc')
    .get(authenticate, async (req, res) => {
        try {
            const kycRecords = await findAny(2);
            if (!kycRecords) {
                return res.status(404).json({ message: 'No KYC records available' });
            }
            return res.status(200).json({ message: 'KYC records found', kycRecords });
        } catch (error) {
            console.error('Error in getting KYC records:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .put(authenticate, async (req, res) => {
        const { _id, state } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        if (state !== 'verify' && state !== 'unverify') {
            return res.status(400).json({ message: 'Invalid KYC status provided' });
        }
        try {
            const updatedKYC = await updateKYCRecord(_id, { state: state === 'verify' ? true : false })
            if (!updatedKYC) {
                return res.status(500).json({ message: 'Error updating KYC verification status' });
            }
            res.status(200).json({ message: `KYC ${state === 'verify' ? 'verified' : 'unverified'}`, success: true });
        } catch (error) {
            console.error('Error updating KYC verification status:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id, frontFilename, backFilename } = req.body;
        const filesToDelete = [frontFilename, backFilename].filter(Boolean);
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const deleted = await deleteKYC(_id);
            if (!deleted) {
                await updateUserFields(req.user._id, { KYC: null });
                return res.status(500).json({
                    message: 'Failed to delete KYC record. Possible server error or invalid data.',
                });
            }
            res.status(200).json({
                message: 'KYC record successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting KYC record:', error);
            return res.status(500).json({
                message: 'Unexpected server error occurred during deletion.',
            });
        } finally {
            if (filesToDelete.length > 0) {
                try {
                    const deletionResults = await Promise.allSettled(
                        filesToDelete.map(async (filename) => {
                            const file = await gfsKYC.find({ filename }).toArray();
                            if (file.length > 0) {
                                console.log(`Deleting file: ${filename}`);
                                return gfsKYC.delete(file[0]._id);
                            }
                        })
                    );
                    console.log('KYC file deletion results:', deletionResults);
                } catch (cleanupError) {
                    console.error('Error cleaning up KYC files:', cleanupError);
                }
            }
        }
    });
// Route to handle top-ups
Router.route('/topup')
    .post(authenticate, async (req, res) => {
        const { userDetails, amount, description, affectedBalance } = req.body;
        if (!isValidObjectId(userDetails.userId)) {
            return res.status(400).json({ message: 'Invalid userId provided' });
        }
        try {
            const topup = await createTopup({ amount, description, userDetails: { userId: userDetails.userId, fullName: userDetails.fullName }, affectedBalance });
            if (!topup) {
                return res.status(500).json({ message: 'Error creating top-up' });
            }
            res.status(200).json({ message: 'Top-up successful', success: true });
        } catch (error) {
            console.error('Error in top-up:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const topupHistory = await findAny(13);
            if (!topupHistory || topupHistory.length === 0) {
                return res.status(404).json({ message: 'No topup records found' });
            }

            res.status(200).json({ message: 'Topup records found', success: true, topupHistory });
        } catch (error) {
            console.error('Error in fetching topup history:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { id } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid id provided' });
        }

        try {
            // Delete top-up logic to be implemented
            const deleted = await deleteTransactionEntry(id, 13);
            if (!deleted) {
                return res.status(500).json({ message: 'Error deleting top-up' });
            }
            res.status(200).json({ message: 'Top-up deleted successfully', success: true });
        } catch (error) {
            console.error('Error in deleting top-up:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
// Route to handle dashboard widgets
Router.route('/dashboard-widget/:widgetType')
    .get(authenticate, async (req, res) => {
        const { widgetType } = req.params; // Extract the widget type from the route parameter
        const { limit = 3, date } = req.query; // Get query parameters

        try {
            const filterDate = date ? new Date(date) : new Date(); // Default to current date if not provided
            let widgetData;

            // Determine the type of data to fetch based on widgetType
            switch (widgetType) {
                case 'latest-users':
                    widgetData = await findAfterDate(1, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findAnyFilter({}, 1, parseInt(limit));
                    }
                    break;

                case 'latest-kyc':
                    widgetData = await findAfterDate(2, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findAnyFilter({}, 2, parseInt(limit));
                    }
                    break;
                case 'latest-deposit':
                    widgetData = await findAfterDate(4, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findLastCreatedObjects({}, 4, parseInt(limit));
                    }
                    break;
                case 'latest-withdrawalRequests':
                    widgetData = await findAfterDate(5, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findAnyFilter({}, 5, parseInt(limit));
                    }
                    break;
                case 'latest-investments':
                    widgetData = await findAfterDate(12, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findAnyFilter({}, 12, parseInt(limit));
                    }
                    break;
                case 'latest-live-trades':
                    widgetData = await findAfterDate(14, filterDate, parseInt(limit));
                    if (!widgetData || widgetData.length === 0) {
                        widgetData = await findAnyFilter({}, 14, parseInt(limit));
                    }
                    break;

                default:
                    return res.status(400).json({ message: 'Invalid widget type' });
            }

            if (!widgetData || widgetData.length === 0) {
                return res.status(404).json({ message: `No data found for ${widgetType}` });
            }

            res.status(200).json({
                message: `Data for ${widgetType} found`,
                success: true,
                data: widgetData,
            });
        } catch (error) {
            console.error(`Error in fetching data for ${widgetType}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
// Route to handle signal
Router.route('/signal')
    .put(authenticate, async (req, res) => {
        const { userDetails, signal } = req.body;
        if (!isValidObjectId(userDetails.userId)) {
            return res.status(400).json({ message: 'Invalid userId provided' });
        }
        try {
            const signalSet = await updateUserFields(userDetails.userId, { signal: signal });
            if (!signalSet) {
                return res.status(500).json({ message: 'Error updating signal' });
            }
            res.status(200).json({ message: 'Update successful', success: true });
        } catch (error) {
            console.error('Error in signal Update:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
Router.route('/traders')
    .post(authenticate, uploadTraderImg.single('image'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No display image uploaded' });
        }
        const { name } = req.body;
        const fileName = `${req.admin._id}_trader_${name}_${Date.now()}`;
        const readableStream = Readable.from(req.file.buffer);

        const uploadStream = gfsTraderImg.openUploadStream(fileName, {
            contentType: req.file.mimetype,
        });

        readableStream.pipe(uploadStream)
            .on('error', (err) => {
                console.error('Error creating trader option:', err);
                res.status(500).json({ message: 'Error creating trader' });
            })
            .on('finish', async () => {
                try {
                    const trader = await updateTrader({
                        imageFilename: uploadStream.id, name
                    });
                    if (!trader) {
                        return res.status(500).json({ message: 'Error creating trader' });
                    }
                    return res.status(200).json({ message: 'Update successful', success: true });
                } catch (error) {
                    console.error('Error creating trader:', error);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }
            });
    })
    .get(authenticate, async (req, res) => {
        try {
            const traders = await findAny(16);
            if (!traders || traders.length < 1) {
                return res.status(404).json({ message: 'No traders currently available, Please create' });
            }
            return res.status(200).json({ message: 'Traders found', traders });
        } catch (error) {
            console.error('Error in getting traders:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id, imageFilename = null } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteTrader(_id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting trader:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting.',
            });
        } finally {
            if (imageFilename && isValidObjectId(imageFilename)) {
                try {
                    await gfsTraderImg.delete(new mongoose.Types.ObjectId(imageFilename));
                } catch (cleanupError) {
                    console.error('Error during cleanup of trader display image:', cleanupError);
                }
            }
        }
    });
Router.route('/copy-trade')
    .post(authenticate, async (req, res) => {
        const {
            type,
            currencyPair,
            entryPrice,
            stopLoss,
            takeProfit,
            action,
            time,
            trader
        } = req.body;
        // Parse numerical values to ensure they are treated as numbers
        const parsedEntryPrice = parseFloat(entryPrice);
        const parsedStopLoss = parseFloat(stopLoss);
        const parsedTakeProfit = parseFloat(takeProfit);
        const parsedTime = parseFloat(time)
        // Validation logic
        try {
            // 1. Validate required fields
            if (!type || !currencyPair || isNaN(parsedEntryPrice) || isNaN(parsedStopLoss) || isNaN(parsedTakeProfit) || !action || !trader) {
                return res.status(400).json({ message: 'All fields are required and must be valid' });
            }

            // 2. Additional validation for entry price and balance (if applicable)
            if (parsedEntryPrice <= 0) {
                return res.status(400).json({ message: 'Entry price must be greater than zero' });
            }

            // 3. Validate action type
            if (action !== 'buy' && action !== 'sell') {
                return res.status(400).json({ message: 'Action must be either "buy" or "sell"' });
            }

            // 4. Custom validation based on action type
            if (action === 'buy') {
                if (parsedStopLoss >= parsedEntryPrice) {
                    return res.status(400).json({ message: 'Stop loss must be below entry price for a buy trade' });
                }
                if (parsedTakeProfit <= parsedEntryPrice) {
                    return res.status(400).json({ message: 'Take profit must be above entry price for a buy trade' });
                }
            } else if (action === 'sell') {
                if (parsedStopLoss <= parsedEntryPrice) {
                    return res.status(400).json({ message: 'Stop loss must be above entry price for a sell trade' });
                }
                if (parsedTakeProfit >= parsedEntryPrice) {
                    return res.status(400).json({ message: 'Take profit must be below entry price for a sell trade' });
                }
            }

            // 5. If validations pass, create the copy trade
            const details = {
                type,
                currencyPair,
                entryPrice: parsedEntryPrice,
                stopLoss: parsedStopLoss,
                takeProfit: parsedTakeProfit,
                action,
                time: parsedTime,
                trader: trader
            };

            // Create copy trade with the validated data
            const copytrade = await createCopyTrade({ details });

            // Check if the copy trade was created successfully
            if (!copytrade) {
                return res.status(404).json({ message: 'Copy trade failed' });
            }

            // Respond with a success message if the trade was created
            return res.status(200).json({ message: 'Copy trade saved', success: true });
        } catch (error) {
            // Catch any unexpected errors and log them
            console.error('Error processing Copy trade:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .get(authenticate, async (req, res) => {
        try {
            const trades = await findAny(17);
            if (!trades || trades.length < 1) {
                return res.status(404).json({ message: 'Copy trades currently unavailable, Please try again later' });
            }
            return res.status(200).json({ message: 'Trades found', trades });
        } catch (error) {
            console.error('Error in getting trades:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    })
    .delete(authenticate, async (req, res) => {
        const { _id } = req.body;
        if (!isValidObjectId(_id)) {
            return res.status(400).json({ message: 'Invalid _id provided' });
        }
        try {
            const result = await deleteCopyTrade(_id);

            if (!result) {
                return res.status(400).json({
                    message: 'Delete request failed due to invalid data or server error.',
                });
            }
            res.status(200).json({
                message: 'Successfully deleted copy trade',
                success: true,
            });
        } catch (error) {
            console.error('Error in deleting trade:', error);
            return res.status(500).json({
                message: 'An unexpected error occurred while deleting trade.',
            });
        }
    });
export default Router;