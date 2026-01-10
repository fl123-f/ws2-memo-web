// draftService.js

export const draftService = (() => {

    //保存最后一次草稿，防止重复保存
    let lastSavedDraft = null;


    /**
     * 保存草稿
     * 参数对象 { titleInput, contentInput, categorySelect, isEditMode, currentEditId }
     * 只保存表单内容和编辑状态，不重复保存相同内容
     */
    function saveDraft(titleInput, contentInput, categorySelect, isEditMode, currentEditId) {
        const draft = {
            title: titleInput.value.trim(),
            content: contentInput.value.trim(),
            category: categorySelect.value,
            isEditMode,
            currentEditId,
            timestamp: new Date().toISOString()
        };

        //内容为空不保存
        if (!draft.title && !draft.content && !draft.category) return;

        // 只比较关键字段，避免重复保存
        if (
            lastSavedDraft &&
            draft.title === lastSavedDraft.title &&
            draft.content === lastSavedDraft.content &&
            draft.category === lastSavedDraft.category
        ) return;

        localStorage.setItem('memo_draft', JSON.stringify(draft));
        lastSavedDraft = draft;
        
    }


    /**
     * 恢复草稿
     * 会把表单内容填回
     * 返回编辑信息 { isEditMode, currentEditId }，没有草稿返回 {}
     */
    function restoreDraft(titleInput, contentInput, categorySelect, saveBtn) {
        const draftJson = localStorage.getItem('memo_draft');
        if (!draftJson) return;

        try {
            const draft = JSON.parse(draftJson);

            // 填充表单
            titleInput.value = draft.title || '';
            contentInput.value = draft.content || '';
            categorySelect.value = draft.category || '';

            if (draft.isEditMode && draft.currentEditId) {
                return { isEditMode: draft.isEditMode, currentEditId: draft.currentEditId };
            }
        } catch (err) {
            console.warn('草稿解析失败，已清除', err);
            localStorage.removeItem('memo_draft');
        }

        return {};
    }

    /**
     * 清空草稿
     * 可选resetFormCallback:用于清空表单
     */
    function clearDraft(resetFormCallback) {
        localStorage.removeItem('memo_draft');
        lastSavedDraft = null;
        
        if (resetFormCallback) resetFormCallback();
    }

    return { saveDraft, restoreDraft, clearDraft };
})();
