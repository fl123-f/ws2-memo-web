// undoService.js
import { escapeHtml } from './utils.js';
import { memoService } from './memoService.js';

export const undoService = (() => {

    function showUndoNotification(deletedMemo, reloadCallback) {
        const existingNotification = document.querySelector('.undo-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'undo-notification';
        notification.innerHTML = `
            <span>已删除备忘录「${escapeHtml(deletedMemo.title || '无标题')}」</span>
            <button class="undo-btn">撤销</button>
            <span class="undo-timer">5</span>
        `;
        document.body.appendChild(notification);

        let timeLeft = 5;
        const timerElement = notification.querySelector('.undo-timer');
        const timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) clearTimer();
        }, 1000);

        function clearTimer() {
            clearInterval(timerInterval);
            if (document.body.contains(notification)) notification.remove();
        }

        notification.querySelector('.undo-btn').addEventListener('click', async () => {
            clearTimer();
            await memoService.saveMemo(deletedMemo.title, deletedMemo.content, deletedMemo.category);
            if (reloadCallback) reloadCallback();
        });

        setTimeout(clearTimer, 5000);
    }

    return { showUndoNotification };
})();

