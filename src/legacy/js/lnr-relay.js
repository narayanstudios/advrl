import { TodoAPIHandler } from './api/todoAPI.js';
import { ScheduleAPIHandler } from './api/scheduleAPI.js';
import { AuthAPIHandler } from './api/authAPI.js';

const ROUTE_REGISTRY = Object.create(null);
const GATEWAY_TIMEOUT_MS = 5000;

// Auto-registering endpoints
ROUTE_REGISTRY['/todo'] = TodoAPIHandler;
ROUTE_REGISTRY['/schedule'] = ScheduleAPIHandler;
ROUTE_REGISTRY['/auth/logout'] = AuthAPIHandler; 
ROUTE_REGISTRY['/auth/session'] = AuthAPIHandler; // 🟢 YE LINE ADD KARNI HAI

const LnrRelay = {
  request: async function (virtualUri, options = { method: 'GET', body: null }) {
    try {
      const urlParser = new URL(virtualUri, 'https://lnr-relay.internal');
      const path = urlParser.pathname;
      const queryParams = Object.fromEntries(new URLSearchParams(urlParser.search));

      const handler = ROUTE_REGISTRY[path];
      if (!handler) {
        return { success: false, error: `Route '${path}' not registered.`, code: '404' };
      }

      const executionPromise = handler.execute({
        method: (options.method || 'GET').toUpperCase(),
        params: queryParams,
        body: options.body
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GATEWAY_TIMEOUT')), GATEWAY_TIMEOUT_MS)
      );

      const response = await Promise.race([executionPromise, timeoutPromise]);
      return { ...response, meta: { resolvedAt: Date.now(), path: path } };

    } catch (err) {
      console.error(`[LNR-Relay Error]:`, err);
      return { 
        success: false, 
        error: err.message === 'GATEWAY_TIMEOUT' ? 'Service timed out.' : err.message, 
        code: err.message === 'GATEWAY_TIMEOUT' ? '504' : '500' 
      };
    }
  }
};

window.LnrRelay = Object.freeze(LnrRelay);
