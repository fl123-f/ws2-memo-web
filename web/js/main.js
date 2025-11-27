// ...existing code...
// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');

    // 安全的 HTML 转义
    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 统一解析 JSON（返回 null 并在控制台打印原始响应时解析失败）
    function safeParseJson(text, label) {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`${label} raw response:`, text);
            console.error(`${label} JSON parse error:`, e);
            return null;
        }
    }

    // 获取 memos
    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.text())
            .then(text => {
                const data = safeParseJson(text, 'get_memos.php');
                if (!Array.isArray(data) || data.length === 0) {
                    memoList.innerHTML = '<p>メモはありません。</p>';
                    return;
                }
                displayMemos(data);
            })
            .catch(err => {
                console.error('fetch error (get_memos):', err);
                memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    // 渲染列表（包含删除按钮）
    // ...existing code...
    // ---- メモ一覧を画面に表示する関数（按分类分组显示，带折叠/展开） ----
    function displayMemos(memos) {
        memoList.innerHTML = '';

        // 按 category 分组（空或空白视为未分類）
        const groups = {};
        memos.forEach(memo => {
            const catRaw = (memo.category || '').toString().trim();
            const category = catRaw === '' ? '未分類' : catRaw;
            if (!groups[category]) groups[category] = [];
            groups[category].push(memo);
        });

        // 按分类名排序（把未分類放最后）
        const categories = Object.keys(groups).sort((a, b) => {
            if (a === '未分類') return 1;
            if (b === '未分類') return -1;
            return a.localeCompare(b, undefined, { sensitivity: 'base' });
        });

        const previewLength = 50;

        categories.forEach(category => {
            // 分类容器
            const catSection = document.createElement('section');
            catSection.className = 'memo-category-section';

            const catHeader = document.createElement('h2');
            catHeader.className = 'memo-category-title';
            catHeader.textContent = category;
            catSection.appendChild(catHeader);

            // 每个分类下的 memo 列表
            const listDiv = document.createElement('div');
            listDiv.className = 'memo-category-list';

            groups[category].forEach(memo => {
                const memoDiv = document.createElement('div');
                memoDiv.className = 'memo-item';
                memoDiv.dataset.id = memo.id;

                // header: title, date, edit & delete
                const header = document.createElement('div');
                header.className = 'memo-header';

                const titleEl = document.createElement('strong');
                titleEl.className = 'memo-title';
                titleEl.textContent = escapeHtml(memo.title || '');

                const dateEl = document.createElement('span');
                dateEl.className = 'memo-date';
                dateEl.textContent = memo.date || '';

                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.type = 'button';
                editBtn.textContent = '✏️';
                editBtn.addEventListener('click', () => makeEditable(memoDiv, memo));

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.type = 'button';
                deleteBtn.textContent = '🗑️';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('このメモを削除してもよいですか？')) {
                        deleteMemo(memo.id);
                    }
                });

                header.appendChild(titleEl);
                header.appendChild(dateEl);
                header.appendChild(editBtn);
                header.appendChild(deleteBtn);

                // body（预览）
                const bodyEl = document.createElement('div');
                bodyEl.className = 'memo-body';
                const fullText = (memo.content || '').toString();
                const previewText = fullText.length > previewLength
                    ? fullText.slice(0, previewLength) + '…'
                    : fullText;

                bodyEl.dataset.full = fullText;
                bodyEl.dataset.preview = previewText;
                bodyEl.textContent = previewText;

                // 展开/收起按钮
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'toggle-btn';
                toggleBtn.type = 'button';
                toggleBtn.textContent = fullText.length > previewLength ? '展开' : '';
                toggleBtn.addEventListener('click', () => {
                    if (bodyEl.textContent === bodyEl.dataset.preview) {
                        bodyEl.textContent = bodyEl.dataset.full;
                        toggleBtn.textContent = '收起';
                    } else {
                        bodyEl.textContent = bodyEl.dataset.preview;
                        toggleBtn.textContent = '展开';
                    }
                });

                // 组装
                memoDiv.appendChild(header);
                memoDiv.appendChild(bodyEl);
                memoDiv.appendChild(toggleBtn);

                listDiv.appendChild(memoDiv);
            });

            catSection.appendChild(listDiv);
            memoList.appendChild(catSection);
        });

        // 若无任何分类（防护）
        if (categories.length === 0) {
            memoList.innerHTML = '<p>メモはありません。</p>';
        }
    }
    // ...existing code...




    // 保存新 memo
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const content = memoContent.value.trim();
            const category = memoCategory.value.trim();

            if (!title || !content) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            fetch('api/save_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            })
                .then(res => res.text())
                .then(text => {
                    const data = safeParseJson(text, 'save_memo.php');
                    if (!data) { alert('サーバーからのレスポンスが不正です。コンソールを確認してください。'); return; }
                    if (data.success) {
                        alert('メモを保存しました！');
                        memoTitle.value = '';
                        memoContent.value = '';
                        memoCategory.value = '';
                        loadMemos();
                    } else {
                        alert('保存に失敗しました：' + (data.message || ''));
                    }
                })
                .catch(err => { console.error('fetch error (save):', err); alert('通信エラー'); });
        });
    }

    // 更新 memo（通用函数）
    function updateMemo(id, title, content, category) {
        fetch('api/update_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, content, category })
        })
            .then(res => res.text())
            .then(text => {
                const data = safeParseJson(text, 'update_memo.php');
                if (!data) { alert('サーバーからのレスポンスが不正です。'); return; }
                if (!data.success) alert('更新に失敗しました：' + (data.message || ''));
            })
            .catch(err => { console.error('fetch error (update):', err); alert('通信エラー'); });
    }

    // 删除 memo
    function deleteMemo(id) {
        fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`, { method: 'GET' })
            .then(res => res.text())
            .then(text => {
                const data = safeParseJson(text, 'delete_memo.php');
                if (!data) { alert('サーバーからのレスポンスが不正です。コンソールを確認してください。'); return; }
                if (data.success) {
                    loadMemos();
                } else {
                    alert('削除に失敗しました：' + (data.message || ''));
                }
            })
            .catch(err => { console.error('fetch error (delete):', err); alert('通信エラー'); });
    }

    // 进入编辑模式，已有 null 检查以避免 replaceWith 错误
    function makeEditable(memoDiv, memoData) {
        if (memoDiv.classList.contains('editing')) return;
        memoDiv.classList.add('editing');

        const editBtn = memoDiv.querySelector('.edit-btn');

        // 获取或创建显示元素
        let titleEl = memoDiv.querySelector('.memo-title');
        let bodyEl = memoDiv.querySelector('.memo-body');
        let categoryEl = memoDiv.querySelector('.memo-category');

        function createDisplay(tag, cls, text) {
            const el = document.createElement(tag);
            if (cls) el.className = cls;
            el.textContent = text || '';
            return el;
        }

        if (!titleEl) titleEl = createDisplay('strong', 'memo-title', memoData.title || '');
        if (!bodyEl) bodyEl = createDisplay('div', 'memo-body', memoData.content || '');
        if (!categoryEl) categoryEl = createDisplay('div', 'memo-category', '分類: ' + (memoData.category || ''));

        const titleInput = document.createElement('input');
        titleInput.className = 'edit-title';
        titleInput.value = memoData.title || '';

        const bodyInput = document.createElement('textarea');
        bodyInput.className = 'edit-body';
        bodyInput.value = memoData.content || '';

        const categoryInput = document.createElement('input');
        categoryInput.className = 'edit-category';
        categoryInput.value = memoData.category || '';

        if (titleEl && titleEl.parentNode) titleEl.replaceWith(titleInput);
        else memoDiv.prepend(titleInput);

        if (bodyEl && bodyEl.parentNode) bodyEl.replaceWith(bodyInput);
        else memoDiv.appendChild(bodyInput);

        if (categoryEl && categoryEl.parentNode) categoryEl.replaceWith(categoryInput);
        else memoDiv.appendChild(categoryInput);

        if (editBtn) editBtn.textContent = '💾';

        const onSave = () => {
            const id = memoDiv.dataset.id;
            const newTitle = titleInput.value.trim();
            const newBody = bodyInput.value.trim();
            const newCategory = categoryInput.value.trim();

            if (!newTitle || !newBody) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            fetch('api/update_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title: newTitle, content: newBody, category: newCategory })
            })
                .then(res => res.text())
                .then(text => {
                    const data = safeParseJson(text, 'update_memo.php (save)');
                    if (!data) { alert('サーバーからのレスポンスが不正です。'); return; }
                    if (data.success) {
                        const newTitleEl = createDisplay('strong', 'memo-title', newTitle);
                        const newBodyEl = createDisplay('div', 'memo-body', newBody);
                        const newCategoryEl = createDisplay('div', 'memo-category', '分類: ' + newCategory);

                        if (titleInput.parentNode) titleInput.replaceWith(newTitleEl);
                        if (bodyInput.parentNode) bodyInput.replaceWith(newBodyEl);
                        if (categoryInput.parentNode) categoryInput.replaceWith(newCategoryEl);

                        if (editBtn) {
                            editBtn.textContent = '✏️';
                            editBtn.onclick = () => makeEditable(memoDiv, { id, title: newTitle, content: newBody, category: newCategory });
                        }

                        memoDiv.classList.remove('editing');
                    } else {
                        alert('更新に失敗しました：' + (data.message || ''));
                    }
                })
                .catch(err => { console.error('fetch error (update save):', err); alert('通信エラー'); });
        };

        if (editBtn) editBtn.onclick = onSave;
        else titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSave(); });
    }

    // 初回ロード
    loadMemos();
});