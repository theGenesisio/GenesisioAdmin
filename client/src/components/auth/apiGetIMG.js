import { getInitialAccessToken } from './authHelpers';
const fetchImage = async (imageId, path, options = { method: "GET", credentials: "include" }) => {
    const storedToken = getInitialAccessToken();
    const accessToken = storedToken || null;

    const headers = {
        ...options.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    try {
        // Attempt to fetch the image
        const response = await fetch(`${import.meta.env.VITE_ADMIN_API_URL}/img${path}${imageId}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image with id ${imageId}. Status: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob); // Create a local URL for displaying the image
    } catch (error) {
        console.error("Error fetching image:", error);
        return "Failed to load the image. Please try again.";
    }
};

export default fetchImage;
