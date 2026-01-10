// categoryService.js 
import { localStorageService } from './storage.js';

class CategoryService {
  constructor(storageService = localStorageService, storageKey = 'customCategories') {
    this.storageService = storageService;
    this.storageKey = storageKey;
    this.categories = [];
    this.loadCategories();
  }

  // 从存储加载分类
  async loadCategories() {
    try {
      const data = await this.storageService.get(this.storageKey);
      this.categories = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('加载分类失败:', error);
      this.categories = [];
    }
  }

  // 保存分类到存储
  async saveCategories() {
    try {
      await this.storageService.set(this.storageKey, this.categories);
      return { success: true };
    } catch (error) {
      console.error('保存分类失败:', error);
      return { success: false, error };
    }
  }

  // 获取所有分类
  getCategories() {
    return [...this.categories]; // 返回副本以避免直接修改
  }

  // 添加分类
  async addCategory(name) {
    if (!name || this.categories.includes(name)) {
      return { success: false, message: '分类名不能为空或已存在' };
    }
    
    this.categories.push(name);
    const result = await this.saveCategories();
    
    return result.success 
      ? { success: true, categories: [...this.categories] }
      : { success: false, message: '保存失败', error: result.error };
  }

  // 编辑分类
  async editCategory(oldName, newName) {
    const idx = this.categories.indexOf(oldName);
    if (idx === -1) {
      return { success: false, message: '分类不存在' };
    }
    
    if (!newName || this.categories.includes(newName)) {
      return { success: false, message: '新分类名不能为空或已存在' };
    }
    
    this.categories[idx] = newName;
    const result = await this.saveCategories();
    
    return result.success
      ? { success: true, categories: [...this.categories] }
      : { success: false, message: '保存失败', error: result.error };
  }

  // 删除分类
  async deleteCategory(name) {
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(c => c !== name);
    
    if (this.categories.length === initialLength) {
      return { success: false, message: '分类不存在' };
    }
    
    const result = await this.saveCategories();
    
    return result.success
      ? { success: true, categories: [...this.categories] }
      : { success: false, message: '保存失败', error: result.error };
  }

  // 检查分类是否存在
  hasCategory(name) {
    return this.categories.includes(name);
  }

  // 获取分类数量
  getCategoryCount() {
    return this.categories.length;
  }

  // 清空所有分类
  async clearCategories() {
    this.categories = [];
    const result = await this.saveCategories();
    
    return result.success
      ? { success: true, message: '已清空所有分类' }
      : { success: false, message: '清空失败', error: result.error };
  }
}

// 创建默认实例（向后兼容）
const defaultCategoryService = new CategoryService();

// 导出类和新实例
export { CategoryService, defaultCategoryService };

// 保持向后兼容的旧接口
export const categoryService = (() => {
  const service = defaultCategoryService;
  
  return {
    getCategories: () => service.getCategories(),
    addCategory: async (name) => {
      const result = await service.addCategory(name);
      return result.success; // 返回布尔值以保持兼容
    },
    editCategory: async (oldName, newName) => {
      const result = await service.editCategory(oldName, newName);
      return result.success; // 返回布尔值以保持兼容
    },
    deleteCategory: async (name) => {
      const result = await service.deleteCategory(name);
      // 旧版本没有返回值，我们保持相同行为
    }
  };
})();

// 默认导出
export default defaultCategoryService;
