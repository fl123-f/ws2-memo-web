export function attachHandlers({ saveBtn, titleInput, contentInput, categorySelect, memoList, paginationContainer, memoService, memoUI }) {
    let currentPage = 1;
    const pageSize = 10;
    let currentCategory = '';
    let currentKeyword = '';

    const categoryList = document.getElementById('category-list');
    const searchInput = document.getElementById('memo-search');
    const memoCount = document.getElementById('memo-count');

    async function loadMemos() {
        const res = await memoService.getMemos(currentPage, pageSize, currentCategory, currentKeyword);
        const pageMemos = res.memos;
        const total = res.total;
        const pages = Math.ceil(total / pageSize);

        memoUI.renderMemos(pageMemos, memoList, { onEdit, onDelete });
        memoCount.textContent = `メモ件数: ${total}`;

        renderPagination(pages);
        highlightCategory();
    }

    function renderPagination(pages) {
        paginationContainer.innerHTML = '';
        if (pages <= 1) return;
        for (let i = 1; i <= pages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.disabled = i === currentPage;
            btn.addEventListener('click', () => {
                currentPage = i;
                loadMemos();
            });
            paginationContainer.appendChild(btn);
        }
    }

    // 新建/保存
    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;

        if (!title && !content) return;

        await memoService.saveMemo(title, content, category);
        titleInput.value = '';
        contentInput.value = '';
        categorySelect.value = '';
        currentPage = 1;
        loadMemos();
    });

    // 编辑
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
            currentPage = 1;
            loadMemos();
        };
    }

    // 删除
    async function onDelete(id) {
        if (!confirm('本当に削除しますか？')) return;
        await memoService.deleteMemo(id);
        loadMemos();
    }

    // 分类点击
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        currentCategory = li.dataset.category;
        currentPage = 1;
        loadMemos();
    });

    // 搜索
    searchInput.addEventListener('input', (e) => {
        currentKeyword = e.target.value.trim();
        currentPage = 1;
        loadMemos();
    });

    // 高亮当前分类
    function highlightCategory() {
        categoryList.querySelectorAll('li').forEach(li => {
            if (li.dataset.category === currentCategory) {
                li.style.fontWeight = 'bold';
            } else {
                li.style.fontWeight = '';
            }
        });
    }

    // 初次加载
    loadMemos();
}
