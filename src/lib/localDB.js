// @ts-check

/**
 * @template T
 */
class IDBStorage {
  /**
   * @param {string} [dbName]
   * @param {string} [storeName]
   */
  constructor(dbName = "appDB", storeName = "keyval") {
    this.dbName = dbName;
    this.storeName = storeName;

    /** @type {IDBDatabase | null} */
    this.db = null;

    /** @type {Promise<void>} */
    this.ready = this.init();
  }

  /** @returns {Promise<void>} */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (e) => {
        const db = /** @type {IDBOpenDBRequest} */ (e.target).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (e) => {
        this.db = /** @type {IDBOpenDBRequest} */ (e.target).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** @param {string} key @param {T} value */
  async setItem(key, value) {
    await this.ready;
    if (!this.db) throw new Error("DB not ready");

    return new Promise((resolve, reject) => {
      // @ts-ignore
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /** @param {string} key @returns {Promise<T | null>} */
  async getItem(key) {
    await this.ready;
    if (!this.db) throw new Error("DB not ready");

    return new Promise((resolve, reject) => {
      // @ts-ignore
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);

      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  /** @param {string} key */
  async removeItem(key) {
    await this.ready;
    if (!this.db) throw new Error("DB not ready");

    return new Promise((resolve, reject) => {
      // @ts-ignore
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    await this.ready;
    if (!this.db) throw new Error("DB not ready");

    return new Promise((resolve, reject) => {
      // @ts-ignore
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);

      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /** @returns {Promise<number>} */
  async length() {
    await this.ready;
    if (!this.db) throw new Error("DB not ready");

    return new Promise((resolve, reject) => {
      // @ts-ignore
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);

      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export default IDBStorage;