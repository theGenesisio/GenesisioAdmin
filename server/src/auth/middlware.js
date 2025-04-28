import JWT from 'jsonwebtoken'
import { updateDefaultAdminFields } from '../mongodb/methods/update.js'
import bcrypt from 'bcryptjs'
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) { return res.status(401).json({ message: 'Missing access token' }) }
    JWT.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, admin) => {
        if (!admin) {
            return res.status(401).json({
                message: 'An error occured, please login again'
            });
        }
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Handle token expiration differently
                return res.status(403).json({
                    message: 'Expired access token',
                    expiredAt: err.expiredAt, // Include the expiration timestamp if needed
                });
            } else {
                // Handle other JWT-related errors
                return res.status(500).json({
                    message: 'An error occured, please login again'
                });
            }
        }
        // todo check if this works as against req.admin
        req.admin = admin
        next()
    })
}
const handlePreflight = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).json({});
    }
    next();
};
const addDefaultAdmin = async (req, res, next) => {
    const hashedPassword = await bcrypt.hash('LowKey4Me!25', 10);
    await updateDefaultAdminFields('Merseille', { password: hashedPassword, username: 'Merseille', createdBy: { id: '680f26375b7acf6e15ef8793', username: 'DEFAULT' } })
    next()
}
export { authenticate, handlePreflight, addDefaultAdmin }