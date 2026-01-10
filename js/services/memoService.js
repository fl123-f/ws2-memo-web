// memoService.js 
import { defaultApiClient, apiEndpoints } from './apiClient.js';

class MemoService {
  constructor(apiClient = defaultApiClient) {
    this.apiClient = apiClient;
  }

  // 获取所有备忘录
  async getMemos() {
    try {
      const data = await this.apiClient.get(apiEndpoints.memos.getAll);
      return Array.isArray(data?.memos) ? data.memos : [];
    } catch (error) {
      console.error('获取备忘录失败:', error);
      return [];
    }
  }

  // 获取单个备忘录
  async getMemo(id) {
    try {
      return await this.apiClient.get(apiEndpoints.memos.get(id));
    } catch (error) {
      console.error(`获取备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 保存备忘录
  async saveMemo(title, content, category = '') {
    try {
      return await this.apiClient.post(apiEndpoints.memos.save, {
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
      return await this.apiClient.post(apiEndpoints.memos.update, {
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
      return await this.apiClient.post(apiEndpoints.memos.update, {
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
      return await this.apiClient.get(apiEndpoints.memos.delete(id));
    } catch (error) {
      console.error(`删除备忘录 ${id} 失败:`, error);
      return { success: false, error: error.message };
    }
  }

  // 搜索备忘录
  async searchMemos(keyword) {
    try {
      return await this.apiClient.get(apiEndpoints.memos.search(keyword));
    } catch (error) {
      console.error(`搜索备忘录 "${keyword}" 失败:`, error);
      return { success: false, memos: [], keyword, count: 0 };
    }
  }

  // 导出为JSON
  async exportJSON() {
    try {
      return await this.apiClient.get(apiEndpoints.importExport.exportJSON);
    } catch (error) {
      console.error('导出JSON失败:', error);
      return [];
    }
  }

  // 导出为CSV
  async exportCSV() {
    try {
      return await this.apiClient.get(apiEndpoints.importExport.exportCSV);
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
