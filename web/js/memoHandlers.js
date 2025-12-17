// memoHandlers.js
export function attachHandlers({ saveBtn, titleInput, contentInput, categorySelect, memoList, paginationContainer, memoService, memoUI }) {
    let currentPage = 1;
    let pageSize = 10;
    let currentCategory = '';
    let currentKeyword = '';
    let isEditMode = false; // 添加编辑模式标志
    let currentEditId = null; // 当前编辑的笔记ID

    const categoryList = document.getElementById('category-list');
    const searchInput = document.getElementById('memo-search');
    const memoCount = document.getElementById('memo-count');

    // 選択されたカテゴリをハイライト
    function highlightCategory() {
        categoryList.querySelectorAll('li').forEach(li => {
            li.style.fontWeight = li.dataset.category === currentCategory ? 'bold' : 'normal';
        });
    }

      // メモを読み込む
    async function loadMemos() {
        const res = await memoService.getMemos();
        const filteredMemos = res.memos.filter(m => {
            const matchCategory = currentCategory === '' || m.category === currentCategory;
            const matchKeyword = currentKeyword === '' || m.title.includes(currentKeyword) || m.content.includes(currentKeyword);
            return matchCategory && matchKeyword;
        });

        const total = filteredMemos.length;
        const pages = Math.ceil(total / pageSize);
        const start = (currentPage - 1) * pageSize;
        const pageMemos = filteredMemos.slice(start, start + pageSize);

        memoUI.renderMemos(pageMemos, memoList, { onEdit, onDelete });
        memoCount.textContent = `メモ件数: ${total}`;

        renderPagination(pages);
        highlightCategory();
    }

     // ページネーションを表示
    function renderPagination(pages) {
        paginationContainer.innerHTML = '';
        if (pages <= 1) return;
        for (let i = 1; i <= pages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.style.fontWeight = i === currentPage ? 'bold' : 'normal';
            btn.disabled = i === currentPage;
            btn.addEventListener('click', () => {
                currentPage = i;
                loadMemos();
            });
            paginationContainer.appendChild(btn);
        }
    }

    // 保存处理函数
    async function handleSave() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;

        if (!title && !content) return;

        if (isEditMode && currentEditId) {
            // 编辑模式：更新现有笔记
            await memoService.updateMemo(currentEditId, title, content, category);
        } else {
            // 新建模式：保存新笔记
            await memoService.saveMemo(title, content, category);
        }
        
        // 清空表单
        titleInput.value = '';
        contentInput.value = '';
        categorySelect.value = '';
        
        // 重置为新建模式
        isEditMode = false;
        currentEditId = null;
        saveBtn.textContent = '保存する';
        
        // 重新加载笔记列表
        currentPage = 1;
        loadMemos();
    }

   // 新規作成/保存 - 只绑定一次事件
    saveBtn.addEventListener('click', handleSave);

    // 編集
    async function onEdit(memoDiv, memo) {
        titleInput.value = memo.title;
        contentInput.value = memo.content;
        categorySelect.value = memo.category;

        // 切换到编辑模式
        isEditMode = true;
        currentEditId = memo.id;
        saveBtn.textContent = '更新する';
    }

    // 削除
    async function onDelete(id) {
        if (!confirm('本当に削除しますか？')) return;
        await memoService.deleteMemo(id);
        loadMemos();
    }

    // カテゴリクリック
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        currentCategory = li.dataset.category;
        currentPage = 1;
        loadMemos();
    });

    // 検索
    searchInput.addEventListener('input', (e) => {
        currentKeyword = e.target.value.trim();
        currentPage = 1;
        loadMemos();
    });

    // 初回ロード
    loadMemos();
}
