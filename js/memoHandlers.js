// メモイベントハンドラー
import { modalManager } from './modal.js';
import { escapeHtml, debounce } from './utils.js';

export function attachHandlers({ saveBtn, titleInput, contentInput, categorySelect, memoList, paginationContainer, memoService, memoUI }) {
    let currentPage = 1;
    let pageSize = 10;
    let currentCategory = '';
    let currentKeyword = '';
    let isEditMode = false; // 編集モードフラグ
    let currentEditId = null; // 編集中のメモID
    let autoSaveTimer = null; // 自動保存タイマー
    let lastSavedDraft = null; // 最後に保存したドラフトの状態

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

            memoUI.renderMemos(pageMemos, memoList, { onView, onEdit, onDelete, onPin });
            memoCount.textContent = `メモ件数: ${total}`;

            renderPagination(pages);
            highlightCategory();
        } catch (error) {
            console.error('メモ読み込みエラー:', error);
            memoUI.renderMemos([], memoList, { onView, onEdit, onDelete, onPin });
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
            const confirmed = await modalManager.confirm('削除確認', 'このメモを削除してもよろしいですか？削除後5秒以内に元に戻すことができます。');
            if (confirmed) {
                // 削除前にメモデータを取得して保存
                const res = await memoService.getMemos();
                const memosArray = Array.isArray(res) ? res : res.memos || [];
                const memoToDelete = memosArray.find(m => m.id === id);
                
                if (!memoToDelete) {
                    await modalManager.alert('削除失敗', 'メモが見つかりませんでした');
                    return;
                }
                
                // 削除実行
                await memoService.deleteMemo(id);
                
                // 削除成功メッセージを表示せず、代わりにUndo通知を表示
                showUndoNotification(memoToDelete);
                
                // メモリストを更新
                loadMemos();
            }
        } catch (error) {
            // ユーザーが削除をキャンセル
            console.log('削除キャンセル');
        }
    }
    
    // Undo通知を表示
    function showUndoNotification(deletedMemo) {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.undo-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 通知を作成
        const notification = document.createElement('div');
        notification.className = 'undo-notification';
        notification.innerHTML = `
            <span>メモ「${escapeHtml(deletedMemo.title || '無題')}」を削除しました。</span>
            <button class="undo-btn">元に戻す</button>
            <span class="undo-timer">5</span>
        `;
        
        // 通知をページに追加
        document.body.appendChild(notification);
        
        // タイマー設定
        let timeLeft = 5;
        const timerElement = notification.querySelector('.undo-timer');
        const timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                notification.remove();
            }
        }, 1000);
        
        // Undoボタンのイベントリスナー
        const undoBtn = notification.querySelector('.undo-btn');
        undoBtn.addEventListener('click', async () => {
            clearInterval(timerInterval);
            notification.remove();
            await undoDelete(deletedMemo);
        });
        
        // 5秒後に通知を自動削除
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }
    
    // 削除を元に戻す
    async function undoDelete(memo) {
        try {
            // 削除したメモを再作成
            await memoService.saveMemo(memo.title, memo.content, memo.category);
            await modalManager.alert('元に戻しました', 'メモが正常に復元されました');
            loadMemos();
        } catch (error) {
            console.error('Undo error:', error);
            await modalManager.alert('復元失敗', 'メモの復元に失敗しました');
        }
    }

    // 置顶/取消置顶
    async function onPin(id, is_pinned) {
        try {
            await memoService.pinMemo(id, is_pinned);
            loadMemos();
        } catch (error) {
            console.error('置顶操作失败:', error);
            await modalManager.alert('操作失败', '置顶操作失败，请重试');
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

    // ドラフトを保存する関数（防抖处理）
    function saveDraft() {
        console.log('saveDraft called at:', new Date().toISOString());
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const category = categorySelect.value;
        
        // 空の場合は保存しない
        if (!title && !content && !category) {
            console.log('saveDraft: empty content, skipping');
            return;
        }
        
        const draft = {
            title,
            content,
            category,
            isEditMode,
            currentEditId,
            timestamp: new Date().toISOString()
        };
        
        // 前回のドラフトと同じ場合は保存しない
        if (JSON.stringify(draft) === JSON.stringify(lastSavedDraft)) {
            console.log('saveDraft: same as last draft, skipping');
            return;
        }
        
        // ローカルストレージに保存
        localStorage.setItem('memo_draft', JSON.stringify(draft));
        lastSavedDraft = draft;
        
        console.log('saveDraft: draft saved successfully');
        
        // ドラフト保存インジケーターを表示（防抖处理）
        debouncedShowDraftIndicator();
    }
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 防抖处理的显示草稿指示器函数
    const debouncedShowDraftIndicator = debounce(function() {
        console.log('debouncedShowDraftIndicator called at:', new Date().toISOString());
        showDraftIndicator();
    }, 500); // 500ms防抖延迟
    
    // ドラフト保存インジケーターを表示
    function showDraftIndicator() {
        console.log('showDraftIndicator called at:', new Date().toISOString());
        
        // 既存のインジケーターがあれば削除
        const existingIndicator = document.querySelector('.draft-indicator');
        if (existingIndicator) {
            console.log('showDraftIndicator: removing existing indicator');
            existingIndicator.remove();
        }
        
        // インジケーターを作成
        const indicator = document.createElement('div');
        indicator.className = 'draft-indicator';
        indicator.innerHTML = `
            <span>ドラフトを保存しました</span>
            <button class="clear-draft-btn">クリア</button>
        `;
        
        // インジケーターをページに追加
        document.body.appendChild(indicator);
        console.log('showDraftIndicator: new indicator added');
        
        // クリアボタンのイベントリスナー
        const clearBtn = indicator.querySelector('.clear-draft-btn');
        clearBtn.addEventListener('click', () => {
            console.log('clear draft button clicked');
            clearDraft();
            indicator.remove();
        });
        
        // 3秒後にインジケーターを自動削除
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                console.log('showDraftIndicator: auto-removing indicator after 3s');
                indicator.remove();
            }
        }, 3000);
    }
    
    // ドラフトを復元する関数
    function restoreDraft() {
        const draftJson = localStorage.getItem('memo_draft');
        if (!draftJson) return;
        
        try {
            const draft = JSON.parse(draftJson);
            
            // ドラフトが古すぎる場合は削除（24時間以上前）
            const draftTime = new Date(draft.timestamp);
            const now = new Date();
            const hoursDiff = (now - draftTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                localStorage.removeItem('memo_draft');
                return;
            }
            
            // フォームに復元
            titleInput.value = draft.title || '';
            contentInput.value = draft.content || '';
            categorySelect.value = draft.category || '';
            
            // 編集モードを復元
            if (draft.isEditMode && draft.currentEditId) {
                isEditMode = draft.isEditMode;
                currentEditId = draft.currentEditId;
                saveBtn.textContent = '🔄 更新する';
            }
            
            // 復元通知を表示
            showRestoreNotification();
            
        } catch (error) {
            console.error('ドラフト復元エラー:', error);
            localStorage.removeItem('memo_draft');
        }
    }
    
    // 復元通知を表示
    function showRestoreNotification() {
        // 既存の通知があれば削除
        const existingNotification = document.querySelector('.restore-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 通知を作成
        const notification = document.createElement('div');
        notification.className = 'restore-notification';
        notification.innerHTML = `
            <span>前回のドラフトを復元しました</span>
            <button class="keep-draft-btn">保持</button>
            <button class="discard-draft-btn">破棄</button>
        `;
        
        // 通知をページに追加
        document.body.appendChild(notification);
        
        // 保持ボタンのイベントリスナー
        const keepBtn = notification.querySelector('.keep-draft-btn');
        keepBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 破棄ボタンのイベントリスナー
        const discardBtn = notification.querySelector('.discard-draft-btn');
        discardBtn.addEventListener('click', () => {
            clearDraft();
            notification.remove();
        });
        
        // 10秒後に通知を自動削除
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 10000);
    }
    
    // ドラフトをクリアする関数
    function clearDraft() {
        localStorage.removeItem('memo_draft');
        lastSavedDraft = null;
        
        // 編集モードでない場合はフォームをクリア
        if (!isEditMode) {
            titleInput.value = '';
            contentInput.value = '';
            categorySelect.value = '';
        }
    }
    
    // 自動保存タイマーを開始
    function startAutoSaveTimer() {
        console.log('startAutoSaveTimer called at:', new Date().toISOString());
        
        // 既存のタイマーがあればクリア
        if (autoSaveTimer) {
            console.log('startAutoSaveTimer: clearing existing timer');
            clearInterval(autoSaveTimer);
        }
        
        // 5秒ごとに自動保存
        autoSaveTimer = setInterval(() => {
            console.log('Auto-save timer triggered at:', new Date().toISOString());
            saveDraft();
        }, 5000);
        
        console.log('startAutoSaveTimer: new timer started');
    }
    
    // 入力イベントリスナーを設定
    titleInput.addEventListener('input', () => {
        // 入力があったら自動保存タイマーを再起動
        startAutoSaveTimer();
    });
    
    contentInput.addEventListener('input', () => {
        // 入力があったら自動保存タイマーを再起動
        startAutoSaveTimer();
    });
    
    categorySelect.addEventListener('change', () => {
        // カテゴリ変更があったら自動保存タイマーを再起動
        startAutoSaveTimer();
    });
    
    // 保存成功時にドラフトをクリア
    const originalHandleSave = handleSave;
    handleSave = async function() {
        await originalHandleSave();
        clearDraft();
    };
    
    // ページ読み込み時にドラフトを復元
    window.addEventListener('load', () => {
        restoreDraft();
        startAutoSaveTimer();
    });
    
    // ページ離脱時に警告を表示
    window.addEventListener('beforeunload', (e) => {
        const draftJson = localStorage.getItem('memo_draft');
        if (draftJson) {
            const draft = JSON.parse(draftJson);
            if (draft.title || draft.content || draft.category) {
                e.preventDefault();
                e.returnValue = '保存されていないドラフトがあります。このページを離れますか？';
                return '保存されていないドラフトがあります。このページを離れますか？';
            }
        }
    });

    // 初期読み込み
    loadMemos();
}
