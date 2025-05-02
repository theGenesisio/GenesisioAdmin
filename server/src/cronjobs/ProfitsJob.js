// Import the node-cron library for scheduling tasks
import cron from 'node-cron';
// Import the User model from the MongoDB models
import { User } from '../mongodb/models.js';

// Schedule a cron job to run daily at midnight (server time)
cron.schedule('0 0 * * *', async () => {
    try {
        // Update all users' wallet balances by adding profits to the balance and resetting profits to 0
        await User.updateMany({}, [
            {
                $set: {
                    "wallet.balance": { $add: ["$wallet.balance", "$wallet.profits"] }, // Add profits to balance
                    "wallet.profits": 0 // Reset profits to 0
                }
            }
        ]);
        // Log success message with the current date and time in the "America/New_York" timezone
        console.log('Daily earned profits settled:', new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    } catch (err) {
        // Log any errors that occur during the update process
        console.error('Error updating wallets:', err);
    }
}, {
    scheduled: true, // Ensure the task is scheduled
    timezone: "America/New_York" // Set the timezone for the cron job
});