// js/main.js
// ページの読み込み完了後に処理を開始
document.addEventListener('DOMContentLoaded', () => {
    // 各種DOM要素を取得
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');

    // ---- メモ一覧を読み込む関数 ----
    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.text())
            .then(text => {
                console.log('get_memos.php response:', text);
                let data;
                // JSON文字列をオブジェクトに変換
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    memoList.innerHTML = '<p>JSON のパースに失敗しました。</p>';
                    return;
                }
                // 配列でない、または空配列の場合
                if (!Array.isArray(data) || data.length === 0) {
                    memoList.innerHTML = '<p>メモはありません。</p>';
                    return;
                }
                // 正常にデータがあれば表示
                displayMemos(data);
            })
            .catch(err => {
                console.error('fetch error:', err);
                memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    // ---- メモ一覧を画面に表示する関数 ----
    function displayMemos(memos) {
        // 一旦リストを空にする
        memoList.innerHTML = '';
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.classList.add('memo-item');
            memoDiv.dataset.id = memo.id; // メモIDをdata属性に保持

            // メモ1件分のHTML
            memoDiv.innerHTML = `
                <div class="memo-header">
                    <strong class="memo-title">${escapeHtml(memo.title)}</strong>
                    <span class="memo-date">${memo.date || ''}</span>
                    <button class="edit-btn">✏️</button>
                </div>
                <div class="memo-body">${escapeHtml(memo.content)}</div>
                <div class="memo-category">分類: ${escapeHtml(memo.category || '')}</div>
            `;
            memoList.appendChild(memoDiv);

            // ✏️ボタンをクリックしたときだけ編集モードにする
            const editBtn = memoDiv.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => makeEditable(memoDiv, memo));
        });
    }

    // ---- 「保存」ボタンがあれば、新規メモ保存処理を登録 ----
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const content = memoContent.value.trim();
            const category = memoCategory.value.trim();

            // タイトルと内容は必須
            if (!title || !content) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            // 新規メモをサーバーに送信して保存
            fetch('api/save_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            })
            .then(res => res.text())
            .then(text => {
                console.log('save_memo.php response:', text);
                let data;
                // レスポンスをJSONとしてパース
                try { 
                    data = JSON.parse(text); 
                } catch (e) {
                    console.error('save_memo.php JSON parse error:', e);
                    alert('サーバーからのレスポンスが不正です。');
                    return;
                }
                if (data.success) {
                    alert('メモを保存しました！');
                    // フォームをリセット
                    memoTitle.value = '';
                    memoContent.value = '';
                    memoCategory.value = '';
                    // 最新のメモ一覧を再読み込み
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

    // ---- メモを更新する関数（必要なら他の場所からも呼べる汎用関数）----
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
            try { 
                data = JSON.parse(text); 
            } catch (e) {
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

    // ---- メモを削除する関数 ----
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
                    alert('メモを削除しました。');
                    // 削除後、一覧を再読み込み
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

    // ---- XSS対策用：HTMLエスケープ関数 ----
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ---- メモ1件を「編集モード」にする関数 ----
    function makeEditable(memoDiv, memoData) {
        const titleEl = memoDiv.querySelector('.memo-title');
        const bodyEl = memoDiv.querySelector('.memo-body');
        const categoryEl = memoDiv.querySelector('.memo-category');
        const editBtn = memoDiv.querySelector('.edit-btn');

        // 入力用の要素を作成
        const titleInput = document.createElement('input');
        titleInput.value = memoData.title;

        const bodyInput = document.createElement('textarea');
        bodyInput.value = memoData.content;

        const categoryInput = document.createElement('input');
        categoryInput.value = memoData.category || '';

        // 表示テキスト部分を入力欄に置き換える
        titleEl.replaceWith(titleInput);
        bodyEl.replaceWith(bodyInput);
        categoryEl.replaceWith(categoryInput);

        // 編集ボタンの表示を「保存」に変更
        editBtn.textContent = '💾';

        // クリック時の処理を上書き（編集内容を保存）
        editBtn.onclick = () => {
            const id = memoDiv.dataset.id;

            fetch('api/update_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: titleInput.value.trim(),
                    content: bodyInput.value.trim(),
                    category: categoryInput.value.trim()
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // 保存成功時：入力欄を元の表示要素に戻す
                    titleInput.replaceWith(titleEl);
                    bodyInput.replaceWith(bodyEl);
                    categoryInput.replaceWith(categoryEl);

                    titleEl.textContent = titleInput.value;
                    bodyEl.textContent = bodyInput.value;
                    categoryEl.textContent = '分類: ' + categoryInput.value;

                    // ボタン表示をペンのアイコンに戻す
                    editBtn.textContent = '✏️';
                    // 必要なら再度クリックイベントを設定しても良い（今回はそのままでも動作）
                } else {
                    alert('更新に失敗しました：' + (data.message || ''));
                }
            })
            .catch(err => {
                console.error(err);
                alert('通信エラーが発生しました。');
            });
        };
    }

    // ページ読み込み時にメモ一覧を取得
    loadMemos();
});
