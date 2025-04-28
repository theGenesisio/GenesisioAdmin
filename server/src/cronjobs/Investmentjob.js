import cron from 'node-cron';
import { Investment } from '../mongodb/models.js';

// Cron job that runs every hour
cron.schedule('0 * * * *', async () => {
    const now = new Date();
    try {
        const result = await Investment.updateMany(
            { status: 'active', expiryDate: { $lte: now } },
            { $set: { status: 'expired' } }
        );
        console.log(`Updated ${result.modifiedCount || result.nModified} investments to expired.`);
    } catch (error) {
        console.error('Error updating investments:', error);
    }
}, {
    scheduled: true,
    timezone: "America/New_York"
});
