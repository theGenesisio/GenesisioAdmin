import { User } from '../mongodb/models.js';
import { findAny } from '../mongodb/methods/read.js';

const updateWalletsWithCrypto = async () => {
    try {
        // 1. Get current prices from DB
        const currentPrices = await findAny(18); // Assuming 18 is LivePrice model
        if (!currentPrices || currentPrices.length === 0) {
            console.error(`No prices found in DB at [${new Date().toLocaleDateString()}]`);
            return;
        }

        // 2. Extract prices
        const prices = {
            btc: currentPrices.find(p => p.id === 1)?.quote.USD.price || 0,
            eth: currentPrices.find(p => p.id === 1027)?.quote.USD.price || 0,
            solana: currentPrices.find(p => p.id === 5426)?.quote.USD.price || 0,
            tether: currentPrices.find(p => p.id === 825)?.quote.USD.price || 0,
            xrp: currentPrices.find(p => p.id === 52)?.quote.USD.price || 0,
        };

        // 3. Fetch all users
        const users = await findAny(1); // Assuming 1 is User model

        const bulkOps = users.map(user => {
            const wallet = user.wallet;
            const assets = wallet.crypto.cryptoAssets;

            // 4. Calculate new crypto balance
            const newCryptoBalance = (
                (assets.bitcoin || 0) * prices.btc +
                (assets.ethereum || 0) * prices.eth +
                (assets.solana || 0) * prices.solana +
                (assets.tether || 0) * prices.tether +
                (assets.xrp || 0) * prices.xrp
            );

            const oldCryptoBalance = wallet.crypto.cryptoBalance || 0;
            const balanceAdjustment = newCryptoBalance - oldCryptoBalance;

            const oldTotalBalance = wallet.balance || 0;
            const newTotalBalance = oldTotalBalance + balanceAdjustment;

            // 5. Calculate fluctuation
            let percentChange = 0;
            if (oldTotalBalance !== 0) {
                percentChange = (balanceAdjustment / oldTotalBalance) * 100;
                percentChange = Number(percentChange.toFixed(2));
            } else {
                percentChange = balanceAdjustment === 0 ? 0 : 100;
            }

            // Optional safety check
            if (isNaN(percentChange)) {
                console.warn(`percentChange is NaN for user: ${user._id}`);
                percentChange = 0;
            }

            return {
                updateOne: {
                    filter: { _id: user._id },
                    update: {
                        $set: {
                            'wallet.crypto.cryptoBalance': newCryptoBalance,
                            'wallet.balance': newTotalBalance,
                            'wallet.fluctuation': percentChange,
                        },
                    },
                },
            };
        });

        // 6. Execute bulk write
        if (bulkOps.length) {
            await User.bulkWrite(bulkOps);
            console.log(`✅ Updated ${bulkOps.length} user wallets at [${new Date().toLocaleDateString()}]`);
            return {
                message: `Updated ${bulkOps.length} user wallets with new crypto balances`,
                success: true,
            };
        } else {
            console.log(`⚠️ No user wallets found to update at [${new Date().toLocaleDateString()}]`);
            return {
                message: `No user wallets found to update`,
                success: false,
            };
        }

    } catch (error) {
        console.error(`❌ Error updating crypto balances at [${new Date().toLocaleDateString()}]:`, error);
        return {
            message: `Error updating crypto balances`,
            success: false,
        };
    }
};

export default updateWalletsWithCrypto;
