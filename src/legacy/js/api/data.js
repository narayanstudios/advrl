/**
 * ============================================================================
 * DATA.JS — LIVE BACKEND CONNECTIVITY LAYER
 * ============================================================================
 * This file interfaces directly with the DataX backend and LNR-Relay.
 * All mock data has been removed. It fulfills the exact response contracts 
 * expected by feed.js.
 * ============================================================================
 */

import { dataxFetch } from '../core/networkLayer.js';

(function (global) {
    'use strict';

    // ────────────────────────────────────────────────────────────────────
    // 1. PENDING-LIKES BATCH QUEUE
    //    Queues up optimistic likes to piggyback on the next feed request
    //    to minimize unnecessary network calls.
    // ────────────────────────────────────────────────────────────────────
    let pendingLikes = {};

    function queueLikeDelta(postId, delta) {
        const next = (pendingLikes[postId] || 0) + delta;
        if (next === 0) {
            delete pendingLikes[postId];
        } else {
            pendingLikes[postId] = next;
        }
    }

    function flushPendingLikes() {
        const batch = pendingLikes;
        pendingLikes = {};
        return batch;
    }

    // ────────────────────────────────────────────────────────────────────
    // 2. RESPONSE ENVELOPE HELPERS
    // ────────────────────────────────────────────────────────────────────
    function ok(data) {
        return { error: false, status: 200, data };
    }

    function fail(status, message) {
        return { error: true, status, data: { success: false, error: message } };
    }

    // ────────────────────────────────────────────────────────────────────
    // 3. FEED / PAGINATION (Connected to DataX)
    // ────────────────────────────────────────────────────────────────────

    async function getPosts({ limit = 10, cursor = null, tab = 'All' } = {}) {
        const syncedLikes = flushPendingLikes();

        try {
            const response = await dataxFetch('/feed/', {
                method: 'POST',
                body: JSON.stringify({ limit, cursor, tab, pendingLikes: syncedLikes })
            });
            return response;
        } catch (err) {
            return fail(500, err.message || 'Failed to fetch global feed');
        }
    }

    async function fetchNextPage({ cursor, limit = 10 } = {}) {
        if (!cursor) {
            return fail(400, 'Missing cursor for pagination request.');
        }
        return getPosts({ limit, cursor });
    }

    async function refreshFeed({ limit = 10 } = {}) {
        // Pull-to-refresh resets the cursor server-side
        return getPosts({ limit, cursor: null });
    }

    // ────────────────────────────────────────────────────────────────────
    // 4. POST ACTIONS (Connected to DataX via Unified Action Endpoint)
    // ────────────────────────────────────────────────────────────────────

    async function toggleLike(postId) {
        try {
            // 1. Read current UI state to determine action (feed.js already toggled the class optimistically)
            const cardEl = document.querySelector(`[data-post-id="${postId}"]`);
            const isCurrentlyActive = cardEl?.querySelector('.like-btn')?.classList.contains('active');
            
            // Set exact Action Type based on UI state
            const actionType = isCurrentlyActive ? 'LIKE' : 'UNLIKE';

            // 2. Call the new Unified Action Endpoint
            const response = await dataxFetch('/post/action', {
                method: 'POST',
                body: JSON.stringify({
                    postId: postId,
                    actionType: actionType
                })
            });

            // 3. Return structured response to feed.js
            if (response && !response.error) {
                return ok({ success: true, liked: actionType === 'LIKE' });
            }
            
            return fail(500, 'Action execution refused by backend.');
        } catch (err) {
            console.error('[DataX Sentinel Guard] Like mutation isolated:', err.message);
            return fail(500, err.message);
        }
    }

    async function toggleSave(postId) {
        try {
            // Using the same Unified Action Endpoint for Saves
            const cardEl = document.querySelector(`[data-post-id="${postId}"]`);
            const isCurrentlyActive = cardEl?.querySelector('.save-btn')?.classList.contains('active');
            const actionType = isCurrentlyActive ? 'SAVE' : 'UNSAVE';

            const response = await dataxFetch('/post/action', {
                method: 'POST',
                body: JSON.stringify({
                    postId: postId,
                    actionType: actionType
                })
            });

            if (response && !response.error) {
                return ok({ success: true, saved: actionType === 'SAVE' });
            }
            return fail(500, 'Save action failed');
        } catch (err) {
            return fail(500, 'Save action failed');
        }
    }

    // Share, Copy, and Report remain standalone for now (Client-Side actions or separate tracking)
    async function sharePost(postId) {
        try {
            return await dataxFetch(`/feed/action/share`, {
                method: 'POST',
                body: JSON.stringify({ postId })
            });
        } catch (err) {
            return fail(500, 'Share action failed');
        }
    }

    async function copyPost(postId) {
        try {
            return await dataxFetch(`/feed/action/copy`, {
                method: 'POST',
                body: JSON.stringify({ postId })
            });
        } catch (err) {
            return fail(500, 'Copy action failed');
        }
    }

    async function reportPost(postId, reason = 'unspecified') {
        try {
            return await dataxFetch(`/feed/action/report`, {
                method: 'POST',
                body: JSON.stringify({ postId, reason })
            });
        } catch (err) {
            return fail(500, 'Report action failed');
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // 5. WIDGETS (Connected to LNR-Relay)
    // ────────────────────────────────────────────────────────────────────

    async function getTodo() {
        if (!window.LnrRelay) return fail(503, 'LnrRelay client engine not initialized');

        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const response = await window.LnrRelay.request(`/todo?date=${todayStr}&limit=4&fallback=true`);
            if (response.success) {
                return ok({ success: true, todos: response.data });
            }
            return fail(500, response.error);
        } catch (err) {
            return fail(500, err.message);
        }
    }

    async function toggleTodo(todoId) {
        try {
            return await dataxFetch(`/todo/toggle`, {
                method: 'POST',
                body: JSON.stringify({ todoId })
            });
        } catch (err) {
            return fail(500, 'Failed to update task');
        }
    }

    async function getSchedule() {
        if (!window.LnrRelay) return fail(503, 'LnrRelay client engine not initialized');

        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const response = await window.LnrRelay.request(`/schedule?date=${todayStr}&limit=3&fallback=true`);
            if (response.success) {
                return ok({ success: true, schedule: response.data });
            }
            return fail(500, response.error);
        } catch (err) {
            return fail(500, err.message);
        }
    }

    async function getNotifications() {
        if (!window.LnrRelay) return fail(503, 'LnrRelay not initialized');
        try {
            const response = await window.LnrRelay.request(`/notifications?limit=5`);
            if (response.success) {
                return ok({ success: true, notifications: response.data });
            }
            return fail(500, response.error);
        } catch (err) {
            return fail(500, err.message);
        }
    }

    async function getContinueReading() {
        if (!window.LnrRelay) return fail(503, 'LnrRelay not initialized');
        try {
            const response = await window.LnrRelay.request(`/continue-reading?limit=3`);
            if (response.success) {
                return ok({ success: true, items: response.data });
            }
            return fail(500, response.error);
        } catch (err) {
            return fail(500, err.message);
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // 6. PUBLIC API ATTACHMENT
    // ────────────────────────────────────────────────────────────────────
    const api = {
        getPosts,
        fetchNextPage,
        refreshFeed,
        toggleLike,
        toggleSave,
        sharePost,
        copyPost,
        reportPost,
        getTodo,
        toggleTodo,
        getSchedule,
        getNotifications,
        getContinueReading
    };

    // Attach to window so feed.js can securely consume it
    global.AdvoraAPI = api;

})(window);
