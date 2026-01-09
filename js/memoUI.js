// memoUI.js
import { escapeHtml } from './utils.js';

// メモ一覧をレンダリング
// 渲染备忘录列表
export function renderMemos(memos, container, handlers) {
    container.innerHTML = '';
    if (memos.length === 0) {
        container.innerHTML = '<p>メモはありません。</p>';
        return;
    }

    memos.forEach(memo => {
        const memoDiv = document.createElement('div');
        memoDiv.className = 'memo-item';
        memoDiv.dataset.id = memo.id;

        const header = document.createElement('div');
        header.className = 'memo-header';

        const titleEl = document.createElement('strong');
        titleEl.className = 'memo-title';
        titleEl.textContent = memo.title || '';

        const dateEl = document.createElement('span');
        dateEl.className = 'memo-date';
        dateEl.textContent = memo.created_at || memo.date || '';

        // 置顶按钮
        const pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.textContent = memo.is_pinned ? '⭐' : '☆';
        pinBtn.title = memo.is_pinned ? '取消置顶' : '置顶';
        pinBtn.className = 'pin-btn';
        pinBtn.addEventListener('click', () => handlers.onPin(memo.id, memo.is_pinned ? 0 : 1));

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.textContent = '👁️';
        viewBtn.title = '查看详情';
        viewBtn.addEventListener('click', () => handlers.onView(memo));

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '✏️';
        editBtn.title = '编辑';
        editBtn.addEventListener('click', () => handlers.onEdit(memoDiv, memo));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = '删除';
        deleteBtn.addEventListener('click', () => handlers.onDelete(memo.id));

        header.append(titleEl, dateEl, pinBtn, viewBtn, editBtn, deleteBtn);

        const bodyContainer = document.createElement('div');
        bodyContainer.className = 'memo-body-container';

        const fullText = memo.content || '';
        const shortText = fullText.length > 40 ? fullText.slice(0, 40) + '…' : fullText;

        const bodyShort = document.createElement('div');
        bodyShort.className = 'memo-body-short';
        bodyShort.textContent = shortText;

        const bodyFull = document.createElement('div');
        bodyFull.className = 'memo-body-full';
        bodyFull.textContent = fullText;

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.textContent = '展开';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            const expanded = memoDiv.classList.toggle('expanded');

            if (expanded) {
                bodyShort.style.display = 'none';
                bodyFull.style.display = 'block';
                toggleBtn.textContent = '收起';
            } else {
                bodyShort.style.display = 'block';
                bodyFull.style.display = 'none';
                toggleBtn.textContent = '展开';
            }
        });


        bodyContainer.append(bodyShort, bodyFull, toggleBtn);

        const categoryEl = document.createElement('div');
        categoryEl.className = 'memo-category';
        categoryEl.textContent = '分類: ' + (memo.category || '未分類');

        memoDiv.append(header, bodyContainer, categoryEl);
        container.appendChild(memoDiv);
    });
}
