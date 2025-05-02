import dotenv from 'dotenv';
dotenv.config()
import cron from 'node-cron';
import { LivePrice } from '../mongodb/models.js';
import updateWalletsWithCrypto from './WalletUpdateJob.js';

async function fetchCryptoQuotes() {
    const url = {
        endpoint: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
        query: {
            id: '1,1027,5426,825,52',
        }
    };

    const uri = `${url.endpoint}?id=${url.query.id}`;

    try {
        const res = await fetch(uri, {
            headers: {
                'X-CMC_PRO_API_KEY': process.env.COINMARKET_CAP_API_KEY,
            },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const json = await res.json();
        const coins = Object.values(json.data);
        const bulkOps = coins.map(coin => ({
            updateOne: {
                filter: { id: coin.id },
                update: {
                    $set: {
                        name: coin.name,
                        symbol: coin.symbol,
                        slug: coin.slug,
                        quote: {
                            USD: coin.quote.USD
                        },
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        await LivePrice.bulkWrite(bulkOps);
        console.log(`[${new Date().toLocaleDateString()}] Live prices updated successfully.`);
    } catch (error) {
        console.error("Error fetching Live prices:", error.message);
    }
}

// Job A — Update crypto prices every hour on the dot
cron.schedule('0 * * * *', async () => {
    await fetchCryptoQuotes();
});

// Job B — Update wallets 10 minutes after quotes are refreshed
cron.schedule('10 * * * *', async () => {
    await updateWalletsWithCrypto();
    console.log('Wallets updated ✅');
});
