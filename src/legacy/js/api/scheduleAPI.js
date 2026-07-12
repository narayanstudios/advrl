import { LnrStorageCore } from '../core/LnrStorageCore.js';

const STORE = 'schedules';

export const ScheduleAPIHandler = {
  getUID: () => localStorage.getItem('advora_uid') || 'default_user_001',

  execute: async function (request) {
    try {
      const uid = this.getUID();
      const { method, params, body } = request;
      switch (method) {
        case 'POST': return this.create(body, uid);
        case 'GET': default: return this.read(params, uid);
      }
    } catch (err) {
      return { success: false, error: err.message, code: 'SCH_API_ERR' };
    }
  },

  create: async function (data, uid) {
    const eventPayload = {
      id: 'evt_' + Date.now(),
      title: data.title,
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString(),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    const savedData = await LnrStorageCore.insert(STORE, eventPayload, uid);
    return { success: true, data: savedData };
  },

  read: async function (params, uid) {
    let rawData = await LnrStorageCore.getAll(STORE, uid);

    if (params.date) {
      rawData = rawData.filter(event => event.startTime.startsWith(params.date));
    }

    if (rawData.length === 0 && params.fallback === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      rawData = (await LnrStorageCore.getAll(STORE, uid)).filter(e => e.startTime >= todayStr);
    }

    rawData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    if (params.limit) rawData = rawData.slice(0, parseInt(params.limit, 10));

    return { success: true, count: rawData.length, data: rawData };
  }
};
