/**
 * 备忘录页面控制器 - 原始版本（恢复）
 */
import memoService from '../services/memoService.js';
import { draftService } from '../services/draftService.js';
import { undoService } from '../services/undoService.js';
import { renderMemoList } from '../ui/memoUI.js';
import { debounce } from '../utils/utils.js';
import { renderPagination } from '../ui/pagination.js';
import { modalManager } from '../ui/modal.js';
import categoryService from '../services/categoryService.js';
import { ThemeManager } from '../ui/themeManager.js';

/**
 * 初始化备忘录页面
 */
export async function initMemoPage() {
    const saveBtn = document.getElementById('save-memo');
    const titleInput = document.getElementById('memo-title');
    const contentInput = document.getElementById('memo-content');
    const categorySelect = document.getElementById('memo-category');
    const memoList = document.getElementById('memo-list');
    const categoryList = document.getElementById('category-list');
    const paginationContainer = document.getElementById('pagination-container');

    if (!saveBtn || !titleInput || !contentInput || !categorySelect || !memoList) {
        console.error('必要なDOM要素が見つかりません');
        return;
    }

    let allMemos = [];
    let filteredMemos = [];
    let currentPage = 1;
    const pageSize = 5;
    let currentCategory = '';
    let isEditMode = false;
    let currentEditId = null;

    // 从备忘录中提取唯一分类（带缓存）
    let cachedCategories = null;
    let cachedMemosHash = '';

    function extractUniqueCategories(memos) {
        // 生成当前备忘录的简单哈希以检查是否已更改
        const memosHash = memos.map(m => `${m.id}:${m.category}`).join('|');

        if (cachedCategories && cachedMemosHash === memosHash) {
            return cachedCategories;
        }

        const categorySet = new Set();
        memos.forEach(memo => {
            if (memo.category) categorySet.add(memo.category);
        });

        cachedCategories = Array.from(categorySet);
        cachedMemosHash = memosHash;
        return cachedCategories;
    }

    // 获取分类列表（供多个渲染函数使用）
    function getCategories() {
        return extractUniqueCategories(allMemos);
    }

    // 渲染分类列表到侧边栏
    function renderCategorySidebar() {
        if (!categoryList) return;

        const categories = getCategories();
        categoryList.innerHTML = '';

        categories.forEach(categoryName => {
            const listItem = document.createElement('li');
            listItem.textContent = categoryName;
            listItem.dataset.category = categoryName;
            listItem.title = `点击筛选分类: ${categoryName}`;
            categoryList.appendChild(listItem);
        });
    }

    // 渲染分类选择下拉框
    function renderCategoryDropdown() {
        if (!categorySelect) return;

        const categories = getCategories();
        categorySelect.innerHTML = '<option value="">未分类</option>';

        categories.forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    }

    // 更新分类缓存（当备忘录更改时调用）
    function invalidateCategoryCache() {
        cachedCategories = null;
        cachedMemosHash = '';
    }

    // ---------------- 备忘录加载 ----------------
    async function loadMemos() {
        try {
            allMemos = await memoService.getMemos();
            allMemos.forEach(m => {
                if (m.isExpanded === undefined) m.isExpanded = false;
            });

            // 使分类缓存失效并重新渲染
            invalidateCategoryCache();
            renderCategorySidebar();
            renderCategoryDropdown();

            applyFilters();
        } catch (error) {
            console.error('加载备忘录失败:', error);
            modalManager.alert('加载错误', '加载备忘录时发生错误，请刷新页面重试');
        }
    }

    function applyFilters() {
        filteredMemos = currentCategory
            ? allMemos.filter(m => m.category === currentCategory)
            : [...allMemos];

        const start = (currentPage - 1) * pageSize;
        const pageMemos = filteredMemos.slice(start, start + pageSize);

        renderMemoList(pageMemos, memoList, {
            onEdit: (div, memo) => {
                titleInput.value = memo.title || '';
                contentInput.value = memo.content || '';
                categorySelect.value = memo.category || '';
                isEditMode = true;
                currentEditId = memo.id;
                saveBtn.textContent = '🔄 更新';
            },
            onDelete: async id => {
                const memoToDelete = allMemos.find(m => m.id === id);
                if (!memoToDelete) return;
                await memoService.deleteMemo(id);
                undoService.showUndoNotification(memoToDelete, loadMemos);
                await loadMemos();
            },
            onPin: async (id, pinned) => {
                await memoService.pinMemo(id, pinned ? 1 : 0);
                await loadMemos();
            }
        });

        // 更新备忘录数量显示
        const memoCountEl = document.getElementById('memo-count');
        if (memoCountEl) {
            memoCountEl.textContent = `📊 メモ件数: ${filteredMemos.length}`;
        }

        if (paginationContainer) {
            renderPagination(currentPage, filteredMemos.length, pageSize, paginationContainer, page => {
                currentPage = page;
                applyFilters();
            });
        }
    }

    // ---------------- 搜索功能 ----------------
    const searchInput = document.getElementById('memo-search');
    let searchKeyword = '';
    let isSearching = false;

    searchInput?.addEventListener('input', debounce(async (e) => {
        const newKeyword = e.target.value.trim();

        // 如果关键词没有变化，不执行搜索
        if (newKeyword === searchKeyword) return;

        searchKeyword = newKeyword;
        currentPage = 1;

        if (searchKeyword) {
            // 显示搜索状态
            if (memoList) {
                memoList.innerHTML = '<div class="loading">搜索中...</div>';
            }

            isSearching = true;

            try {
                // 执行搜索
                const searchResult = await memoService.searchMemos(searchKeyword);
                if (searchResult.success) {
                    allMemos = searchResult.memos;
                    allMemos.forEach(m => {
                        if (m.isExpanded === undefined) m.isExpanded = false;
                    });

                    // 显示搜索结果数量
                    const searchCountEl = document.getElementById('search-count');
                    if (searchCountEl) {
                        searchCountEl.textContent = `🔍 搜索结果: ${allMemos.length} 条`;
                        searchCountEl.style.display = 'block';
                    }
                } else {
                    allMemos = [];
                    // 显示无结果消息
                    if (memoList) {
                        memoList.innerHTML = '<div class="no-results">未找到匹配的备忘录</div>';
                    }
                }
            } catch (error) {
                console.error('搜索失败:', error);
                allMemos = [];
                if (memoList) {
                    memoList.innerHTML = '<div class="error">搜索时发生错误</div>';
                }
            } finally {
                isSearching = false;
            }
        } else {
            // 如果没有搜索关键词，重新加载所有备忘录
            const searchCountEl = document.getElementById('search-count');
            if (searchCountEl) {
                searchCountEl.style.display = 'none';
            }
            await loadMemos();
            return;
        }

        applyFilters();
    }, 500));

    // ---------------- 分类点击筛选 ----------------
    categoryList?.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li) return;
        categoryList.querySelectorAll('li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        currentCategory = li.dataset.category || '';
        currentPage = 1;
        applyFilters();
    });

    // ---------------- 保存按钮 ----------------
    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value || '';

        // 增强的输入验证
        if (!title && !content) {
            modalManager.alert('保存失败', '标题或内容不能为空');
            return;
        }

        if (title.length > 200) {
            modalManager.alert('保存失败', '标题长度不能超过200个字符');
            return;
        }

        if (content.length > 5000) {
            modalManager.alert('保存失败', '内容长度不能超过5000个字符');
            return;
        }

        try {
            if (isEditMode && currentEditId) {
                await memoService.updateMemo(currentEditId, title, content, category);
                isEditMode = false;
                currentEditId = null;
                saveBtn.textContent = '💾 保存';
                modalManager.alert('成功', '备忘录已更新');
            } else {
                await memoService.saveMemo(title, content, category);
                modalManager.alert('成功', '备忘录已保存');
            }

            draftService.clearDraft(() => {
                titleInput.value = '';
                contentInput.value = '';
                categorySelect.value = '';
            });

            await loadMemos();
        } catch (error) {
            console.error('保存备忘录失败:', error);
            modalManager.alert('保存错误', '保存备忘录时发生错误，请重试');
        }
    });

    // ---------------- 取消按钮 ----------------
    const cancelBtn = document.getElementById('cancel-memo');
    cancelBtn?.addEventListener('click', () => {
        titleInput.value = '';
        contentInput.value = '';
        categorySelect.value = '';
        isEditMode = false;
        currentEditId = null;
        saveBtn.textContent = '💾 保存';
        draftService.clearDraft();
    });

    // ---------------- 草稿自动保存 ----------------
    const autoSaveDraft = debounce(() => {
        draftService.saveDraft(titleInput, contentInput, categorySelect, isEditMode, currentEditId);
    }, 500);
    [titleInput, contentInput, categorySelect].forEach(el => el?.addEventListener('input', autoSaveDraft));

    const draftState = draftService.restoreDraft(titleInput, contentInput, categorySelect, saveBtn) || {};
    isEditMode = draftState.isEditMode || false;
    currentEditId = draftState.currentEditId || null;

    // ---------------- 卡片展开 ----------------
    memoList.addEventListener('click', e => {
        const memoDiv = e.target.closest('.memo-item');
        if (!memoDiv) return;

        // 如果点击的是按钮，不触发展开
        if (e.target.closest('button')) return;

        // 如果点击的是.memo-header区域（但不是按钮），允许展开
        const memoId = memoDiv.dataset.id;
        const memo = allMemos.find(m => m.id == memoId);
        if (!memo) return;

        // 切换展开状态
        memo.isExpanded = !memo.isExpanded;

        // 重新应用过滤器以使用新的wrapText函数重新渲染
        applyFilters();
    });

    // ---------------- 新增分类按钮 ----------------
    const addCategoryBtn = document.getElementById('add-category');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', async () => {
            try {
                // 创建唯一的输入框ID以避免冲突
                const inputId = 'new-category-' + Date.now();
                
                // 弹出自定义输入框
                const result = await modalManager.custom(
                    '新增分类',
                    `<input type="text" id="${inputId}" placeholder="分类名称" autofocus>`,
                    { cancelText: '取消', confirmText: '添加' }
                );

                // 如果用户取消了操作，result会是false或抛出错误
                if (!result) {
                    return; // 用户取消，直接返回
                }

                // 获取输入框的值
                const inputElement = document.getElementById(inputId);
                let categoryName = '';
                
                if (inputElement) {
                    categoryName = inputElement.value.trim();
                }

                // 校验是否为空 - 包括数字0的情况
                if (categoryName === '') {
                    modalManager.alert('错误', '分类名称不能为空');
                    return;
                }

                // 保存带有分类的备忘录（使用分类名作为标题，确保保存成功）
                const title = `分类: ${categoryName}`;
                const content = '此备忘录用于创建分类';
                
                await memoService.saveMemo(title, content, categoryName);
                
                // 重新加载备忘录并更新UI
                await loadMemos();
                
                // 手动更新分类显示（确保UI刷新）
                invalidateCategoryCache();
                renderCategorySidebar();
                renderCategoryDropdown();

                modalManager.alert('成功', `分类 "${categoryName}" 已添加`);
            } catch (error) {
                // 如果是用户取消操作，不显示错误
                if (error.message && error.message.includes('キャンセル')) {
                    return;
                }
                console.error('添加分类失败:', error);
                modalManager.alert('错误', '添加分类时发生错误');
            }
        });
    }

    // ---------------- 初始化 ----------------
    // 初始化主题管理器
    new ThemeManager();

    renderCategorySidebar();
    renderCategoryDropdown();
    await loadMemos();
}
