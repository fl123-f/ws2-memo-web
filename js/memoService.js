// memoService.js
export async function getMemos() {
    try {
        const res = await fetch('api/get_memos.php');
        const text = await res.text();
        const data = JSON.parse(text);
        return data || { memos: [] };
    } catch (err) {
        console.error('getMemos error:', err);
        return { memos: [] };
    }
}

export async function saveMemo(title, content, category) {
    try {
        const res = await fetch('api/save_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category })
        });
        return JSON.parse(await res.text());
    } catch (err) {
        console.error('saveMemo error:', err);
        return { success: false };
    }
}

export async function updateMemo(id, title, content, category) {
    try {
        const res = await fetch('api/update_memo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, content, category })
        });
        return JSON.parse(await res.text());
    } catch (err) {
        console.error('updateMemo error:', err);
        return { success: false };
    }
}

export async function deleteMemo(id) {
    try {
        const res = await fetch(`api/delete_memo.php?id=${encodeURIComponent(id)}`);
        return JSON.parse(await res.text());
    } catch (err) {
        console.error('deleteMemo error:', err);
        return { success: false };
    }
}

export async function exportJSON() {
    try {
        const res = await fetch('api/import_export.php?action=export&format=json');
        const data = await res.json();
        return data;
    } catch (err) {
        console.error('exportJSON error:', err);
        return [];
    }
}

export async function exportCSV() {
    try {
        const res = await fetch('api/import_export.php?action=export&format=csv');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const csvText = await res.text();
        return csvText;
    } catch (err) {
        console.error('exportCSV error:', err);
        return '';
    }
}
