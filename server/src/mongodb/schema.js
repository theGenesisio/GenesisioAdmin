import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Common schema
const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiryDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
}, { timestamps: true });

const billingSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    address: {
        type: String,
        required: true,
        unique: true,
    },
    qrCode: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Admin schema
const adminSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        required: true,
    },
    createdBy: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            required: true
        },
        username: {
            type: String,
            required: true,
            trim: true,
        }
    },
    active: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: String,
        default: null,
    },
    lastLoginDetails:
    {
        ipAddress: { type: String, default: null },
        browser: { type: String, default: null },
        os: { type: String, default: null },
        device: { type: String, default: null },
    },
}, { timestamps: true });

// Client schema
const walletSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    balance: {
        type: Number,
        default: 0,
    },
    fluctuation: {
        type: Number,
        default: 0,
    },
    topup: {
        type: Number,
        default: 0,
    },
    totalDeposit: {
        type: Number,
        default: 0,
    },
    profits: {
        type: Number,
        default: 0,
    },
    withdrawn: {
        type: Number,
        default: 0,
    },
    totalBonus: {
        type: Number,
        default: 0,
    },
    referral: {
        type: Number,
        default: 0,
    },
    crypto: {
        cryptoBalance: {
            type: Number,
            default: 0,
        },
        cryptoAssets: {
            bitcoin: {
                type: Number,
                default: 0,
            },
            ethereum: {
                type: Number,
                default: 0,
            },
            solana: {
                type: Number,
                default: 0,
            },
            tether: {
                type: Number,
                default: 0,
            },
            xrp: {
                type: Number,
                default: 0,
            },
        },
    },

});

const KYCSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    state: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ["Passport", "Driver's License", "ID Card"],
        required: true,
    },
    frontFilename: {
        type: String,
        required: true,
    },
    backFilename: {
        type: String,
        required: function () {
            return this.type === "Driver's License" || this.type === "ID Card";
        },
        default: null
    }
}, { timestamps: true });

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "other"],
    },
    country: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    passwordToShow: {
        type: String,
        default: 'Yet to save password'
    },
    referralCode: {
        type: String,
        default: null
    },
    active: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: String,
        default: null,
    },
    KYC: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "KYC",
        default: null
    },
    wallet: {
        type: walletSchema,
        default: () => ({}),
    },
    imageFilename: {
        type: String, default: null
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    lastPasswordChange: {
        type: String,
        default: null,
    },
    signal: {
        type: Number,
        default: 2,
    }
}, {
    timestamps: true,
});

const depositSchema = new Schema({
    optionRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Billing",
        required: true
    },
    option: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    bonus: {
        type: Number,
        default: 0
    },
    receipt: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        required: true
    },
}, {
    timestamps: true,
});

const withdrawalRequestSchema = new Schema({
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d+$/.test(v); // Ensure amount is numeric
            },
            message: props => `${props.value} is not a valid amount!`
        }
    },
    option: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'processing'],
        default: 'pending',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bankDetails: {
        bankName: { type: String },
        accountName: { type: String },
        routingNumber: { type: Number },
    }
}, {
    timestamps: true
});

const whatsappSchema = new Schema({
    number: {
        type: String,
        required: true,
        default: ''
    },
}, {
    timestamps: true,
});

const notificationSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['success', 'error', 'warning', '*'],
        required: true,
    },
    targets: {
        type: Schema.Types.Mixed,
        validate: {
            validator: function (value) {
                return (
                    value === '*' ||
                    (Array.isArray(value) &&
                        value.every(
                            (id) => mongoose.Types.ObjectId.isValid(id)
                        ))
                );
            },
            message: 'Targets must be "*" or an array of valid ObjectIds.',
        },
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    expiryDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
}, {
    timestamps: true,
});
const plansSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
    },
    limits: {
        max: {
            type: Number,
            required: [true, 'Max limit is required'],
            min: [0, 'Max limit must be a positive number'],
        },
        min: {
            type: Number,
            required: [true, 'Min limit is required'],
            min: [0, 'Min limit must be a positive number'],
            validate: {
                validator: function (value) {
                    return value < this.limits.max;
                },
                message: props => `Min limit (${props.value}) must be less than max limit (${props.instance.limits.max}).`,
            },
        },
    },
    ROIPercentage: {
        type: Number,
        required: [true, 'ROI Percentage is required'],
        min: [0, 'ROI Percentage must be a positive number'],
    },
    frequency: {
        type: Number,
        default: 1,
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [0, 'Duration must be a positive number'],
    },
    details: {
        type: String,
        required: [true, 'Plan details are required'],
        trim: true,
        maxlength: [200, 'Details cannot exceed 200 characters']
    }
}, { timestamps: true });
const tierSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Tier name is required'],
        trim: true,
    },
    details: {
        type: String,
        required: [true, 'Tier details are required'],
        trim: true,
    },
}, { timestamps: true });
const upgradeSchema = new Schema({
    tier: tierSchema,
    user: {
        email: {
            type: String,
            required: true,
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'failed', 'mailed'],
        default: 'pending',
        required: true,
    },
}, { timestamps: true });
const investmentSchema = new Schema({
    plan: {
        name: {
            type: String,
            required: true,
        },
        limits: {
            max: {
                type: Number,
                required: true,
            },
            min: {
                type: Number,
                required: true,
            },
        },
        ROIPercentage: {
            type: Number,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        details: {
            type: String,
        },
    },
    user: {
        email: {
            type: String,
            required: true,
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    amount: {
        type: Number,
        required: [true, 'Investment amount is required'],
    },
    frequency: {
        type: Number,
        default: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'failed', 'expired'],
        default: 'pending',
        required: true,
    },
    expiryDate: {
        type: Date,
    },
    startDate: {
        type: Date,
    },
}, { timestamps: true });
const topupSchema = new Schema({
    amount: {
        type: Number,
        required: [true, 'Investment amount is required'],
    },
    user: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }, fullName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    description: {
        type: String,
        required: true,
    },
    affectedBalance: {
        type: String,
        required: [true, 'Balance to affect is required'],
        enum: ['balance', 'totalDeposit', 'totalBonus', 'profits', 'withdrawn', 'referral', "crypto.cryptoAssets.bitcoin", "crypto.cryptoAssets.ethereum", "crypto.cryptoAssets.solana", "crypto.cryptoAssets.tether", "crypto.cryptoAssets.xrp",]
    }
}, { timestamps: true });
const traderSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    imageFilename: {
        type: String, default: null
    }
}, { timestamps: true })
const copytradeSchema = new Schema({
    type: {
        type: String,
        enum: ['cryptocurrency', 'forex', 'stock'],
        lowercase: true,
        required: true,
    },
    currencyPair: {
        type: String,
        required: true,
    },
    entryPrice: {
        type: Number,
        required: true,
    },
    stopLoss: {
        type: Number,
        required: true,
    },
    takeProfit: {
        type: Number,
        required: true,
    },
    time: {
        type: Number,
        default: 1,
    },
    action: {
        type: String,
        lowercase: true,
        enum: ['buy', 'sell'],
        required: true,
    },
    trader: traderSchema

}, { timestamps: true });
const livetradeSchema = new Schema({
    type: {
        type: String,
        enum: ['cryptocurrency', 'forex', 'stock'],
        lowercase: true,
        required: true,
    },
    currencyPair: {
        type: String,
        required: true,
    },
    entryPrice: {
        type: Number,
        required: true,
    },
    stopLoss: {
        type: Number,
        required: true,
    },
    takeProfit: {
        type: Number,
        required: true,
    },
    action: {
        type: String,
        lowercase: true,
        enum: ['buy', 'sell'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'canceled'],
        default: 'active',
    },
    closedAt: {
        type: Date,
        default: null,
    },
    time: {
        type: Number,
        default: 1,
    },
    duration: {
        type: Number,
        default: function () {
            if (this.closedAt) {
                return (new Date(this.closedAt).getTime() - new Date(this.createdAt).getTime()) / 1000; // Seconds
            }
            return null;
        }
    },
    exitPrice: {
        type: Number,
        default: null,
    },
    profitLoss: {
        type: Number,
        default: null,
    },
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        email: {
            type: String,
            required: true,
        }
    },
}, { timestamps: true });
const FailedEmailSchema = new Schema({
    email: { type: String, required: true },
    error: { type: String, required: true }
}, { _id: false });

