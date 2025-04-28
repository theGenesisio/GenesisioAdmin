import cron from 'node-cron';
import { User } from '../mongodb/models.js';
cron.schedule('0 0 * * *', async () => {
    try {
        await User.updateMany({}, [
            {
                $set: {
                    "wallet.balance": { $add: ["$wallet.balance", "$wallet.profits"] },
                    "wallet.profits": 0
                }
            }
        ]);
        console.log('Daily earned profits settled:', new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    } catch (err) {
        console.error('Error updating wallets:', err);
    }
}, {
    scheduled: true,
    timezone: "America/New_York"
});