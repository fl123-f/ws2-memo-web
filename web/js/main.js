// main.js
import { setupHandlers } from './memoHandlers.js';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        memoList: document.getElementById('memo-list'),
        memoTitle: document.getElementById('memo-title'),
        memoContent: document.getElementById('memo-content'),
        memoCategory: document.getElementById('memo-category'),
        categoryList: document.getElementById('category-list'),
        memoSearch: document.getElementById('memo-search'),
        memoCountEl: document.getElementById('memo-count')
    };

    const state = {
        currentFilterCategory: '',
        currentSearchKeyword: ''
    };

    setupHandlers(elements, state);
});
