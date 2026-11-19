(function () {
  const DB_NAME = "saha-gallery-v1";
  const STORE = "blobs";

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      Promise.resolve(fn(store))
        .then(resolve)
        .catch(reject);
      tx.onerror = () => reject(tx.error);
    });
  }

  window.SahaGalleryStore = {
    async put(id, blob) {
      await withStore("readwrite", (store) => {
        store.put(blob, id);
      });
    },
    async get(id) {
      return withStore("readonly", (store) => new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      }));
    },
    async remove(id) {
      await withStore("readwrite", (store) => {
        store.delete(id);
      });
    }
  };
})();