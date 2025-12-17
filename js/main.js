// メインアプリケーションエントリーポイント
import * as memoService from './memoService.js';
import * as memoUI from './memoUI.js';
import { attachHandlers } from './memoHandlers.js';
import { modalManager } from './modal.js';

// モーダルマネージャー初期化（DOMロード確認）
document.addEventListener('DOMContentLoaded', () => {
    console.log('モーダルマネージャー初期化済み');
});

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-memo');
    const titleInput = document.getElementById('memo-title');
    const contentInput = document.getElementById('memo-content');
    const categorySelect = document.getElementById('memo-category');
    const memoList = document.getElementById('memo-list');

    // ページネーション用コンテナ作成
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        memoList.parentNode.appendChild(paginationContainer);
    }

    // イベントハンドラー設定
    attachHandlers({
        saveBtn,
        titleInput,
        contentInput,
        categorySelect,
        memoList,
        paginationContainer,
        memoService,
        memoUI
    });
});
