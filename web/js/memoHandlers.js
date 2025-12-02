// memoHandlers.js
export function attachHandlers({ saveBtn, titleInput, contentInput, categorySelect, memoList, paginationContainer, memoService, memoUI }) {
    let currentPage = 1;
    let pageSize = 10;
    let currentCategory = '';
    let currentKeyword = '';

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

   // 新規作成/保存
    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;

        if (!title && !content) return;

        await memoService.saveMemo(title, content, category);
        titleInput.value = '';
        contentInput.value = '';
        categorySelect.value = '';
        saveBtn.textContent = '保存する';
        saveBtn.onclick = null;
        currentPage = 1;
        loadMemos();
    });

    // 編集
    async function onEdit(memoDiv, memo) {
        titleInput.value = memo.title;
        contentInput.value = memo.content;
        categorySelect.value = memo.category;

        saveBtn.textContent = '更新する';
        saveBtn.onclick = async () => {
            await memoService.updateMemo(memo.id, titleInput.value, contentInput.value, categorySelect.value);
            titleInput.value = '';
            contentInput.value = '';
            categorySelect.value = '';
            saveBtn.textContent = '保存する';
            saveBtn.onclick = null;
            loadMemos();
        };
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
