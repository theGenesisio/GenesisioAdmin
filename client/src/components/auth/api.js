import {
    deleteRefreshTokenFromDb,
    getInitialAccessToken,
    getRefreshToken,
    getRefreshTokenFromDb,
    saveAccessToken,
    saveRefreshToken,
    saveAdminToLocal
} from './authHelpers';

const { VITE_ADMIN_API_URL, VITE_ADMIN_BASE_URL } = import.meta.env;

const FetchWithAuth = async (url, options = {}, failure) => {
    let accessToken = getInitialAccessToken() || null;
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const reset = () => {
        saveAccessToken(null);
        saveAdminToLocal(null);
        deleteRefreshTokenFromDb();
        saveRefreshToken(null);
        window.location.href = VITE_ADMIN_BASE_URL;
    };

    try {
        // Initial request attempt
        let response = await fetch(`${VITE_ADMIN_API_URL}${url}`, {
            ...options,
            headers,
        });

        // Handle 403 (forbidden) and retokenization
        if (response.status === 403 && accessToken) {
            const storedRefreshToken = await getRefreshTokenFromDb() || getRefreshToken();

            if (!storedRefreshToken) {
                console.log("Token not found in both storage locations");
                reset();
                return { failed: 'Session expired. Please log in again.' };
            }

            console.log("Retrieved refresh token:", storedRefreshToken);

            // Refresh the access token
            const refreshResponse = await fetch(`${VITE_ADMIN_API_URL}/auth/retokenization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                const { accessToken: newAccessToken, admin } = await refreshResponse.json();
                saveAccessToken(newAccessToken);
                saveAdminToLocal(admin);

                // Retry the original request with the new access token
                response = await fetch(`${VITE_ADMIN_API_URL}${url}`, {
                    ...options,
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                });
            } else {
                console.log("Failed to refresh token.");
                reset();
                return { failed: 'Session expired. Please log in again.' };
            }
        }

        // Handle 401 (unauthorized)
        if (response.status === 401 && accessToken) {
            console.log("Unauthorized access, resetting session.");
            reset();
            return { failed: 'Session expired. Please log in again.' };
        }

        // Return successful response or append `failed` property
        const responseData = await response.json();
        if (!response.ok) {
            return { ...responseData, failed: failure };
        }
        return responseData;
    } catch (error) {
        console.error('FetchWithAuth Error:', error);
        return { failed: failure, message: error?.message || 'Network error' };
    }
};

export default FetchWithAuth;
