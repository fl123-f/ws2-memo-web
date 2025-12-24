// メモイベントハンドラー
import { modalManager } from './modal.js';

export function attachHandlers({ saveBtn, titleInput, contentInput, categorySelect, memoList, paginationContainer, memoService, memoUI }) {
    let currentPage = 1;
    let pageSize = 10;
    let currentCategory = '';
    let currentKeyword = '';
    let isEditMode = false; // 編集モードフラグ
    let currentEditId = null; // 編集中のメモID

    const categoryList = document.getElementById('category-list');
    const searchInput = document.getElementById('memo-search');
    const memoCount = document.getElementById('memo-count');
    const exportJsonBtn = document.getElementById('export-json');
    const exportCsvBtn = document.getElementById('export-csv');

    // 選択されたカテゴリをハイライト
    function highlightCategory() {
        categoryList.querySelectorAll('li').forEach(li => {
            li.style.fontWeight = li.dataset.category === currentCategory ? 'bold' : 'normal';
        });
    }

    // メモ読み込み
    async function loadMemos() {
        try {
            const res = await memoService.getMemos();
            console.log('getMemos 戻り値:', res);

            // memosが配列であることを確認
            const memosArray = Array.isArray(res) ? res : res.memos || [];

            const filteredMemos = memosArray.filter(m => {
                const matchCategory = currentCategory === '' || m.category === currentCategory;
                const matchKeyword = currentKeyword === '' || m.title.includes(currentKeyword) || m.content.includes(currentKeyword);
                return matchCategory && matchKeyword;
            });

            const total = filteredMemos.length;
            const pages = Math.ceil(total / pageSize);
            const start = (currentPage - 1) * pageSize;
            const pageMemos = filteredMemos.slice(start, start + pageSize);

            memoUI.renderMemos(pageMemos, memoList, { onView, onEdit, onDelete });
            memoCount.textContent = `メモ件数: ${total}`;

            renderPagination(pages);
            highlightCategory();
        } catch (error) {
            console.error('メモ読み込みエラー:', error);
            memoUI.renderMemos([], memoList, { onView, onEdit, onDelete });
            memoCount.textContent = 'メモ件数: 0';
        }
    }

    // ページネーション表示
    function renderPagination(pages) {
        paginationContainer.innerHTML = '';
        if (pages <= 1) return;
        for (let i = 1; i <= pages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.style.fontWeight = i === currentPage ? 'bold' : 'normal';
            btn.disabled = i === currentPage;
            btn.addEventListener('click', () => {
                currentPage = i;
                loadMemos();
            });
            paginationContainer.appendChild(btn);
        }
    }

    // 保存処理
    async function handleSave() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;

        if (!title && !content) {
            await modalManager.alert('入力エラー', 'タイトルと内容は同時に空にできません');
            return;
        }

        try {
            if (isEditMode && currentEditId) {
                // 編集モード：既存メモ更新
                await memoService.updateMemo(currentEditId, title, content, category);
                await modalManager.alert('更新成功', 'メモが正常に更新されました');
            } else {
                // 新規作成モード：新規メモ保存
                await memoService.saveMemo(title, content, category);
                await modalManager.alert('保存成功', 'メモが正常に保存されました');
            }

            // フォームクリア
            titleInput.value = '';
            contentInput.value = '';
            categorySelect.value = '';

            // 新規作成モードにリセット
            isEditMode = false;
            currentEditId = null;
            saveBtn.textContent = '💾 保存する';

            // メモリスト再読み込み
            currentPage = 1;
            loadMemos();
        } catch (error) {
            console.error('保存エラー:', error);
            await modalManager.alert('保存失敗', '保存中にエラーが発生しました。もう一度お試しください');
        }
    }

    // 保存ボタンイベント
    saveBtn.addEventListener('click', handleSave);

    // 詳細表示
    async function onView(memo) {
        await modalManager.showMemoDetail(memo);
    }

    // 編集
    async function onEdit(memoDiv, memo) {
        titleInput.value = memo.title;
        contentInput.value = memo.content;
        categorySelect.value = memo.category;

        // 編集モードに切り替え
        isEditMode = true;
        currentEditId = memo.id;
        saveBtn.textContent = '🔄 更新する';
        
        // フォームエリアにスクロール
        document.getElementById('new-memo').scrollIntoView({ behavior: 'smooth' });
    }

    // 削除
    async function onDelete(id) {
        try {
            const confirmed = await modalManager.confirm('削除確認', 'このメモを削除してもよろしいですか？この操作は取り消せません。');
            if (confirmed) {
                await memoService.deleteMemo(id);
                await modalManager.alert('削除成功', 'メモが正常に削除されました');
                loadMemos();
            }
        } catch (error) {
            // ユーザーが削除をキャンセル
            console.log('削除キャンセル');
        }
    }

    // カテゴリクリック
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        currentCategory = li.dataset.category;
        currentPage = 1;
        loadMemos();
    });

    // 検索
    searchInput.addEventListener('input', (e) => {
        currentKeyword = e.target.value.trim();
        currentPage = 1;
        loadMemos();
    });

    // JSONエクスポート
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', async () => {
            try {
                const data = await memoService.exportJSON();
                if (data && data.length > 0) {
                    // JSONデータをBlobとしてダウンロード
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `memos_export_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    await modalManager.alert('エクスポート成功', 'JSONファイルが正常にダウンロードされました。');
                } else {
                    await modalManager.alert('エクスポート失敗', 'エクスポートするデータがありません。');
                }
            } catch (error) {
                console.error('JSONエクスポートエラー:', error);
                await modalManager.alert('エクスポート失敗', 'JSONファイルのエクスポート中にエラーが発生しました。');
            }
        });
    }

    // CSVエクスポート
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', async () => {
            try {
                const csvData = await memoService.exportCSV();
                if (csvData && csvData.trim().length > 0) {
                    // CSVデータをBlobとしてダウンロード
                    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `memos_export_${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    await modalManager.alert('エクスポート成功', 'CSVファイルが正常にダウンロードされました。');
                } else {
                    await modalManager.alert('エクスポート失敗', 'エクスポートするデータがありません。');
                }
            } catch (error) {
                console.error('CSVエクスポートエラー:', error);
                await modalManager.alert('エクスポート失敗', 'CSVファイルのエクスポート中にエラーが発生しました。');
            }
        });
    }

    // 初期読み込み
    loadMemos();
}
