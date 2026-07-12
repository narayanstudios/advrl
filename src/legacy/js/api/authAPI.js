import { LnrStorageCore } from '../core/LnrStorageCore.js';
import { getUser, clearUser } from '../indexeddb.js'; // 🟢 AdvoraDB accessor functions

export const AuthAPIHandler = {
  // Common UID accessor
  getUID: () => localStorage.getItem('advora_uid') || null,

  execute: async function (request) {
    try {
      const { method, body } = request;

      // 🟢 GET: Fetch User Auth/Profile Data
      if (method === 'GET') {
        return await this.handleGetSession();
      }

      // 🟢 POST: Logout & Purge
      if (method === 'POST') {
        return await this.handleLogout(body);
      }

      return { success: false, error: "Method Not Allowed", code: '405' };
    } catch (err) {
      return { success: false, error: err.message, code: 'AUTH_API_ERR' };
    }
  },

  // 🟢 Logic: Fetch User Data from AdvoraDB 'UserStore'
  // (PATCHED — was using LnrStorageCore.connect(), which opens 'LnrOfflineStorage'
  //  and that DB never creates a 'UserStore' object store. Now uses the
  //  correct AdvoraDB accessor from indexeddb.js)
  handleGetSession: async function () {
    const uid = this.getUID();

    if (!uid) {
      return { success: false, error: "No active session detected.", code: 'AUTH_SESSION_MISSING' };
    }

    try {
      const userData = await getUser(uid); // AdvoraDB ke UserStore se fetch

      if (!userData) {
        return { success: false, error: "Profile data not found.", code: 'AUTH_DATA_CORRUPT' };
      }

      return { success: true, data: userData };
    } catch (err) {
      return { success: false, error: err.message || String(err), code: 'AUTH_FETCH_FAIL' };
    }
  },

  // 🟢 Logic: Secure Wipeout — clears BOTH databases
  handleLogout: async function (body) {
    console.log("[AuthAPI] Logout procedure initiated...");

    const uid = body?.uid || this.getUID();

    if (uid) {
      // 1a. Wipe AdvoraDB user profile record
      try {
        await clearUser(uid);
      } catch (err) {
        console.error('[AuthAPI] Failed to clear AdvoraDB UserStore record:', err);
      }

      // 1b. Wipe LnrOfflineStorage (todos / schedules / activity_logs)
      try {
        await LnrStorageCore.wipeUserData(uid);
      } catch (err) {
        console.error('[AuthAPI] Failed to wipe LnrOfflineStorage data:', err);
      }
    }

    // 2. Clear Client Storage
    localStorage.removeItem('advora_uid');
    localStorage.removeItem('user_session');
    sessionStorage.clear();

    // 3. Clear Cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
    }

    return {
      success: true,
      message: "Session terminated and data purged.",
      meta: { timestamp: new Date().toISOString() }
    };
  }
};