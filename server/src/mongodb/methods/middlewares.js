const dbSaveDoc = async (doc) => {
    try {
        // Check if doc is valid before saving
        if (!doc || !doc.save) {
            throw new Error("Invalid document provided for saving");
        }

        // Save the document and return the result
        const savedDoc = await doc.save();
        return savedDoc;

    } catch (err) {
        // Log the error with more context
        console.error({
            message: "Error while saving document to the database",
            error: err.message || err,   // Log the error message if it's available
            stack: err.stack || "No stack trace available",  // Log stack trace for debugging
        });

        // Optionally, you can throw the error again or handle it depending on your needs
        throw new Error("Failed to save document"); // Re-throw or handle as needed
    }
};
export { dbSaveDoc }