// /assets/js/core/networkLayer.js - Core API Gateway with UI-Auth Sync Matrix

import { sanitizeErrorState } from './errorHandler.js';

const CONFIG = {
    API_BASE_URL: 'https://datax-core-engine.vercel.app/api/v1'
};

// Centralized Session Reset (Frontend cleanup)
function clearSession() {

    document.cookie =
        "advora_ui_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure; samesite=lax";

    window.location.href = '/authentication';
}

export async function hashPassword(plainText) {

    const msgBuffer = new TextEncoder().encode(plainText);

    const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        msgBuffer
    );

    const hashArray = Array.from(
        new Uint8Array(hashBuffer)
    );

    return hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function dataxFetch(endpoint, options = {}) {

    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const fetchOptions = {
        ...options,
        headers,
        credentials: 'include'
    };

    try {

        let response = await fetch(url, fetchOptions);

        let data = await response
            .json()
            .catch(() => null);

        // SILENT REFRESH INTERCEPTOR
        if (
            response.status === 401 &&
            endpoint !== '/auth/refresh' &&
            endpoint !== '/auth/login'
        ) {

            const refreshResponse = await fetch(
                `${CONFIG.API_BASE_URL}/auth/refresh`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }
            );

            if (refreshResponse.ok) {

                response = await fetch(
                    url,
                    fetchOptions
                );

                data = await response
                    .json()
                    .catch(() => null);

                if (response.ok) {

                    return {
                        error: false,
                        status: response.status,
                        data
                    };
                }

            } else {

                clearSession();

                return {
                    error: true,
                    status: 401,
                    message: "Session expired."
                };
            }
        }


        // LOGIN / REGISTER / GOOGLE SUCCESS COOKIE SYNC

        if (
            response.ok &&
            (
                endpoint.includes('/login') ||
                endpoint.includes('/register') ||
                endpoint.includes('/google')
            )
        ) {

            const expiryTime = 7 * 24 * 60 * 60; 
            document.cookie =
                `advora_ui_auth=active; path=/; max-age=${expiryTime}; secure; samesite=lax`;

            console.log(
                `[UI AUTH] Cookie synced successfully for ${endpoint}`
            );
        }


        if (!response.ok) {

            return {
                error: true,
                status: response.status,
                message: sanitizeErrorState(
                    response.status,
                    data
                ),
                data
            };
        }

        return {
            error: false,
            status: response.status,
            data
        };

    }
    catch (error) {

        console.error(
            '[Network Error]',
            error
        );

        return {
            error: true,
            status: 0,
            message: "Network anomaly detected.",
            data: null
        };
    }
}