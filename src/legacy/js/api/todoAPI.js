import { LnrStorageCore } from '../core/LnrStorageCore.js';

const STORE = 'todos';

export const TodoAPIHandler = {
  getUID: () => localStorage.getItem('advora_uid') || 'default_user_001',

  execute: async function (request) {
    try {
      const uid = this.getUID();
      const { method, params, body } = request;
      switch (method) {
        case 'POST': return this.create(body, uid);
        case 'PUT': return this.update(body, uid);
        case 'GET': default: return this.read(params, uid);
      }
    } catch (err) {
      return { success: false, error: err.message, code: 'TODO_API_ERR' };
    }
  },

  create: async function (data, uid) {
    const taskPayload = {
      id: 'task_' + Date.now(),
      title: data.title || 'Untitled',
      description: data.description || '',
      status: 'pending',
      priority: data.priority || 'medium',
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    const savedData = await LnrStorageCore.insert(STORE, taskPayload, uid);
    return { success: true, data: savedData };
  },

  read: async function (params, uid) {
    let rawData = await LnrStorageCore.getAll(STORE, uid);

    if (params.date) {
      const reqDate = new Date(params.date).getTime();
      rawData = rawData.filter(task => {
        const taskDate = new Date(task.deadline).getTime();
        const isToday = task.deadline === params.date;
        const isPastPending = (taskDate < reqDate) && (task.status === 'pending');
        return isToday || isPastPending;
      });
    }

    if (rawData.length === 0 && params.fallback === 'true') {
      const todayTime = new Date().getTime();
      rawData = (await LnrStorageCore.getAll(STORE, uid)).filter(t => new Date(t.deadline).getTime() >= todayTime);
    }

    rawData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (params.limit) rawData = rawData.slice(0, parseInt(params.limit, 10));

    return { success: true, count: rawData.length, data: rawData };
  },

  update: async function (body, uid) {
    const updated = await LnrStorageCore.update(STORE, body.id, body, uid);
    return { success: true, data: updated };
  }
};
