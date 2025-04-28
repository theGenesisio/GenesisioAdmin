function formatToUTCString(dateString) {
    try {
        // Parse the input date string into a Date object
        const date = new Date(dateString);

        // Check if the input date is valid
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }

        // Convert to UTC string
        return date.toUTCString();
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

function getSafeAdmin(admin, sensitiveFields = ['password', 'verificationToken']) {
    if (!admin) {
        throw new Error("admin object is required");
    }

    // Ensure the input is a plain object
    const plainUser = admin.toObject ? admin.toObject() : admin;

    const safeUser = { ...plainUser };

    // Remove sensitive fields
    for (const field of sensitiveFields) {
        delete safeUser[field];
    }

    // Transform specific fields
    if (safeUser._id) {
        safeUser._id = safeUser._id.toString();
    }
    if (safeUser.KYC) {
        safeUser.KYC = safeUser.KYC.toString();
    }

    if (safeUser.createdAt) {
        safeUser.createdAt = formatToUTCString(safeUser.createdAt);
    }

    return safeUser;
}

export { formatToUTCString, getSafeAdmin }