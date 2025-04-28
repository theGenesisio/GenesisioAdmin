import cron from 'node-cron';
import { AdminRefreshToken } from '../mongodb/models.js';

// Run the deleteExpired function every hour
cron.schedule('0 * * * *', async () => {
    try {
        const result = await AdminRefreshToken.deleteExpired();
        console.log(`Expired admin tokens deleted: ${result.deletedCount}`);
    } catch (error) {
        console.error('Error deleting expired admin tokens:', error);
    }
}, {
    scheduled: true,
    timezone: "America/New_York"
});
