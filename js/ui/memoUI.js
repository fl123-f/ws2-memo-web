import { escapeHtml } from '../utils/utils.js';

// 文本换行函数：每行大约40个字符后换行
function wrapText(text, maxLineLength = 40) {
    if (!text) return '';
    
    const escapedText = escapeHtml(text);
    const words = escapedText.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
        // 如果当前行加上这个词会超过最大长度，则开始新的一行
        if (currentLine.length + word.length + 1 > maxLineLength && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            // 如果不是第一行第一个词，添加空格
            if (currentLine.length > 0) {
                currentLine += ' ' + word;
            } else {
                currentLine = word;
            }
        }
    }
    
    // 添加最后一行
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }
    
    return lines.join('<br>');
}

// 渲染备忘录列表
export function renderMemoList(memos = [], container = document.getElementById('memo-list'), handlers = {}) {
    if (!container) return;

    container.innerHTML = '';
    if (!memos || memos.length === 0) {
        container.innerHTML = '<p>暂无备忘录。</p>';
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
        titleEl.innerHTML = escapeHtml(memo.title || '');

        const dateEl = document.createElement('span');
        dateEl.className = 'memo-date';
        dateEl.textContent = memo.created_at || memo.date || '';

        const pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.textContent = memo.is_pinned ? '⭐' : '☆';
        pinBtn.title = memo.is_pinned ? '取消置顶' : '置顶';
        pinBtn.className = 'pin-btn';
        pinBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (handlers.onPin) handlers.onPin(memo.id, memo.is_pinned ? 0 : 1);
        });

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '✏️';
        editBtn.title = '编辑';
        editBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (handlers.onEdit) handlers.onEdit(memoDiv, memo);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = '删除';
        deleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (handlers.onDelete) handlers.onDelete(memo.id);
        });

        header.append(titleEl, dateEl, pinBtn, editBtn, deleteBtn);

        const bodyContainer = document.createElement('div');
        bodyContainer.className = 'memo-body-container';

        const fullText = memo.content || '';
        const shortText = fullText.length > 40 ? fullText.slice(0, 40) + '…' : fullText;

        const bodyEl = document.createElement('div');
        bodyEl.className = 'memo-body';
        
        // 根据展开状态显示不同的内容
        if (memo.isExpanded) {
            // 展开时使用换行显示
            bodyEl.innerHTML = wrapText(fullText);
        } else {
            // 折叠时显示缩短的文本
            bodyEl.innerHTML = escapeHtml(shortText);
        }

        bodyContainer.append(bodyEl);

        const categoryEl = document.createElement('div');
        categoryEl.className = 'memo-category';
        categoryEl.textContent = '分类: ' + (memo.category || '未分类');

        memoDiv.append(header, bodyContainer, categoryEl);
        container.appendChild(memoDiv);
    });
}
