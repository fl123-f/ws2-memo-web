// pagination.js
export function renderPagination(currentPage, totalItems, pageSize, container, onPageChange) {
    const pages = Math.ceil(totalItems / pageSize);
    container.innerHTML = '';
    if (pages <= 1) return;

    for (let i = 1; i <= pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.fontWeight = i === currentPage ? 'bold' : 'normal';
        btn.disabled = i === currentPage;
        btn.addEventListener('click', () => onPageChange(i));
        container.appendChild(btn);
    }
}
