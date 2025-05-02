import { User } from '../mongodb/models.js';
import { findAny } from '../mongodb/methods/read.js';
const updateWalletsWithCrypto = async () => {
    try {
        // 1. Get current prices from DB
        const currentPrices = await findAny(18); // Assuming 18 is the index for LivePrice model
        if (!currentPrices || currentPrices.length === 0) {
            console.error(`No prices found in the database at [${new Date().toLocaleDateString()}]`);
            return;
        }
        // Get objects that match ids [1,1027,5426,825,52]
        const prices = {
            btc: currentPrices.find(price => price.id === 1)?.quote.USD.price || 0,
            eth: currentPrices.find(price => price.id === 1027)?.quote.USD.price || 0,
            solana: currentPrices.find(price => price.id === 5426)?.quote.USD.price || 0,
            tether: currentPrices.find(price => price.id === 825)?.quote.USD.price || 0,
            xrp: currentPrices.find(price => price.id === 52)?.quote.USD.price || 0,
        };
        // 2. Get all user 
        const users = await findAny(1); // Assuming 0 is the index for User model


        const bulkOps = users.map(user => {
            const wallet = user.wallet;
            const assets = wallet.crypto.cryptoAssets;

            // 3. Calculate total crypto value in USD
            const newCryptoBalance = (
                (assets.btc || 0) * prices.btc +
                (assets.eth || 0) * prices.eth +
                (assets.solana || 0) * prices.solana +
                (assets.tether || 0) * prices.tether +
                (assets.xrp || 0) * prices.xrp
            );

            // 4. Get old crypto balance
            const oldCryptoBalance = wallet.crypto.cryptoBalance || 0;

            // 5. Update fields
            const balanceAdjustment = newCryptoBalance - oldCryptoBalance;
            const newTotalBalance = wallet.balance + balanceAdjustment;

            // 6. Calculate percentage change due to crypto adjustment
            let percentChange = 0;

            if (wallet.balance !== 0) {
                percentChange = (balanceAdjustment / wallet.balance) * 100;
                percentChange = Number(percentChange.toFixed(2)); // rounded to 2 decimals
            } else {
                percentChange = balanceAdjustment === 0 ? 0 : 100; // optional: treat 100% change when balance was 0
            }


            return {
                updateOne: {
                    filter: { _id: user._id }, // Filter by user ID
                    // Update the user document with new values
                    update: {
                        $set: {
                            'wallet.crypto.cryptoBalance': newCryptoBalance,
                            'wallet.balance': newTotalBalance,
                            'wallet.fluctuation': percentChange
                        },
                    },
                },
            };
        });

        // 6. Bulk write to DB
        if (bulkOps.length) {
            await User.bulkWrite(bulkOps);
            console.log(`Updated ${bulkOps.length} user wallets with new crypto balances at [${new Date().toLocaleDateString()}]`);
        } else {
            console.log(`No user wallets found to update at:[${new Date().toLocaleDateString()}]`);
        }

    } catch (error) {
        console.error(`Error updating crypto balances at [${new Date().toLocaleDateString()}]:`, error);
    }
};
export default updateWalletsWithCrypto;