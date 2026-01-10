// memoService.js - 直接使用fetch API版本

const API_BASE_URL = '/ws2-memo-web/api';

// API端点配置
const apiEndpoints = {
  memos: {
    getAll: 'get_memos.php',
    get: (id) => `get_memo.php?id=${id}`,
    save: 'save_memo.php',
    update: 'update_memo.php',
    delete: (id) => `delete_memo.php?id=${id}`,
    search: (keyword) => `search_memos.php?keyword=${encodeURIComponent(keyword)}`
  },
  importExport: {
    exportJSON: 'import_export.php?action=export&format=json',
    exportCSV: 'import_export.php?action=export&format=csv'
  }
};

// 构建完整URL
function buildUrl(endpoint) {
  return `${API_BASE_URL}/${endpoint}`;
}

// 通用fetch请求函数
async function apiRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(`API请求失败 (${url}):`, error);
    throw error;
  }
}

class MemoService {
  constructor() {
    // 不再需要apiClient参数
  }

  // 获取所有备忘录
  async getMemos() {
    try {
      const url = buildUrl(apiEndpoints.memos.getAll);
      const data = await apiRequest(url, 'GET');
      return Array.isArray(data?.memos) ? data.memos : [];
    } catch (error) {
      console.error('获取备忘录失败:', error);
      return [];
    }
  }

  // 获取单个备忘录
  async getMemo(id) {
    try {
      const url = buildUrl(apiEndpoints.memos.get(id));
      return await apiRequest(url, 'GET');
    } catch (error) {
      console.error(`获取备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 保存备忘录
  async saveMemo(title, content, category = '') {
    try {
      const url = buildUrl(apiEndpoints.memos.save);
      return await apiRequest(url, 'POST', {
        title,
        content,
        category
      });
    } catch (error) {
      console.error('保存备忘录失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新备忘录
  async updateMemo(id, title, content, category) {
    try {
      const url = buildUrl(apiEndpoints.memos.update);
      return await apiRequest(url, 'POST', {
        id,
        title,
        content,
        category
      });
    } catch (error) {
      console.error(`更新备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 置顶/取消置顶备忘录
  async pinMemo(id, is_pinned) {
    try {
      const url = buildUrl(apiEndpoints.memos.update);
      return await apiRequest(url, 'POST', {
        id,
        is_pinned
      });
    } catch (error) {
      console.error(`置顶备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 删除备忘录
  async deleteMemo(id) {
    try {
      const url = buildUrl(apiEndpoints.memos.delete(id));
      return await apiRequest(url, 'GET');
    } catch (error) {
      console.error(`删除备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 搜索备忘录
  async searchMemos(keyword) {
    try {
      const url = buildUrl(apiEndpoints.memos.search(keyword));
      return await apiRequest(url, 'GET');
    } catch (error) {
      console.error(`搜索备忘录 "${keyword}" 失败:`, error);
      return { success: false, memos: [], keyword, count: 0 };
    }
  }

  // 导出为JSON
  async exportJSON() {
    try {
      const url = buildUrl(apiEndpoints.importExport.exportJSON);
      return await apiRequest(url, 'GET');
    } catch (error) {
      console.error('导出JSON失败:', error);
      return [];
    }
  }

  // 导出为CSV
  async exportCSV() {
    try {
      const url = buildUrl(apiEndpoints.importExport.exportCSV);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('导出CSV失败:', error);
      return '';
    }
  }

  // 批量操作
  async batchDelete(ids) {
    const results = [];
    for (const id of ids) {
      const result = await this.deleteMemo(id);
      results.push({ id, success: result.success });
    }
    return results;
  }

  // 获取备忘录统计信息
  async getStats() {
    try {
      const memos = await this.getMemos();
      const total = memos.length;
      const pinned = memos.filter(m => m.is_pinned).length;
      const byCategory = {};
      
      memos.forEach(memo => {
        const category = memo.category || '未分类';
        byCategory[category] = (byCategory[category] || 0) + 1;
      });

      return {
        total,
        pinned,
        byCategory,
        categories: Object.keys(byCategory).length
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return { total: 0, pinned: 0, byCategory: {}, categories: 0 };
    }
  }
}

// 创建默认实例
const defaultMemoService = new MemoService();

// 导出类和新实例
export { MemoService, defaultMemoService };

// 保持向后兼容的旧接口
const legacyFunctions = {
  getMemos: async () => {
    return await defaultMemoService.getMemos();
  },
  
  saveMemo: async (title, content, category) => {
    const result = await defaultMemoService.saveMemo(title, content, category);
    return result.success !== undefined ? result : { success: true, ...result };
  },
  
  updateMemo: async (id, title, content, category) => {
    const result = await defaultMemoService.updateMemo(id, title, content, category);
    return result.success !== undefined ? result : { success: true, ...result };
  },
  
  pinMemo: async (id, is_pinned) => {
    const result = await defaultMemoService.pinMemo(id, is_pinned);
    return result.success !== undefined ? result : { success: true, ...result };
  },
  
  deleteMemo: async (id) => {
    const result = await defaultMemoService.deleteMemo(id);
    return result.success !== undefined ? result : { success: true, ...result };
  },
  
  exportJSON: async () => {
    return await defaultMemoService.exportJSON();
  },
  
  exportCSV: async () => {
    return await defaultMemoService.exportCSV();
  },
  
  searchMemos: async (keyword) => {
    return await defaultMemoService.searchMemos(keyword);
  }
};

// 导出旧接口对象
export const memoService = legacyFunctions;

// 默认导出
export default defaultMemoService;
