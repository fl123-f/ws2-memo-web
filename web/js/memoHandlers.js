// memoHandlers.js
import * as memoService from './memoService.js';
import { renderMemos } from './memoUI.js';

export function setupHandlers(elements, state) {
    const { memoList, memoTitle, memoContent, memoCategory, categoryList, memoSearch, memoCountEl } = elements;

    // 保存新笔记
    document.getElementById('save-memo').addEventListener('click', async () => {
        const title = memoTitle.value.trim();
        const content = memoContent.value.trim();
        const category = memoCategory.value.trim();
        if (!title || !content) { alert('タイトルと内容を入力してください'); return; }
        const result = await memoService.saveMemo(title, content, category);
        if (result.success) {
            memoTitle.value = '';
            memoContent.value = '';
            memoCategory.value = '';
            loadAndRenderMemos();
        } else {
            alert('保存に失敗しました：' + (result.message || ''));
        }
    });

    // 分类点击
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        state.currentFilterCategory = li.dataset.category || '';
        Array.from(categoryList.querySelectorAll('li')).forEach(item => {
            item.style.fontWeight = (item === li) ? 'bold' : 'normal';
        });
        loadAndRenderMemos();
    });

    // 搜索框
    if (memoSearch) {
        memoSearch.addEventListener('input', () => {
            state.currentSearchKeyword = memoSearch.value.trim().toLowerCase();
            loadAndRenderMemos();
        });
    }

    // 编辑
    async function onEdit(memoDiv, memoData) {
        if (memoDiv.classList.contains('editing')) return;
        memoDiv.classList.add('editing');

        const header = memoDiv.querySelector('.memo-header');
        const bodyContainer = memoDiv.querySelector('.memo-body-container');
        const categoryEl = memoDiv.querySelector('.memo-category');
        const editBtn = header.querySelector('.edit-btn');
        const titleEl = header.querySelector('.memo-title');

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = memoData.title || '';
        titleInput.style.width = '60%';

        const categorySelect = document.createElement('select');
        const categories = ['', '授業ノート', '課題・宿題', '試験対策', '課外学習', 'プログラミング', 'Web開発', 'データ分析', '技術メモ', '書籍ノート', '講義資料', 'リファレンス'];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat === '' ? 'カテゴリなし' : cat;
            if (cat === (memoData.category || '')) opt.selected = true;
            categorySelect.appendChild(opt);
        });

        const bodyTextarea = document.createElement('textarea');
        bodyTextarea.value = memoData.content || '';
        bodyTextarea.style.width = '100%';
        bodyTextarea.style.height = '120px';
        bodyTextarea.style.boxSizing = 'border-box';

        header.replaceChild(titleInput, titleEl);
        categoryEl.textContent = '';
        categoryEl.appendChild(categorySelect);
        bodyContainer.innerHTML = '';
        bodyContainer.appendChild(bodyTextarea);

        editBtn.textContent = '保存';
        editBtn.onclick = async () => {
            const newTitle = titleInput.value.trim();
            const newContent = bodyTextarea.value.trim();
            const newCategory = categorySelect.value.trim();
            if (!newTitle || !newContent) { alert('タイトルと内容を入力してください'); return; }

            const result = await memoService.updateMemo(memoDiv.dataset.id, newTitle, newContent, newCategory);
            if (result.success) {
                memoDiv.classList.remove('editing');
                loadAndRenderMemos();
            } else {
                alert('更新に失敗しました：' + (result.message || ''));
            }
        };
    }

    // 删除
    async function onDelete(id) {
        if (!confirm('このメモを削除してもよいですか？')) return;
        const result = await memoService.deleteMemo(id);
        if (result.success) loadAndRenderMemos();
        else alert('削除に失敗しました：' + (result.message || ''));
    }

    // 全部加载并渲染
    async function loadAndRenderMemos() {
        const allMemos = await memoService.getMemos();
        let filtered = allMemos;
        if (state.currentFilterCategory) {
            filtered = filtered.filter(m => (m.category || '') === state.currentFilterCategory);
        }
        if (state.currentSearchKeyword) {
            filtered = filtered.filter(m =>
                (m.title || '').toLowerCase().includes(state.currentSearchKeyword) ||
                (m.content || '').toLowerCase().includes(state.currentSearchKeyword)
            );
        }
        if (memoCountEl) memoCountEl.textContent = `メモ件数: ${filtered.length}`;
        renderMemos(filtered, memoList, { onEdit, onDelete });
    }

    // 初回加载
    loadAndRenderMemos();
}
