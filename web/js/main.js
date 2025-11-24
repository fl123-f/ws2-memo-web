document.addEventListener('DOMContentLoaded', () => {
    // memo-list の要素を取得
    const memoList = document.getElementById('memo-list');

    console.log('ページ読み込み完了。get_memos.php を呼び出します…');

    // fetch でバックエンドから JSON データを取得
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
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${memo.title}</strong> - ${memo.date}<br>${memo.content}`;
                    ul.appendChild(li);
                });

                memoList.innerHTML = ''; // 読み込み中の文字を消す
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
});
