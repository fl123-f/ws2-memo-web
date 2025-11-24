document.addEventListener('DOMContentLoaded', () => {
    const memoList = document.getElementById('memo-list');
    const saveBtn = document.getElementById('save-memo');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category'); // カテゴリ入力（なければ null）

    // --- メモ一覧取得と表示 ---
    function loadMemos() {
        fetch('api/get_memos.php')
            .then(res => res.text()) // 先用 text 调试
            .then(text => {
                console.log('get_memos.php 生のレスポンス:');
                console.log(text);

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

                const ul = document.createElement('ul');
                ul.style.listStyle = 'none';
                ul.style.padding = '0';

                data.forEach(memo => {
                    const li = document.createElement('li');
                    li.style.border = '1px solid #ccc';
                    li.style.padding = '8px';
                    li.style.marginBottom = '6px';
                    li.style.borderRadius = '4px';
                    li.innerHTML = `
                        <div><strong>${memo.title}</strong> <span style="color: #888;">(${memo.date})</span></div>
                        <div>${memo.content}</div>
                    `;
                    ul.appendChild(li);
                });

                memoList.innerHTML = '';
                memoList.appendChild(ul);
            })
            .catch(err => {
                console.error('fetch error:', err);
                memoList.innerHTML = '<p>データの取得に失敗しました。</p>';
            });
    }

    // 初回読み込み
    loadMemos();

    // --- 新規メモ保存 ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = memoTitle.value.trim();
            const content = memoContent.value.trim();
            const category = memoCategory ? memoCategory.value.trim() : '';

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
                        // 入力欄クリア
                        memoTitle.value = '';
                        memoContent.value = '';
                        if (memoCategory) memoCategory.value = '';
                        // メモ一覧更新
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
});
