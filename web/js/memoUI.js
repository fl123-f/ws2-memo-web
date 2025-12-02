// memoUI.js
export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// メモ一覧をレンダリング
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
        dateEl.textContent = memo.date || '';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '✏️';
        editBtn.addEventListener('click', () => handlers.onEdit(memoDiv, memo));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => handlers.onDelete(memo.id));

        header.append(titleEl, dateEl, editBtn, deleteBtn);

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
        bodyFull.style.display = 'none';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.textContent = '展開';
        toggleBtn.addEventListener('click', () => {
            const isShortVisible = bodyShort.style.display !== 'none';
            if (isShortVisible) {
                bodyShort.style.display = 'none';
                bodyFull.style.display = 'block';
                toggleBtn.textContent = '折りたたむ';
            } else {
                bodyShort.style.display = 'block';
                bodyFull.style.display = 'none';
                toggleBtn.textContent = '展開';
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
