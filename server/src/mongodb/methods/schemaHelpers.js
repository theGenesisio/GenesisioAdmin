import { adminSchema, refreshTokenSchema, userSchema, livetradeSchema } from '../schema.js';
//**Common */
// Indexing expiryDate for better performance
refreshTokenSchema.index({ expiryDate: 1 });

// Method to check if the token is expired
refreshTokenSchema.methods.isExpired = function () {
    return new Date() > this.expiryDate;
};

// Static method to delete expired tokens
refreshTokenSchema.statics.deleteExpired = async function () {
    return await this.deleteMany({ expiryDate: { $lt: new Date() } });
};
//**Admin */
// Middleware to update lastSeen on doc update
adminSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
    this.set({ lastSeen: new Date().toUTCString() }); // Automatically set `lastSeen`
    next();
});


// Indexes
adminSchema.index({ active: 1 });
adminSchema.index({ lastSeen: -1 });
//**Client */
// Middleware to update lastSeen on doc update
userSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
    this.set({ lastSeen: new Date().toUTCString() }); // Automatically set `lastSeen`
    next();
});


// Indexes
userSchema.index({ active: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ KYC: 1 });
userSchema.index({ imageFilename: 1 });
// Indexes
livetradeSchema.index({ status: 1 }); // For filtering by status
livetradeSchema.index({ currencyPair: 1 }); // For filtering by currency pairs
livetradeSchema.index({ type: 1 }); // For filtering by trade type
livetradeSchema.index({ createdAt: -1 }); // For sorting by creation date
