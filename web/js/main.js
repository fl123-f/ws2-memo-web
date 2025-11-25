// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');

    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.text())
            .then(text => {
                console.log('get_memos.php response:', text);
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
                console.error('fetch error:', err);
                memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    function displayMemos(memos) {
        memoList.innerHTML = '';
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.classList.add('memo-item');
            memoDiv.innerHTML = `
                <div class="memo-header">
                    <input type="text" class="memo-title-input" value="${escapeHtml(memo.title || '')}" placeholder="タイトル">
                    <input type="text" class="memo-category-input" value="${escapeHtml(memo.category || '')}" placeholder="カテゴリ">
                    <span class="memo-date">${memo.date || ''}</span>
                </div>
                <div class="memo-body">
                    <textarea class="memo-content-input" rows="4" placeholder="内容">${escapeHtml(memo.content || '')}</textarea>
                </div>
                <div class="memo-footer">
                    <button type="button" class="update-memo-btn">更新する</button>
                    <button type="button" class="delete-memo-btn">削除</button>
                </div>
            `;
            const titleInput = memoDiv.querySelector('.memo-title-input');
            const categoryInput = memoDiv.querySelector('.memo-category-input');
            const contentInput = memoDiv.querySelector('.memo-content-input');
            const updateBtn = memoDiv.querySelector('.update-memo-btn');
            const deleteBtn = memoDiv.querySelector('.delete-memo-btn');

            updateBtn.addEventListener('click', () => {
                const newTitle = titleInput.value.trim();
                const newContent = contentInput.value.trim();
                const newCategory = categoryInput.value.trim();
                if (!newTitle || !newContent) {
                    alert('タイトルと内容は必須です。');
                    return;
                }
                updateMemo(memo.id, newTitle, newContent, newCategory);
            });

            deleteBtn.addEventListener('click', () => {
                if (!confirm('このメモを削除しますか？')) return;
                deleteMemo(memo.id);
            });

            memoList.appendChild(memoDiv);
        });
    }

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
                console.log('save_memo.php response:', text);
                let data;
                try { data = JSON.parse(text); } catch (e) {
                    console.error('save_memo.php JSON parse error:', e);
                    alert('サーバーからのレスポンスが不正です。');
                    return;
                }
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
            .catch(err => {
                console.error(err);
                alert('通信エラーが発生しました。');
            });
        });
    }

    function updateMemo(id, title, content, category) {
        fetch('api/update_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, content, category })
        })
        .then(res => res.text())
        .then(text => {
            console.log('update_memo.php response:', text);
            let data;
            try { data = JSON.parse(text); } catch (e) {
                console.error('update_memo.php JSON parse error:', e);
                alert('サーバーからのレスポンスが不正です。');
                return;
            }
            if (data.success) {
                alert('メモを更新しました！');
            } else {
                alert('更新に失敗しました：' + (data.message || ''));
            }
        })
        .catch(err => {
            console.error(err);
            alert('通信エラーが発生しました。');
        });
    }

    function deleteMemo(id) {
        fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`, { method: 'GET' })
            .then(res => res.text())
            .then(text => {
                console.log('delete_memo.php response:', text);
                let data;
                try { data = JSON.parse(text); } catch (e) {
                    console.error('delete_memo.php JSON parse error:', e);
                    alert('サーバーからのレスポンスが不正です。');
                    return;
                }
                if (data.success) {
                    alert('メモを削除しました。');
                    loadMemos();
                } else {
                    alert('削除に失敗しました：' + (data.message || ''));
                }
            })
            .catch(err => {
                console.error(err);
                alert('通信エラーが発生しました。');
            });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    loadMemos();
});
