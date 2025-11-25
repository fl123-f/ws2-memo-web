document.addEventListener('DOMContentLoaded', () => {
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoCategory = document.getElementById('memo-category');
    const form = document.getElementById('edit-memo-form');

    // URLパラメータからメモIDを取得
    const params = new URLSearchParams(window.location.search);
    const memoId = params.get('id');

    if (!memoId) {
        alert('メモIDが指定されていません。');
        return;
    }

    // --- メモ情報を取得してフォームに反映 ---
    fetch(`api/get_memo.php?id=${memoId}`)
        .then(res => res.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                alert('メモ情報の取得に失敗しました。');
                return;
            }

            if (!data) {
                alert('指定されたメモが存在しません。');
                return;
            }

            memoTitle.value = data.title;
            memoContent.value = data.content;
            memoCategory.value = data.category || '';
        })
        .catch(err => {
            console.error(err);
            alert('通信エラーが発生しました。');
        });

    // --- フォーム送信時 ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = memoTitle.value.trim();
        const content = memoContent.value.trim();
        const category = memoCategory.value.trim();

        if (!title || !content) {
            alert('タイトルと内容は必須です。');
            return;
        }

        fetch('api/update_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: memoId, title, content, category })
        })
        .then(res => res.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                alert('サーバーからのレスポンスが不正です。');
                return;
            }

            if (data.success) {
                alert('メモを更新しました！');
                window.location.href = 'index.html'; // 編集後は一覧へ戻る
            } else {
                alert('更新に失敗しました：' + (data.message || ''));
            }
        })
        .catch(err => {
            console.error(err);
            alert('通信エラーが発生しました。');
        });
    });
});
