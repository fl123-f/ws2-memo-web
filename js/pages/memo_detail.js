// 备忘录详情页面JavaScript
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

// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 加载备忘录详情
async function loadMemoDetail() {
    const memoId = getUrlParam('id');
    const detailContainer = document.getElementById('memo-detail');
    
    if (!memoId) {
        detailContainer.innerHTML = '<p class="error">错误：未指定备忘录ID</p>';
        return;
    }
    
    try {
        const response = await fetch(`api/get_memo.php?id=${memoId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '加载失败');
        }
        
        const memo = data.memo;
        
        // 格式化日期
        const createdDate = memo.created_at ? new Date(memo.created_at).toLocaleString('ja-JP') : '不明';
        const updatedDate = memo.updated_at ? new Date(memo.updated_at).toLocaleString('ja-JP') : '不明';
        
        detailContainer.innerHTML = `
            <div class="memo-detail-card">
                <div class="memo-detail-header">
                    <h2>${memo.title || '无标题'}</h2>
                    <div class="memo-detail-meta">
                        <span class="category">${memo.category || '未分类'}</span>
                        ${memo.is_pinned ? '<span class="pinned-badge">⭐ 已置顶</span>' : ''}
                    </div>
                </div>
                
                <div class="memo-detail-content">
                    <pre>${memo.content || '无内容'}</pre>
                </div>
                
                <div class="memo-detail-footer">
                    <div class="memo-detail-dates">
                        <div><strong>创建时间：</strong>${createdDate}</div>
                        <div><strong>更新时间：</strong>${updatedDate}</div>
                    </div>
                    
                    <div class="memo-detail-actions">
                        <a href="index.html" class="btn btn-secondary">返回列表</a>
                        <a href="index.html?edit=${memo.id}" class="btn btn-primary">编辑</a>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('加载备忘录详情失败:', error);
        detailContainer.innerHTML = `
            <div class="error">
                <p>加载备忘录详情失败：${error.message}</p>
                <a href="index.html" class="btn btn-link">返回列表</a>
            </div>
        `;
    }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('备忘录详情页面初始化');
    // 初始化主题管理器
    const themeManager = new ThemeManager();
    loadMemoDetail();
});
