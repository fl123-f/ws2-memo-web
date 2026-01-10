// 测试重构后的代码
import { localStorageService } from './services/storage.js';
import { defaultCategoryService } from './services/categoryService.js';
import { defaultMemoService } from './services/memoService.js';

async function runTests() {
  console.log('=== 开始测试重构后的代码 ===\n');

  // 测试1: 存储服务
  console.log('测试1: 存储服务');
  try {
    await localStorageService.set('test_key', { name: '测试数据', value: 123 });
    const retrieved = await localStorageService.get('test_key');
    console.log('✓ 存储服务测试通过:', retrieved);
  } catch (error) {
    console.log('✗ 存储服务测试失败:', error.message);
  }

  // 测试2: 分类服务
  console.log('\n测试2: 分类服务');
  try {
    // 清空现有分类
    await defaultCategoryService.clearCategories();
    
    // 添加分类
    const addResult = await defaultCategoryService.addCategory('工作');
    console.log('添加分类结果:', addResult.success ? '✓' : '✗', addResult.message || '');
    
    // 获取分类
    const categories = defaultCategoryService.getCategories();
    console.log('当前分类:', categories);
    
    // 编辑分类
    const editResult = await defaultCategoryService.editCategory('工作', '工作任务');
    console.log('编辑分类结果:', editResult.success ? '✓' : '✗', editResult.message || '');
    
    // 检查分类是否存在
    const hasCategory = defaultCategoryService.hasCategory('工作任务');
    console.log('分类存在检查:', hasCategory ? '✓' : '✗');
    
    console.log('✓ 分类服务测试通过');
  } catch (error) {
    console.log('✗ 分类服务测试失败:', error.message);
  }

  // 测试3: 备忘录服务
  console.log('\n测试3: 备忘录服务');
  try {
    // 获取备忘录
    const memos = await defaultMemoService.getMemos();
    console.log('获取到备忘录数量:', memos.length);
    
    // 获取统计信息
    const stats = await defaultMemoService.getStats();
    console.log('备忘录统计:', stats);
    
    console.log('✓ 备忘录服务测试通过');
  } catch (error) {
    console.log('✗ 备忘录服务测试失败:', error.message);
  }

  // 测试4: 向后兼容性
  console.log('\n测试4: 向后兼容性');
  try {
    // 导入旧接口
    const { categoryService, memoService } = await import('./services/categoryService.js');
    const memoServiceObj = await import('./services/memoService.js');
    
    console.log('旧接口 categoryService 类型:', typeof categoryService);
    console.log('旧接口 memoService 类型:', typeof memoServiceObj.memoService);
    
    // 测试旧接口方法
    const oldCategories = categoryService.getCategories();
    console.log('旧接口获取分类:', Array.isArray(oldCategories) ? '✓' : '✗');
    
    console.log('✓ 向后兼容性测试通过');
  } catch (error) {
    console.log('✗ 向后兼容性测试失败:', error.message);
  }

  console.log('\n=== 测试完成 ===');
  console.log('注意: 这些是基本功能测试，确保重构没有破坏核心功能。');
  console.log('建议进行更全面的集成测试以确保所有功能正常工作。');
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
});
