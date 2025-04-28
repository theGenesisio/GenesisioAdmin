import mongoose from 'mongoose';
import { refreshTokenSchema, adminSchema, billingSchema, userSchema, KYCSchema, depositSchema, withdrawalRequestSchema, whatsappSchema, notificationSchema, plansSchema, investmentSchema, topupSchema, livetradeSchema, MailLogSchema, copytradeSchema, traderSchema } from './schema.js';
const { model } = mongoose
const AdminRefreshToken = model('AdminRefreshToken', refreshTokenSchema)
const RefreshToken = model('RefreshToken', refreshTokenSchema)
const Admin = model('Admin', adminSchema)
const User = model('User', userSchema)
const KYC = model('KYC', KYCSchema)
const Billing = model('Billing', billingSchema)
const Deposit = model('Deposit', depositSchema)
const WithdrawalRequest = model('WithdrawalRequest', withdrawalRequestSchema);
const Whatsapp = model('Whatsapp', whatsappSchema);
const Notification = model('Notification', notificationSchema);
const Plan = model('Plan', plansSchema);
const Investment = model('Investment', investmentSchema);
const Topup = model('Topup', topupSchema)
const LiveTrade = model('LiveTrade', livetradeSchema);
const Trader = model('Trader', traderSchema)
const CopyTrade = model('CopyTrade', copytradeSchema)
const Mail = model('Mail', MailLogSchema);
const models = [RefreshToken, User, KYC, Billing, Deposit, WithdrawalRequest, AdminRefreshToken, Admin, Billing, Whatsapp, Notification, Plan, Investment, Topup, LiveTrade, Mail, Trader, CopyTrade]
import './methods/schemaHelpers.js'
export { models, AdminRefreshToken, Admin, Billing, RefreshToken, User, KYC, Deposit, WithdrawalRequest, Whatsapp, Notification, Plan, Investment, Topup, LiveTrade, Mail, Trader, CopyTrade }