// AdvoraDB / UserStore

const DB_NAME = 'AdvoraDB';
const DB_VERSION = 1;
const STORE_NAME = 'UserStore';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'uid' });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function normalizeUser(user) {
    const uid = String(user?.uid || user?.userId || '').trim();

    return {
    uid,

    username: user?.username || '',
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    profilePic: user?.profilePic ?? user?.profile_pic ?? '',
    adminVerified: user?.adminVerified ?? false,
    createdAt: user?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
};
}

export async function saveUser(user) {
    const record = normalizeUser(user);

    if (!record.uid) {
        throw new Error('Cannot save user: uid is missing.');
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);

        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
}

export async function getUser(uid = localStorage.getItem('advora_uid') || '') {
    if (!uid) return null;

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(uid);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

export async function clearUser(uid = localStorage.getItem('advora_uid') || '') {
    if (!uid) return true;

    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(uid);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
}

export async function getAllUsers() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}