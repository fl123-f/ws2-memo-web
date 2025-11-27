document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.json())
            .then(data => {
                displayMemos(data);
            })
            .catch(err => {
                console.error(err);
                memoList.innerHTML = '<p>メモの取得に失敗しました。</p>';
            });
    }

    function displayMemos(memos) {
        memoList.innerHTML = '';
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo-item';
            memoDiv.dataset.id = memo.id;

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
            editBtn.textContent = '✏️';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';

            header.append(titleEl, dateEl, editBtn, deleteBtn);

            const bodyEl = document.createElement('div');
            bodyEl.className = 'memo-body';
            bodyEl.textContent = memo.content || '';

            const categoryEl = document.createElement('div');
            categoryEl.className = 'memo-category';
            categoryEl.textContent = '分類: ' + (memo.category || '未分類');

            memoDiv.append(header, bodyEl, categoryEl);
            memoList.appendChild(memoDiv);

            // 编辑功能
            editBtn.addEventListener('click', () => makeEditable(memoDiv, memo));

            // 删除功能
            deleteBtn.addEventListener('click', () => {
                if (confirm('このメモを削除してもよいですか？')) {
                    deleteMemo(memo.id);
                }
            });

            // 展开/收起
            if (bodyEl.textContent.length > 100) {
                const shortText = bodyEl.textContent.slice(0, 100) + '…';
                const toggleBtn = document.createElement('button');
                toggleBtn.textContent = '展開';
                let expanded = false;

                bodyEl.textContent = shortText;
                toggleBtn.addEventListener('click', () => {
                    if (expanded) {
                        bodyEl.textContent = shortText;
                        toggleBtn.textContent = '展開';
                        expanded = false;
                    } else {
                        bodyEl.textContent = memo.content;
                        toggleBtn.textContent = '折りたたむ';
                        expanded = true;
                    }
                });
                memoDiv.appendChild(toggleBtn);
            }
        });
    }

    // 新規メモ保存
    saveBtn.addEventListener('click', () => {
        const title = memoTitle.value.trim();
        const content = memoContent.value.trim();
        const category = memoCategory.value;

        if (!title || !content) {
            alert('タイトルと内容を入力してください。');
            return;
        }

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
                    loadMemos();
                } else {
                    alert('保存に失敗しました');
                }
            })
            .catch(err => console.error(err));
    });

    function makeEditable(memoDiv, memoData) {
        if (memoDiv.classList.contains('editing')) return;
        memoDiv.classList.add('editing');

        const titleInput = document.createElement('input');
        titleInput.value = memoData.title;

        const bodyInput = document.createElement('textarea');
        bodyInput.value = memoData.content;

        const categorySelect = document.createElement('select');
        const categories = ["未分類","授業ノート","課題・宿題","試験対策","課外学習","プログラミング","Web開発","データ分析","技術メモ","参考資料","まとめ","書籍ノート","講義資料","リファレンス"];
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if(cat === memoData.category) option.selected = true;
            categorySelect.appendChild(option);
        });

        const editBtn = memoDiv.querySelector('.edit-btn');
        editBtn.textContent = '💾';

        const onSave = () => {
            const newTitle = titleInput.value.trim();
            const newContent = bodyInput.value.trim();
            const newCategory = categorySelect.value;

            if (!newTitle || !newContent) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            fetch('api/update_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: memoData.id,
                    title: newTitle,
                    content: newContent,
                    category: newCategory
                })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) loadMemos();
                else alert('更新に失敗しました');
            })
            .catch(err => console.error(err));
        };

        memoDiv.innerHTML = '';
        memoDiv.append(titleInput, bodyInput, categorySelect, editBtn);
        editBtn.onclick = onSave;
    }

    function deleteMemo(id) {
        fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) loadMemos();
                else alert('削除に失敗しました');
            })
            .catch(err => console.error(err));
    }

    loadMemos();
});
