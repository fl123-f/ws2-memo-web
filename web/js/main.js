// main.js
import * as memoService from './memoService.js';
import * as memoUI from './memoUI.js';
import { attachHandlers } from './memoHandlers.js';

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-memo');
    const titleInput = document.getElementById('memo-title');
    const contentInput = document.getElementById('memo-content');
    const categorySelect = document.getElementById('memo-category');
    const memoList = document.getElementById('memo-list');

    // 创建分页容器
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        memoList.parentNode.appendChild(paginationContainer);
    }

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
