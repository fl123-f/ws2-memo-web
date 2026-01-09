// draftService.js
export const draftService = (() => {
    let lastSavedDraft = null;
    let draftIndicatorVisible = false;

    function saveDraft(titleInput, contentInput, categorySelect, isEditMode, currentEditId) {
        const draft = {
            title: titleInput.value.trim(),
            content: contentInput.value.trim(),
            category: categorySelect.value,
            isEditMode,
            currentEditId,
            timestamp: new Date().toISOString()
        };
        if (!draft.title && !draft.content && !draft.category) return;
        if (JSON.stringify(draft) === JSON.stringify(lastSavedDraft)) return;

        localStorage.setItem('memo_draft', JSON.stringify(draft));
        lastSavedDraft = draft;
        showDraftIndicator();
    }

    function restoreDraft(titleInput, contentInput, categorySelect, saveBtn) {
        const draftJson = localStorage.getItem('memo_draft');
        if (!draftJson) return;

        try {
            const draft = JSON.parse(draftJson);
            const draftTime = new Date(draft.timestamp);
            if ((new Date() - draftTime) / (1000 * 60 * 60) > 24) {
                localStorage.removeItem('memo_draft');
                return;
            }

            titleInput.value = draft.title || '';
            contentInput.value = draft.content || '';
            categorySelect.value = draft.category || '';
            if (draft.isEditMode && draft.currentEditId) {
                saveBtn.textContent = '🔄 更新';
                return { isEditMode: draft.isEditMode, currentEditId: draft.currentEditId };
            }
        } catch {
            localStorage.removeItem('memo_draft');
        }
        return {};
    }

    function clearDraft(resetFormCallback) {
        localStorage.removeItem('memo_draft');
        lastSavedDraft = null;
        draftIndicatorVisible = false;
        if (resetFormCallback) resetFormCallback();
    }

    function showDraftIndicator() {
        if (draftIndicatorVisible) return;
        draftIndicatorVisible = true;

        const indicator = document.createElement('div');
        indicator.className = 'draft-indicator';
        indicator.innerHTML = `<span>草稿已保存</span><button class="clear-draft-btn">清除</button>`;
        document.body.appendChild(indicator);

        indicator.querySelector('.clear-draft-btn').addEventListener('click', () => {
            clearDraft();
            indicator.remove();
        });

        setTimeout(() => {
            if (document.body.contains(indicator)) indicator.remove();
            draftIndicatorVisible = false;
        }, 3000);
    }

    return { saveDraft, restoreDraft, clearDraft };
})();
