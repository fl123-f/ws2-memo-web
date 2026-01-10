// js/services/apiClient.js
// API客户端 - 统一处理HTTP请求

class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // 认证相关（当前未使用，预留扩展）
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 尝试解析JSON，如果失败则返回文本
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API请求失败 [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET请求
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  // POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE请求
  async delete(endpoint, params = {}) {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'DELETE' });
  }

  // PATCH请求
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // 上传文件
  async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {}, // 不设置Content-Type，让浏览器自动设置
      body: formData,
    });
  }

  // 设置请求超时
  async requestWithTimeout(endpoint, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await this.request(endpoint, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`请求超时 (${timeout}ms)`);
      }
      throw error;
    }
  }
}

// 创建默认实例
const defaultApiClient = new ApiClient();

// 特定API端点配置
const apiEndpoints = {
  memos: {
    getAll: 'api/get_memos.php',
    get: (id) => `api/get_memo.php?id=${encodeURIComponent(id)}`,
    save: 'api/save_memo.php',
    update: 'api/update_memo.php',
    delete: (id) => `api/delete_memo.php?id=${encodeURIComponent(id)}`,
    search: (keyword) => `api/search_memos.php?keyword=${encodeURIComponent(keyword)}`,
  },
  importExport: {
    exportJSON: 'api/import_export.php?action=export&format=json',
    exportCSV: 'api/import_export.php?action=export&format=csv',
    import: 'api/import_export.php?action=import',
  },
};

// 导出
export { ApiClient, defaultApiClient, apiEndpoints };
export default defaultApiClient;
