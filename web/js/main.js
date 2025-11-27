// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');

    // ---- XSS対策用 ----
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ---- メモを取得して表示 ----
    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.text())
            .then(text => {
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    memoList.innerHTML = '<p>JSON のパースに失敗しました。</p>';
                    return;
                }
                if (!Array.isArray(data) || data.length === 0) {
                    memoList.innerHTML = '<p>メモはありません。</p>';
                    return;
                }
                displayMemos(data);
            })
            .catch(err => {
                console.error(err);
                memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    // ---- メモ表示＋折叠逻辑 ----
    function displayMemos(memos) {
        memoList.innerHTML = '';
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo-item';
            memoDiv.dataset.id = memo.id;

            // header
            const header = document.createElement('div');
            header.className = 'memo-header';

            const titleEl = document.createElement('strong');
            titleEl.className = 'memo-title';
            titleEl.textContent = memo.title || '';

            const dateEl = document.createElement('span');
            dateEl.className = 'memo-date';
            dateEl.textContent = memo.date || '';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.type = 'button';
            editBtn.textContent = '✏️';

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

            // body + category + 折叠
            const bodyEl = document.createElement('div');
            bodyEl.className = 'memo-body';
            const fullText = memo.content || '';
            const shortText = fullText.length > 50 ? fullText.slice(0, 50) + '…' : fullText;
            bodyEl.textContent = shortText;

            const categoryEl = document.createElement('div');
            categoryEl.className = 'memo-category';
            categoryEl.textContent = '分類: ' + (memo.category || '');

            // 展开/收起按钮
            let toggleBtn = null;
            if (fullText.length > 50) {
                toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.textContent = '展开';
                toggleBtn.addEventListener('click', () => {
                    if (bodyEl.textContent === shortText) {
                        bodyEl.textContent = fullText;
                        toggleBtn.textContent = '收起';
                    } else {
                        bodyEl.textContent = shortText;
                        toggleBtn.textContent = '展开';
                    }
                });
            }

            memoDiv.appendChild(header);
            memoDiv.appendChild(bodyEl);
            memoDiv.appendChild(categoryEl);
            if (toggleBtn) memoDiv.appendChild(toggleBtn);

            memoList.appendChild(memoDiv);

            // 编辑按钮
            editBtn.addEventListener('click', () => makeEditable(memoDiv, memo));
        });
    }

    // ---- 新規メモ保存 ----
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const content = memoContent.value.trim();
            const category = memoCategory.value.trim();
            if (!title || !content) return alert('タイトルと内容を入力してください。');

            fetch('api/save_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        memoTitle.value = '';
                        memoContent.value = '';
                        memoCategory.value = '';
                        loadMemos(); // 保存後立即更新列表
                    } else alert('保存に失敗しました：' + (data.message || ''));
                })
                .catch(err => console.error(err));
        });
    }

    // ---- メモ更新 ----
    function updateMemo(id, title, content, category, callback) {
        fetch('api/update_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, content, category })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) callback && callback();
                else alert('更新に失敗しました：' + (data.message || ''));
            })
            .catch(err => console.error(err));
    }

    // ---- メモ削除 ----
    function deleteMemo(id) {
        fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) loadMemos();
                else alert('削除に失敗しました：' + (data.message || ''));
            })
            .catch(err => console.error(err));
    }

    // ---- 编辑模式 ----
    function makeEditable(memoDiv, memoData) {
        if (memoDiv.classList.contains('editing')) return;
        memoDiv.classList.add('editing');

        const editBtn = memoDiv.querySelector('.edit-btn');
        const titleEl = memoDiv.querySelector('.memo-title');
        const bodyEl = memoDiv.querySelector('.memo-body');
        const categoryEl = memoDiv.querySelector('.memo-category');

        // 输入框
        const titleInput = document.createElement('input');
        titleInput.value = memoData.title || '';
        const bodyInput = document.createElement('textarea');
        bodyInput.value = memoData.content || '';
        const categoryInput = document.createElement('input');
        categoryInput.value = memoData.category || '';

        titleEl.replaceWith(titleInput);
        bodyEl.replaceWith(bodyInput);
        categoryEl.replaceWith(categoryInput);

        // 保存按钮
        editBtn.textContent = '💾';
        editBtn.onclick = () => {
            const newTitle = titleInput.value.trim();
            const newBody = bodyInput.value.trim();
            const newCategory = categoryInput.value.trim();
            if (!newTitle || !newBody) return alert('タイトルと内容を入力してください。');

            updateMemo(memoData.id, newTitle, newBody, newCategory, () => {
                memoDiv.classList.remove('editing');
                // 更新显示
                displayMemos([{ id: memoData.id, title: newTitle, content: newBody, category: newCategory, date: memoData.date }]);
                loadMemos(); // 立即更新列表，保证折叠逻辑生效
            });
        };
    }

    // ---- 初回加载 ----
    loadMemos();
});
