import useragent from 'user-agent'
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
    const plainAdmin = admin.toObject ? admin.toObject() : admin;

    const safeAdmin = { ...plainAdmin };

    // Remove sensitive fields
    for (const field of sensitiveFields) {
        delete safeAdmin[field];
    }

    // Transform specific fields
    if (safeAdmin._id) {
        safeAdmin._id = safeAdmin._id.toString();
    }
    if (safeAdmin.KYC) {
        safeAdmin.KYC = safeAdmin.KYC.toString();
    }

    if (safeAdmin.createdAt) {
        safeAdmin.createdAt = formatToUTCString(safeAdmin.createdAt);
    }

    return safeAdmin;
}
// Helper function to parse User-Agent with fallback logic
function parseUserAgentWithFallback(userAgentString) {
    const parsedAgent = useragent.parse(userAgentString);

    // Extract fields from user-agent library
    let browser = parsedAgent.name || null;
    let os = parsedAgent.os || null;
    let device = parsedAgent.device || null;

    // Fallbacks using regex
    const browserRegex = /(Chrome|Firefox|Safari|Opera|Edge|MSIE|Trident)/i;
    const osRegex = /(Windows NT|Mac OS X|Linux|Android|iOS)/i;
    const deviceRegex = /(Mobile|Tablet|Desktop)/i;

    // Apply regex fallback if fields are missing
    if (!browser) {
        browser = userAgentString.match(browserRegex)?.[0] || 'Unknown Browser';
    }

    if (!os) {
        os = userAgentString.match(osRegex)?.[0] || 'Unknown OS';
    }

    if (!device) {
        device = userAgentString.match(deviceRegex)?.[0] || 'Desktop';
    }

    return { browser, os, device };
}
export { formatToUTCString, getSafeAdmin, parseUserAgentWithFallback };