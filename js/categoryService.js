// categoryService.js
export const categoryService = (() => {
    let categories = JSON.parse(localStorage.getItem('customCategories') || '[]');

    function getCategories() {
        return categories;
    }

    function addCategory(name) {
        if (!name || categories.includes(name)) return false;
        categories.push(name);
        save();
        return true;
    }

    function editCategory(oldName, newName) {
        const idx = categories.indexOf(oldName);
        if (idx === -1 || !newName) return false;
        categories[idx] = newName;
        save();
        return true;
    }

    function deleteCategory(name) {
        categories = categories.filter(c => c !== name);
        save();
    }

    function save() {
        localStorage.setItem('customCategories', JSON.stringify(categories));
    }

    return { getCategories, addCategory, editCategory, deleteCategory };
})();
