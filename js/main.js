import { memoService } from './services/memoService.js';
import { draftService } from './services/draftService.js';
import { undoService } from './services/undoService.js';
import { renderMemoList } from './ui/memoUI.js';
import { debounce } from './utils/utils.js';
import { renderPagination } from './ui/pagination.js';
import { modalManager } from './ui/modal.js';
import categoryService from './services/categoryService.js';
import { ThemeManager } from './ui/themeManager.js';

document.addEventListener('DOMContentLoaded', async () => {
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

    // ---------------- 分类刷新 ----------------

    function extractCategoriesFromMemos(memos) {
        const set = new Set();
        memos.forEach(m => {
            if (m.category) set.add(m.category);
        });
        return Array.from(set);
    }

    function renderCategoryList() {
        if (!categoryList) return;
        categoryList.innerHTML = '';

        const categories = extractCategoriesFromMemos(allMemos);

        categories.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.category = name;
            categoryList.appendChild(li);
        });
    }

    function renderCategorySelect() {
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">未分类</option>';

        const categories = extractCategoriesFromMemos(allMemos);

        categories.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            categorySelect.appendChild(option);
        });
    }




    // ---------------- 备忘录加载 ----------------
    async function loadMemos() {
        const memos = await memoService.getMemos();
        
        // memoService.getMemos() 返回数组，不是对象
        allMemos = Array.isArray(memos) ? memos : [];

        allMemos.forEach(m => {
            if (m.isExpanded === undefined) m.isExpanded = false;
        });

        renderCategoryList();
        renderCategorySelect();
        applyFilters();
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

    searchInput?.addEventListener('input', debounce(async (e) => {
        searchKeyword = e.target.value.trim();
        currentPage = 1;

        if (searchKeyword) {
            // 执行搜索
            const searchResult = await memoService.searchMemos(searchKeyword);
            if (searchResult.success) {
                allMemos = searchResult.memos;
                allMemos.forEach(m => {
                    if (m.isExpanded === undefined) m.isExpanded = false;
                });
            } else {
                allMemos = [];
            }
        } else {
            // 如果没有搜索关键词，重新加载所有备忘录
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

        if (!title && !content) {
            modalManager.alert('保存失败', '标题或内容不能为空');
            return;
        }

        if (isEditMode && currentEditId) {
            await memoService.updateMemo(currentEditId, title, content, category);
            isEditMode = false;
            currentEditId = null;
            saveBtn.textContent = '💾 保存';
        } else {
            await memoService.saveMemo(title, content, category);
        }

        draftService.clearDraft(() => {
            titleInput.value = '';
            contentInput.value = '';
            categorySelect.value = '';
        });

        await loadMemos();
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

    // ---------------- 新增分类示例按钮（可根据需求绑定） ----------------
    const addCategoryBtn = document.getElementById('add-category');
    addCategoryBtn?.addEventListener('click', async () => {
        let categoryName;

        try {
            await modalManager.custom(
                '新增分类',
                `<input type="text" id="new-category" placeholder="分类名称" style="width: 100%; padding: 8px; box-sizing: border-box;">`,
                { cancelText: '取消', confirmText: '新增' }
            );

            categoryName = document.getElementById('new-category').value.trim();
        } catch (err) {
            return; // 用户取消
        }

        if (!categoryName) {
            modalManager.alert('错误', '分类名称不能为空');
            return;
        }
        if (!categoryService.addCategory(categoryName)) {
            modalManager.alert('错误', '分类已存在');
            return;
        }
        // 刷新列表
        renderCategoryList();
        renderCategorySelect();
    });

    // ---------------- 导出按钮 ----------------
    const exportJsonBtn = document.getElementById('export-json');
    exportJsonBtn?.addEventListener('click', async () => {
        try {
            const data = await memoService.exportJSON();
            if (data && Array.isArray(data) && data.length > 0) {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `memos_export_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                modalManager.alert('导出提示', '没有可导出的备忘录数据');
            }
        } catch (error) {
            console.error('导出JSON失败:', error);
            modalManager.alert('导出错误', '导出JSON时发生错误');
        }
    });

    const exportCsvBtn = document.getElementById('export-csv');
    exportCsvBtn?.addEventListener('click', async () => {
        try {
            const csvData = await memoService.exportCSV();
            if (csvData && csvData.trim()) {
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `memos_export_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                modalManager.alert('导出提示', '没有可导出的备忘录数据');
            }
        } catch (error) {
            console.error('导出CSV失败:', error);
            modalManager.alert('导出错误', '导出CSV时发生错误');
        }
    });

    // ---------------- 初始化 ----------------
    // 初始化主题管理器
    new ThemeManager();

    renderCategoryList();
    renderCategorySelect();
    await loadMemos();
});