const MailLogSchema = new Schema({
    subject: { type: String, required: true },
    message: { type: [String], default: [] },
    header: { type: String },
    originalTargets: { type: [String], required: true },
    validTargets: { type: [String], default: [] },
    invalidTargets: { type: [String], default: [] },
    matchedTargets: { type: [String], default: [] },
    successfulEmails: { type: [String], default: [] },
    failedEmails: { type: [FailedEmailSchema], default: [] },
    success: { type: Boolean, required: true },
    allUsers: { type: Boolean, default: false },
}, { timestamps: true });

const quoteSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true,
        min: 0
    },
    volume_24h: {
        type: Number,
        required: true,
        min: 0
    },
    volume_change_24h: {
        type: Number,
        required: true
    },
    percent_change_1h: {
        type: Number,
        required: true
    },
    percent_change_24h: {
        type: Number,
        required: true
    },
    last_updated: {
        type: Date,
        required: true
    }
}, { _id: false }); // No need for a separate _id on nested quote object

const livePriceSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    quote: {
        USD: {
            type: quoteSchema,
            required: true
        }
    }
}, {
    timestamps: true // adds createdAt and updatedAt
});

// Presave functions
investmentSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'active' && !this.startDate) {
            this.startDate = new Date();
        }
        if (this.plan && this.status === 'active' && !this.expiryDate) {
            this.expiryDate = new Date(
                Date.now() + this.plan.duration * 24 * 60 * 60 * 1000
            );
        }
    }
    next();
});

withdrawalRequestSchema.pre('validate', function (next) {
    next();
});
// Apply validation based on the option
withdrawalRequestSchema.pre('validate', function (next) {
    if (this.option === 'bank') {
        if (!this.bankDetails || !this.bankDetails.bankName || !this.bankDetails.accountName) {
            next(new Error('For "bank" option, bankName and accountName are required.'));
        }
    }
    next();
});
livetradeSchema.pre('save', function (next) {
    if (this.action === 'buy') {
        if (this.stopLoss >= this.entryPrice) {
            return next(new Error('Stop loss must be below entry price for a buy trade.'));
        }
        if (this.takeProfit <= this.entryPrice) {
            return next(new Error('Take profit must be above entry price for a buy trade.'));
        }
    } else if (this.action === 'sell') {
        if (this.stopLoss <= this.entryPrice) {
            return next(new Error('Stop loss must be above entry price for a sell trade.'));
        }
        if (this.takeProfit >= this.entryPrice) {
            return next(new Error('Take profit must be below entry price for a sell trade.'));
        }
    }
    if (this.closedAt) {
        const createdTime = new Date(this.createdAt).getTime();
        const closedTime = new Date(this.closedAt).getTime();
        this.duration = (closedTime - createdTime) / 1000; // Duration in seconds
    }
    next();
});
export { refreshTokenSchema, billingSchema, adminSchema, walletSchema, KYCSchema, userSchema, depositSchema, withdrawalRequestSchema, whatsappSchema, notificationSchema, plansSchema, investmentSchema, topupSchema, livetradeSchema, MailLogSchema, copytradeSchema, traderSchema, livePriceSchema, upgradeSchema, tierSchema };
