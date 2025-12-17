// モーダル管理モジュール
export class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.title = document.getElementById('modal-title');
        this.body = document.getElementById('modal-body');
        this.footer = document.getElementById('modal-footer');
        this.closeBtn = document.getElementById('modal-close');
        this.cancelBtn = document.getElementById('modal-cancel');
        this.confirmBtn = document.getElementById('modal-confirm');
        
        this.resolvePromise = null;
        this.rejectPromise = null;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // 閉じるボタン
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // キャンセルボタン
        this.cancelBtn.addEventListener('click', () => {
            if (this.rejectPromise) {
                this.rejectPromise(new Error('キャンセルされました'));
                this.hide();
            }
        });
        
        // 確認ボタン
        this.confirmBtn.addEventListener('click', () => {
            if (this.resolvePromise) {
                this.resolvePromise(true);
                this.hide();
            }
        });
        
        // オーバーレイクリックで閉じる
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                if (this.rejectPromise) {
                    this.rejectPromise(new Error('キャンセルされました'));
                    this.hide();
                }
            }
        });
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.style.display !== 'none') {
                if (this.rejectPromise) {
                    this.rejectPromise(new Error('キャンセルされました'));
                    this.hide();
                }
            }
        });
    }
    
    show() {
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 背景スクロール防止
    }
    
    hide() {
        this.overlay.style.display = 'none';
        document.body.style.overflow = ''; // 背景スクロール復元
        this.resolvePromise = null;
        this.rejectPromise = null;
    }
    
    // 確認ダイアログ表示
    confirm(title, message) {
        return new Promise((resolve, reject) => {
            this.title.textContent = title;
            this.body.innerHTML = `<p>${message}</p>`;
            
            // 確認とキャンセルボタン表示
            this.cancelBtn.style.display = 'inline-block';
            this.confirmBtn.style.display = 'inline-block';
            this.confirmBtn.textContent = '確認';
            
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            
            this.show();
        });
    }
    
    // 警告メッセージ表示（OKボタンのみ）
    alert(title, message) {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.body.innerHTML = `<p>${message}</p>`;
            
            // OKボタンのみ表示
            this.cancelBtn.style.display = 'none';
            this.confirmBtn.style.display = 'inline-block';
            this.confirmBtn.textContent = 'OK';
            
            this.resolvePromise = () => {
                resolve();
                return true;
            };
            
            this.show();
        });
    }
    
    // カスタムコンテンツ表示
    custom(title, contentHtml, options = {}) {
        return new Promise((resolve, reject) => {
            this.title.textContent = title;
            this.body.innerHTML = contentHtml;
            
            // カスタムボタン設定
            if (options.cancelText) {
                this.cancelBtn.style.display = 'inline-block';
                this.cancelBtn.textContent = options.cancelText;
            } else {
                this.cancelBtn.style.display = 'none';
            }
            
            if (options.confirmText) {
                this.confirmBtn.style.display = 'inline-block';
                this.confirmBtn.textContent = options.confirmText;
            } else {
                this.confirmBtn.style.display = 'none';
            }
            
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            
            this.show();
        });
    }
    
    // メモ詳細表示
    showMemoDetail(memo) {
        const content = `
            <div class="memo-detail">
                <div class="detail-item">
                    <strong>タイトル:</strong>
                    <p>${this.escapeHtml(memo.title || '')}</p>
                </div>
                <div class="detail-item">
                    <strong>カテゴリ:</strong>
                    <p>${this.escapeHtml(memo.category || '未分類')}</p>
                </div>
                <div class="detail-item">
                    <strong>作成日時:</strong>
                    <p>${this.escapeHtml(memo.date || '')}</p>
                </div>
                <div class="detail-item">
                    <strong>内容:</strong>
                    <div class="memo-content">${this.formatMemoContent(memo.content || '')}</div>
                </div>
            </div>
        `;
        
        return this.custom(`メモ詳細: ${this.escapeHtml(memo.title || '')}`, content, {
            cancelText: '閉じる',
            confirmText: null
        });
    }
    
    // HTMLエスケープ
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // メモ内容フォーマット
    formatMemoContent(content) {
        // 改行を保持
        const escaped = this.escapeHtml(content);
        return escaped.replace(/\n/g, '<br>');
    }
}

// グローバルモーダルマネージャーインスタンス作成
export const modalManager = new ModalManager();
