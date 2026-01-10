// 搜索功能实现
import * as memoService from '../services/memoService.js';
import { modalManager } from '../ui/modal.js';

// 主题模式管理
class ThemeManager {
    constructor() {
        this.themeSelect = document.getElementById('theme-select');
        this.currentMode = 'auto'; // 'light', 'dark', 'auto'
        
        this.init();
    }
    
    init() {
        // 从localStorage加载主题设置
        const savedMode = localStorage.getItem('theme-mode');
        
        // 设置初始模式
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto') {
            this.setMode(savedMode);
        } else {
            // 如果没有保存的设置，使用跟随系统模式
            this.setMode('auto');
        }
        
        // 添加选择器事件监听
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                this.setMode(e.target.value);
            });
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 只有在自动模式下才跟随系统
            if (this.currentMode === 'auto') {
                if (e.matches) {
                    this.applyDarkMode();
                } else {
                    this.applyLightMode();
                }
            }
        });
    }
    
    setMode(mode) {
        this.currentMode = mode;
        
        // 更新选择器显示
        if (this.themeSelect) {
            this.themeSelect.value = mode;
        }
        
        // 根据模式应用主题
        switch (mode) {
            case 'light':
                this.applyLightMode();
                localStorage.setItem('theme-mode', 'light');
                break;
            case 'dark':
                this.applyDarkMode();
                localStorage.setItem('theme-mode', 'dark');
                break;
            case 'auto':
                // 跟随系统设置
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    this.applyDarkMode();
                } else {
                    this.applyLightMode();
                }
                localStorage.setItem('theme-mode', 'auto');
                break;
        }
    }
    
    applyLightMode() {
        document.body.classList.remove('dark-mode');
        // 移除旧的theme设置以保持兼容性
        localStorage.removeItem('theme');
    }
    
    applyDarkMode() {
        document.body.classList.add('dark-mode');
        // 移除旧的theme设置以保持兼容性
        localStorage.removeItem('theme');
    }
}

// HTML转义函数（防止XSS攻击）
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

// 高亮关键词函数
function highlightKeyword(text, keyword) {
    if (!text || !keyword) return escapeHtml(text || '');
    
    const escapedText = escapeHtml(text);
    const escapedKeyword = escapeHtml(keyword);
    
    // 创建不区分大小写的正则表达式
    const regex = new RegExp(`(${escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// 搜索备忘录
async function searchMemos(keyword) {
    try {
        const res = await fetch(`api/search_memos.php?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        
        if (!data.success) {
            throw new Error(data.message || '搜索失败');
        }
        
        return data;
    } catch (err) {
        console.error('searchMemos error:', err);
        await modalManager.alert('搜索错误', '搜索过程中发生错误：' + err.message);
        return { success: false, memos: [], keyword, count: 0 };
    }
}

// 渲染搜索结果
function renderSearchResults(memos, keyword) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (memos.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>没有找到包含"<strong>${escapeHtml(keyword)}</strong>"的笔记</p>
                <p>尝试使用其他关键词搜索</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="search-summary">
            <p>找到 <strong>${memos.length}</strong> 条包含"<strong>${escapeHtml(keyword)}</strong>"的笔记</p>
        </div>
        <div class="memo-list">
    `;
    
    memos.forEach(memo => {
        const highlightedTitle = highlightKeyword(memo.title, keyword);
        const highlightedContent = highlightKeyword(memo.content, keyword);
        const truncatedContent = memo.content ? 
            (memo.content.length > 150 ? memo.content.substring(0, 150) + '...' : memo.content) : '';
        const highlightedTruncatedContent = highlightKeyword(truncatedContent, keyword);
        
        html += `
            <div class="memo-card ${memo.is_pinned ? 'pinned' : ''}" data-id="${memo.id}">
                <div class="memo-header">
                    <div class="memo-title">
                        ${memo.is_pinned ? '⭐ ' : ''}
                        ${highlightedTitle || '<span class="no-title">无标题</span>'}
                    </div>
                    <div class="memo-category">${escapeHtml(memo.category || '未分类')}</div>
                </div>
                <div class="memo-content">
                    ${highlightedTruncatedContent || '<span class="no-content">无内容</span>'}
                </div>
                <div class="memo-footer">
                    <div class="memo-date">${escapeHtml(memo.created_at || '')}</div>
                    <div class="memo-actions">
                        <a href="memo_detail.html?id=${memo.id}" class="btn btn-sm btn-link">查看详情</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

// 初始化搜索页面
function initSearchPage() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.querySelector('input[name="keyword"]');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchForm || !searchInput || !resultsContainer) {
        console.error('搜索页面元素未找到');
        return;
    }
    
    // 检查URL中是否有搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const initialKeyword = urlParams.get('keyword');
    
    if (initialKeyword) {
        searchInput.value = initialKeyword;
        performSearch(initialKeyword);
    }
    
    // 表单提交事件
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        
        if (!keyword) {
            await modalManager.alert('搜索提示', '请输入搜索关键词');
            searchInput.focus();
            return;
        }
        
        // 更新URL但不刷新页面
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('keyword', keyword);
        window.history.pushState({}, '', newUrl);
        
        performSearch(keyword);
    });
    
    // 监听浏览器历史变化
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');
        searchInput.value = keyword || '';
        if (keyword) {
            performSearch(keyword);
        } else {
            resultsContainer.innerHTML = '';
        }
    });
}

// 执行搜索
async function performSearch(keyword) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    // 显示加载状态
    resultsContainer.innerHTML = `
        <div class="loading">
            <p>正在搜索"<strong>${escapeHtml(keyword)}</strong>"...</p>
        </div>
    `;
    
    const result = await searchMemos(keyword);
    
    if (result.success) {
        renderSearchResults(result.memos, result.keyword);
    } else {
        resultsContainer.innerHTML = `
            <div class="error">
                <p>搜索失败：${escapeHtml(result.message || '未知错误')}</p>
            </div>
        `;
    }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('搜索页面初始化');
    // 初始化主题管理器
    const themeManager = new ThemeManager();
    initSearchPage();
});
