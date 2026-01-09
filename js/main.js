// メインアプリケーションエントリーポイント
import * as memoService from './memoService.js';
import * as memoUI from './memoUI.js';
import { attachHandlers } from './memoHandlers.js';
import { modalManager } from './modal.js';
import { ThemeManager } from './themeManager.js';

// モーダルマネージャー初期化（DOMロード確認）
document.addEventListener('DOMContentLoaded', () => {
    console.log('モーダルマネージャー初期化済み');

    // 初始化主题管理器
    const themeManager = new ThemeManager();

    const saveBtn = document.getElementById('save-memo');
    const titleInput = document.getElementById('memo-title');
    const contentInput = document.getElementById('memo-content');
    const categorySelect = document.getElementById('memo-category');
    const memoList = document.getElementById('memo-list');


    // 事件委托：点击 memo-item 展开/收起
    memoList.addEventListener('click', (e) => {
        const memoItem = e.target.closest('.memo-item');
        if (!memoItem) return;
        memoItem.classList.toggle('expanded');
    });


    // 分页
    let paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        memoList.parentNode.appendChild(paginationContainer);
    }



    // --------------------------
    // 自定义分类 右键菜单
    // --------------------------
   (function initCustomCategories() {
    const categoryList = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category');
    let customCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');

    // 创建右键菜单
    const contextMenu = document.createElement('ul');
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.display = 'none';
    contextMenu.style.listStyle = 'none';
    contextMenu.style.padding = '5px 0';
    contextMenu.style.background = '#fff';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    document.body.appendChild(contextMenu);

    function renderCustomCategories() {
        categoryList.querySelectorAll('.custom-category').forEach(el => el.remove());
        customCategories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'category-item custom-category';
            li.dataset.category = cat;
            li.textContent = cat;
            categoryList.appendChild(li);
        });

        // 更新下拉框
        const categorySelect = document.getElementById('memo-category');
        categorySelect.innerHTML = '<option value="">📂 カテゴリを選択（任意）</option>';
        categoryList.querySelectorAll('.category-item').forEach(li => {
            const option = document.createElement('option');
            option.value = li.dataset.category;
            option.textContent = li.textContent;
            categorySelect.appendChild(option);
        });
    }

    renderCustomCategories();

    addCategoryBtn.addEventListener('click', () => {
        const newCat = prompt('新しいカテゴリ名を入力してください:').trim();
        if (!newCat) return;
        if (customCategories.includes(newCat)) {
            alert('このカテゴリは既に存在します。');
            return;
        }
        customCategories.push(newCat);
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        renderCustomCategories();
    });

    // 右键事件
    categoryList.addEventListener('contextmenu', (e) => {
        const li = e.target.closest('.custom-category');
        if (!li) return;

        e.preventDefault();
        const cat = li.dataset.category;

        // 清空菜单
        contextMenu.innerHTML = '';
        const editItem = document.createElement('li');
        editItem.textContent = '✏️ 修改标签';
        editItem.style.padding = '5px 10px';
        editItem.style.cursor = 'pointer';
        const deleteItem = document.createElement('li');
        deleteItem.textContent = '🗑 删除标签';
        deleteItem.style.padding = '5px 10px';
        deleteItem.style.cursor = 'pointer';

        contextMenu.appendChild(editItem);
        contextMenu.appendChild(deleteItem);

        // 显示菜单
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.display = 'block';

        // 编辑操作
        editItem.onclick = () => {
            const newName = prompt('新的分类名称:', cat);
            if (!newName) return;
            const index = customCategories.indexOf(cat);
            if (index !== -1) {
                customCategories[index] = newName;
                localStorage.setItem('customCategories', JSON.stringify(customCategories));
                renderCustomCategories();
            }
            contextMenu.style.display = 'none';
        };

        // 删除操作
        deleteItem.onclick = () => {
            customCategories = customCategories.filter(c => c !== cat);
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
            renderCustomCategories();
            contextMenu.style.display = 'none';
        };
    });

    // 点击页面其他地方隐藏菜单
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
})();






    // イベントハンドラー設定
    attachHandlers({
        saveBtn,
        titleInput,
        contentInput,
        categorySelect,
        memoList,
        paginationContainer,
        memoService,
        memoUI
    });
    memoService.getMemos().then(memos => {
        memoUI.renderMemoList(memos);
    });






    // -------------------------------
    // 自定义分类功能
    // -------------------------------

    // 获取 DOM
    const categoryList = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category');
    const memoCategorySelect = document.getElementById('memo-category');

    // 读取本地存储的自定义分类
    let customCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');

    // 渲染自定义分类到左侧列表和右侧下拉框
    function renderCustomCategories() {
        // 清除旧的渲染（避免重复）
        document.querySelectorAll('.custom-category').forEach(el => el.remove());

        customCategories.forEach(cat => {
            // 左侧分类列表
            const li = document.createElement('li');
            li.textContent = cat;
            li.dataset.category = cat;
            li.classList.add('category-item', 'custom-category');
            categoryList.appendChild(li);

            // 右侧下拉选择框
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            option.classList.add('custom-category');
            memoCategorySelect.appendChild(option);
        });
    }

    // 点击“新增分类”按钮
    addCategoryBtn.addEventListener('click', () => {
        const newCategory = prompt('新しいカテゴリ名を入力してください:');
        if (!newCategory) return;

        // 重复检查
        if (customCategories.includes(newCategory)) {
            alert('このカテゴリはすでに存在します。');
            return;
        }

        customCategories.push(newCategory);
        localStorage.setItem('customCategories', JSON.stringify(customCategories));

        renderCustomCategories();
    });

    // 初始化渲染
    renderCustomCategories();

    // -------------------------------
    // 分类点击事件保持现有逻辑
    // -------------------------------
    categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        // 高亮选中
        document.querySelectorAll('#category-list .category-item').forEach(el => el.classList.remove('active'));
        li.classList.add('active');

        // 使用现有 memoUI 渲染过滤
        const category = li.dataset.category;
        memoService.getMemos().then(memos => {
            if (!category) {
                memoUI.renderMemoList(memos);
            } else {
                const filtered = memos.filter(m => m.category === category);
                memoUI.renderMemoList(filtered);
            }
        });
    });


});
