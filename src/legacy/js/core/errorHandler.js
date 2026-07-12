// public/errorHandler.js - DataX Client Error Sanitization Matrix

const ERROR_DICTIONARY = {
    // DataX Specific Custom Codes & Special Exceptions (Checked First)
    "DATAX_SHIELD_RATE_LIMIT_EXCEEDED": "Security triggered: Too many attempts. Try again in 15 minutes.",
    "SENTINEL_TOKEN_MISSING": "Secure session missing. Re-authentication required.",
    "SENTINEL_INVALID_TOKEN": "Session corrupted or expired.",
    "DATAX_ACCOUNT_SUSPENDED": "Security Alert: Account suspended due to policy violation.",
    "DATAX_VALIDATION_ERROR": "Information provided does not match our secure schema requirements.",
    
    // Explicit Identity Policy Flags
    "GOOGLE_AUTH_REQUIRED": "This account was registered via Google. Please use the Google Sign-In button.",

    // Standard HTTP Status Codes (Fallback Layer)
    400: "Invalid request payload. Please check your inputs.",
    401: "Authentication missing or expired. Please log in again.",
    403: "Access denied. You don't have permission for this action.",
    404: "The requested ecosystem resource could not be found.",
    409: "Data conflict detected. This record might already exist.",
    429: "Too many requests. Please slow down and try again later.",
    500: "DataX Core Engine encountered a critical fault. Our team has been notified.",
    503: "Service is temporarily down for maintenance. Please hold."
};

/**
 * Parses raw backend network response into a user-friendly UI string
 * @param {number} statusCode - HTTP Status Code
 * @param {Object} responseData - Raw JSON body from Vercel Backend
 * @returns {string} User-friendly error message
 */
export function sanitizeErrorState(statusCode, responseData) {
    if (!responseData) return ERROR_DICTIONARY[statusCode] || "An unknown network anomaly occurred.";

    // 1. Match via programmatic error code if present
    if (responseData.code && ERROR_DICTIONARY[responseData.code]) {
        return ERROR_DICTIONARY[responseData.code];
    }

    // 2. Exact match check for specific policy strings inside raw error field
    if (responseData.error) {
        if (responseData.error.includes("registered via Google")) {
            return ERROR_DICTIONARY["GOOGLE_AUTH_REQUIRED"];
        }
        
        // Edge case: If backend sent raw error but no code, check dictionary using string key
        if (ERROR_DICTIONARY[responseData.error]) {
            return ERROR_DICTIONARY[responseData.error];
        }
    }

    // 3. Fallback to generic HTTP status code mapping
    if (ERROR_DICTIONARY[statusCode]) {
        return ERROR_DICTIONARY[statusCode];
    }

    // 4. Return raw error text if nothing else matched, avoiding generic blindspots
    return responseData.error || "An unknown network anomaly occurred. Please try again.";
}
