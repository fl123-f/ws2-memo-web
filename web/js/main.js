document.addEventListener('DOMContentLoaded', () => {
    // メモ一覧を表示する要素
    const memoList = document.getElementById('memo-list');

    console.log('ページ読み込み完了。get_memos.php を呼び出します…');

    // --- メモ一覧取得処理 ---
    fetch('api/get_memos.php')
        .then(response => {
            console.log('HTTP status:', response.status);
            return response.text();   // まずは text として受け取る
        })
        .then(text => {
            console.log('生のレスポンス:');
            console.log(text);

            let data;
            try {
                // JSON 文字列をオブジェクトに変換
                data = JSON.parse(text);
            } catch (e) {
                // JSON 変換失敗時のエラーハンドリング
                memoList.innerHTML = '<p>JSON のパースに失敗しました。</p>';
                console.error('JSON parse error:', e);
                return;
            }

            // データが配列かどうかを確認
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    memoList.innerHTML = '<p>メモはありません。</p>';
                    return;
                }

                // メモを一覧表示
                const ul = document.createElement('ul');
                data.forEach(memo => {
                    // category があれば [カテゴリ] 表示する
                    const categoryLabel = memo.category ? `[${memo.category}] ` : '';

                    const li = document.createElement('li');
                    li.innerHTML = `
                        <strong>${categoryLabel}${memo.title}</strong> - ${memo.date}<br>
                        ${memo.content}
                    `;
                    ul.appendChild(li);
                });

                memoList.innerHTML = ''; // 「読み込み中…」を消す
                memoList.appendChild(ul);
                return;
            }

            // 予期しないレスポンス形式の場合
            memoList.innerHTML = '<p>予期しないレスポンス形式です。</p>';
        })
        .catch(err => {
            // fetch 自体のエラー処理
            console.error('fetch error:', err);
            memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
        });

    // --- 新規メモ作成用の要素 ---
    const saveBtn      = document.getElementById('save-memo');
    const memoTitle    = document.getElementById('memo-title');
    const memoContent  = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category'); // カテゴリ入力（なければ null）

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title   = memoTitle.value.trim();
            const content = memoContent.value.trim();
            const category = memoCategory ? memoCategory.value.trim() : '';

            if (!title || !content) {
                alert('タイトルと内容を入力してください。');
                return;
            }

            // --- メモ保存 API 呼び出し ---
            fetch('api/save_memo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category })
            })
            .then(res => res.text())  // デバッグのため text で受ける
            .then(text => {
                console.log('save_memo.php 生のレスポンス:');
                console.log(text);

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('save_memo.php JSON parse error:', e);
                    alert('サーバーからのレスポンスが不正です。コンソールを確認してください。');
                    return;
                }

                if (data.success) {
                    alert('メモを保存しました！');
                    location.reload(); // 保存後にメモ一覧を更新
                } else {
                    alert('保存に失敗しました。');
                }
            })
            .catch(err => {
                console.error(err);
                alert('通信エラーが発生しました。');
            });
        });
    }
});
