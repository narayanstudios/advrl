const DB_NAME = 'LnrOfflineStorage';
const DB_VERSION = 6;
const STORES = ['todos', 'schedules', 'activity_logs'];

export const LnrStorageCore = {
  connect: () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          const objectStore = db.createObjectStore(store, { keyPath: 'id' });
          objectStore.createIndex('uid', 'uid', { unique: false });
        }
      });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  }),

  getAll: async function (storeName, uid) {
    if (!uid) throw new Error("Security Exception: UID required.");
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result.filter(item => item.uid === uid));
      req.onerror = () => reject(req.error);
    });
  },

  insert: async function (storeName, payload, uid) {
    if (!uid) throw new Error("Security Exception: UID required.");
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const finalPayload = { ...payload, uid: uid };
      tx.objectStore(storeName).add(finalPayload);
      tx.oncomplete = () => resolve(finalPayload);
      tx.onerror = () => reject(tx.error);
    });
  },

  update: async function (storeName, id, updateData, uid) {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.get(id).onsuccess = (e) => {
        const record = e.target.result;
        if (!record || record.uid !== uid) return reject(new Error("Access denied."));
        const mergedData = { ...record, ...updateData, updatedAt: new Date().toISOString() };
        store.put(mergedData);
        tx.oncomplete = () => resolve(mergedData);
      };
    });
  },

  wipeUserData: async function (uid) {
    const db = await this.connect();
    return Promise.all(STORES.map(storeName => new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.getAll().onsuccess = (e) => {
        e.target.result.forEach(item => {
          if (item.uid === uid) store.delete(item.id);
        });
        resolve(true);
      };
    })));
  }
};
