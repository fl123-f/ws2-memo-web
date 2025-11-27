document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');
    const categoryList = document.getElementById('category-list');
    const memoSearch = document.getElementById('memo-search'); // 搜索框

    // 現在選択中のカテゴリ（サイドバー用）
    let currentFilterCategory = '';
    let currentSearchKeyword = ''; // 当前搜索关键字

    // --- HTMLエスケープ ---
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- メモ一覧取得 ---
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
                    if(memoList) memoList.innerHTML = '<p>JSON のパースに失敗しました。</p>';
                    return;
                }
                if (!Array.isArray(data) || data.length === 0) {
                    if(memoList) memoList.innerHTML = '<p>メモはありません。</p>';
                    return;
                }
                displayMemos(data);
            })
            .catch(err => {
                console.error('fetch error:', err);
                if(memoList) memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    // --- メモ一覧表示（カテゴリフィルタ＋検索フィルタ付き） ---
    function displayMemos(memos) {
        if(!memoList) return;
        memoList.innerHTML = '';

        // 先做分类过滤
        let filtered = currentFilterCategory
            ? memos.filter(m => (m.category || '') === currentFilterCategory)
            : memos;

        // 再做关键字搜索
        if (currentSearchKeyword) {
            filtered = filtered.filter(m =>
                (m.title || '').toLowerCase().includes(currentSearchKeyword) ||
                (m.content || '').toLowerCase().includes(currentSearchKeyword)
            );
        }

        if (filtered.length === 0) {
            memoList.innerHTML = '<p>該当するメモはありません。</p>';
            return;
        }

        filtered.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo-item';
            memoDiv.dataset.id = memo.id;

            // --- 上部：タイトル・日付・ボタン ---
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

            header.appendChild(titleEl);
            header.appendChild(dateEl);
            header.appendChild(editBtn);
            header.appendChild(deleteBtn);

            // --- 本文：要約＋全文 ---
            const bodyContainer = document.createElement('div');
            bodyContainer.className = 'memo-body-container';

            const fullText = memo.content || '';
            const shortText = fullText.length > 40
                ? fullText.slice(0, 40) + '…'
                : fullText;

            const bodyShort = document.createElement('div');
            bodyShort.className = 'memo-body-short';
            bodyShort.textContent = shortText;

            const bodyFull = document.createElement('div');
            bodyFull.className = 'memo-body-full';
            bodyFull.textContent = fullText;
            bodyFull.style.display = 'none';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.type = 'button';
            toggleBtn.textContent = '展開';

            toggleBtn.addEventListener('click', () => {
                const isShortVisible = bodyShort.style.display !== 'none';
                if (isShortVisible) {
                    bodyShort.style.display = 'none';
                    bodyFull.style.display = 'block';
                    toggleBtn.textContent = '折りたたむ';
                } else {
                    bodyShort.style.display = 'block';
                    bodyFull.style.display = 'none';
                    toggleBtn.textContent = '展開';
                }
            });

            bodyContainer.appendChild(bodyShort);
            bodyContainer.appendChild(bodyFull);
            bodyContainer.appendChild(toggleBtn);

            // --- カテゴリ表示 ---
            const categoryEl = document.createElement('div');
            categoryEl.className = 'memo-category';
            categoryEl.textContent = '分類: ' + (memo.category || '未分類');

            // 全体を組み立て
            memoDiv.appendChild(header);
            memoDiv.appendChild(bodyContainer);
            memoDiv.appendChild(categoryEl);
            memoList.appendChild(memoDiv);

            // 編集ボタン
            editBtn.addEventListener('click', () => makeEditable(memoDiv, memo));

            // 削除ボタン
            deleteBtn.addEventListener('click', () => {
                if (confirm('このメモを削除してもよいですか？')) {
                    deleteMemo(memo.id);
                }
            });
        });
    }

    // --- 新規保存 ---
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
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
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

    // --- 削除 ---
    function deleteMemo(id) {
        fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`, { method: 'GET' })
            .then(res => res.text())
            .then(text => {
                console.log('delete_memo.php response:', text);
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('delete_memo.php JSON parse error:', e);
                    alert('サーバーからのレスポンスが不正です。');
                    return;
                }
                if (data.success) {
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

    // --- 編集モード ---
    function makeEditable(memoDiv, memoData) {
        if (memoDiv.classList.contains('editing')) return;
        memoDiv.classList.add('editing');

        const header = memoDiv.querySelector('.memo-header');
        const bodyContainer = memoDiv.querySelector('.memo-body-container');
        const categoryEl = memoDiv.querySelector('.memo-category');
        const editBtn = header.querySelector('.edit-btn');

        const titleEl = header.querySelector('.memo-title');
        const dateEl = header.querySelector('.memo-date');

        // タイトル用 input
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = memoData.title || '';
        titleInput.style.width = '60%';

        // カテゴリ用 select
        const categorySelect = document.createElement('select');
        const categories = [
            '',
            '授業ノート',
            '課題・宿題',
            '試験対策',
            '課外学習',
            'プログラミング',
            'Web開発',
            'データ分析',
            '技術メモ',
            '書籍ノート',
            '講義資料',
            'リファレンス'
        ];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat === '' ? 'カテゴリなし' : cat;
            if (cat === (memoData.category || '')) {
                opt.selected = true;
            }
            categorySelect.appendChild(opt);
        });

        // 本文用 textarea
        const bodyTextarea = document.createElement('textarea');
        bodyTextarea.value = memoData.content || '';
        bodyTextarea.style.width = '100%';
        bodyTextarea.style.height = '120px';
        bodyTextarea.style.boxSizing = 'border-box';

        // 置き換え
        header.replaceChild(titleInput, titleEl);
        categoryEl.textContent = '';
        categoryEl.appendChild(categorySelect);
        bodyContainer.innerHTML = '';
        bodyContainer.appendChild(bodyTextarea);

        // ボタンを「保存」に変更
        editBtn.textContent = '保存';

        const onSave = () => {
            const id = memoDiv.dataset.id;
            const newTitle = titleInput.value.trim();
            const newBody = bodyTextarea.value.trim();
            const newCategory = categorySelect.value.trim();

            if (!newTitle || !newBody) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            fetch('api/update_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: newTitle,
                    content: newBody,
                    category: newCategory
                })
            })
                .then(res => res.text())
                .then(text => {
                    console.log('update_memo.php response:', text);
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('update_memo.php JSON parse error:', e);
                        alert('サーバーからのレスポンスが不正です。');
                        return;
                    }
                    if (data.success) {
                        memoDiv.classList.remove('editing');
                        loadMemos();
                    } else {
                        alert('更新に失敗しました：' + (data.message || ''));
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('通信エラーが発生しました。');
                });
        };

        editBtn.onclick = onSave;
    }

    // --- サイドバーのカテゴリクリックでフィルタ ---
    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;

            const cat = li.dataset.category || '';
            currentFilterCategory = cat;

            // 見た目の選択状態（太字）
            Array.from(categoryList.querySelectorAll('li')).forEach(item => {
                item.style.fontWeight = (item === li) ? 'bold' : 'normal';
            });

            loadMemos();
        });
    }

    // --- 搜索框事件 ---
    if (memoSearch) {
        memoSearch.addEventListener('input', () => {
            currentSearchKeyword = memoSearch.value.trim().toLowerCase();
            loadMemos();
        });
    }

    // 初期表示
    loadMemos();
});
