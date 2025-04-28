function getDateAfterDays(startDate, x) {
    // Convert the input to a Date object
    const start = new Date(startDate);

    // Check if the input date is valid
    if (isNaN(start)) {
        throw new Error("Invalid date format. Please provide a valid date.");
    }

    // Add x days in milliseconds
    const resultDate = new Date(start.getTime() + x * 24 * 60 * 60 * 1000);

    // Convert to New York time
    return resultDate.toLocaleString("en-US", { timeZone: "America/New_York" });
}
function formatToNewYorkTime(dateString) {
    try {
        // Parse the input date string into a Date object
        const date = new Date(dateString);

        // Check if the input date is valid
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }

        // Convert to New York time
        return date.toLocaleString("en-US", { timeZone: "America/New_York" });
    } catch (error) {
        return `Error: ${error.message}`;
    }
}
export { getDateAfterDays, formatToNewYorkTime }