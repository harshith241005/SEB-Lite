// Authentication utility functions

/**
 * Store authentication tokens
 */
export const setAuthTokens = (accessToken, refreshToken, user) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Get access token (with backward compatibility)
 */
export const getAccessToken = () => {
  // Try new format first
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) return accessToken;
  
  // Fallback to legacy format for backward compatibility
  return localStorage.getItem("token");
};

/**
 * Get refresh token
 */
export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

/**
 * Get user data
 */
export const getUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token"); // Legacy support
  localStorage.removeItem("user");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    
    // Update tokens
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    // If refresh fails, clear auth and redirect to login
    clearAuth();
    window.location.href = "/login";
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  try {
    // Call logout endpoint to blacklist tokens
    if (accessToken) {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage regardless of API call success
    clearAuth();
  }
};
