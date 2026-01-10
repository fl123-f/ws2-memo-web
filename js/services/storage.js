// 统一的存储服务
class StorageService {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async get(key) {
    return await this.adapter.get(key);
  }

  async set(key, value) {
    return await this.adapter.set(key, value);
  }

  async delete(key) {
    return await this.adapter.delete(key);
  }

  async getAll() {
    return await this.adapter.getAll();
  }
}

// LocalStorage 适配器
class LocalStorageAdapter {
  async get(key) {
    const value = localStorage.getItem(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  }

  async set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return { success: true };
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return { success: false, error };
    }
  }

  async delete(key) {
    localStorage.removeItem(key);
    return { success: true };
  }

  async getAll() {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      items[key] = await this.get(key);
    }
    return items;
  }
}

// API 适配器
class ApiAdapter {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async get(key) {
    try {
      const res = await fetch(`${this.baseURL}api/get_memo.php?id=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('API get error:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      const res = await fetch(`${this.baseURL}api/save_memo.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, id: key })
      });
      return await res.json();
    } catch (error) {
      console.error('API set error:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const res = await fetch(`${this.baseURL}api/delete_memo.php?id=${encodeURIComponent(key)}`);
      return await res.json();
    } catch (error) {
      console.error('API delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAll() {
    try {
      const res = await fetch(`${this.baseURL}api/get_memos.php`);
      const data = await res.json();
      return data.memos || [];
    } catch (error) {
      console.error('API getAll error:', error);
      return [];
    }
  }
}

// 创建适配器实例
export const localStorageAdapter = new LocalStorageAdapter();
export const apiAdapter = new ApiAdapter();

// 创建存储服务实例
export const localStorageService = new StorageService(localStorageAdapter);
export const apiStorageService = new StorageService(apiAdapter);

// 默认导出
export default {
  StorageService,
  LocalStorageAdapter,
  ApiAdapter,
  localStorageAdapter,
  apiAdapter,
  localStorageService,
  apiStorageService
};
