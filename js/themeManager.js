// 主题模式管理模块
export class ThemeManager {
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
        // 验证模式参数，如果无效则使用默认值
        if (!['light', 'dark', 'auto'].includes(mode)) {
            console.warn(`Invalid theme mode: ${mode}, falling back to 'auto'`);
            mode = 'auto';
        }
        
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
            default:
                // 不应该到达这里，但为了安全起见
                console.error('Unexpected theme mode:', mode);
                this.applyLightMode();
                localStorage.setItem('theme-mode', 'light');
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
