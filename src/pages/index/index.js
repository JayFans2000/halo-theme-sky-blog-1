/**
 * Sky Theme - 首页特定脚本
 * 仅在首页加载的JavaScript功能
 */

// 导入首页特定样式
import './index.css';

console.log('Sky Theme - 首页脚本已加载');

/**
 * 瞬间卡片鼠标跟随发光效果
 * 为moment-card元素添加动态光晕交互效果
 */
window.handleMomentCardGlow = function(event, card) {
    // 获取卡片内的光效元素
    const glowElement = card.querySelector('.moment-glow');
    if (!glowElement) return;
    
    // 获取卡片的边界矩形信息
    const rect = card.getBoundingClientRect();
    
    // 计算鼠标在卡片内的相对位置
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 更新光效位置，使其跟随鼠标移动
    glowElement.style.left = x + 'px';
    glowElement.style.top = y + 'px';
};

/**
 * 显示瞬间卡片发光效果
 * @param {HTMLElement} card - 卡片元素
 */
window.showMomentCardGlow = function(card) {
    const glow = card.querySelector('.moment-glow');
    if (glow) {
        glow.style.opacity = '1';
    }
};

/**
 * 隐藏瞬间卡片发光效果
 * @param {HTMLElement} card - 卡片元素
 */
window.hideMomentCardGlow = function(card) {
    const glow = card.querySelector('.moment-glow');
    if (glow) {
        glow.style.opacity = '0';
    }
};

/**
 * 瞬间点赞功能模块
 * 使用 localStorage 持久化存储点赞状态
 */
(function() {
    const STORAGE_KEY = 'sky-theme-liked-moments';
    
    // 获取已点赞的瞬间列表
    function getLikedMoments() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }
    
    // 保存点赞状态
    function saveLikedMoment(momentName) {
        try {
            const liked = getLikedMoments();
            if (!liked.includes(momentName)) {
                liked.push(momentName);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(liked));
            }
        } catch (error) {
            console.error('保存点赞状态失败:', error);
        }
    }
    
    // 检查是否已点赞
    function isLiked(momentName) {
        return getLikedMoments().includes(momentName);
    }

    /**
     * 瞬间点赞功能
     * @param {HTMLElement} button - 点赞按钮元素
     */
    window.upvoteMoment = async function(button) {
        const momentName = button.getAttribute('data-moment-name');
        if (!momentName || isLiked(momentName)) return;

        const icon = button.querySelector('span');
        const likeCountElement = button.parentElement.querySelector('.text-xs.text-gray-400');
        const currentCount = parseInt(likeCountElement.textContent) || 0;

        try {
            const response = await fetch('/apis/api.halo.run/v1alpha1/trackers/upvote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group: 'moment.halo.run',
                    kind: 'Moment',
                    name: momentName,
                    plural: 'moments'
                })
            });

            if (response.ok) {
                saveLikedMoment(momentName);
                icon.className = 'icon-[material-symbols--favorite] w-3.5 h-3.5 text-red-400';
                likeCountElement.textContent = currentCount + 1;
                button.disabled = true;
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };
    
    // 页面加载时恢复点赞状态
    document.addEventListener('DOMContentLoaded', function() {
        const likedMoments = getLikedMoments();
        likedMoments.forEach(momentName => {
            const button = document.querySelector(`[data-moment-name="${momentName}"]`);
            if (button) {
                const icon = button.querySelector('span');
                if (icon) {
                    icon.className = 'icon-[material-symbols--favorite] w-3.5 h-3.5 text-red-400';
                    button.disabled = true;
                }
            }
        });
    });
})();

/**
 * 首页标题特效控制器
 * 使用立即执行函数避免变量名冲突
 */
(function() {
    'use strict';
    
    /**
     * 标题特效管理器
     */
    const TitleEffectsManager = {
        titleElement: null,
        decorationEffect: 'none',
        styleEffect: 'none',
        originalText: '',

        /**
         * 初始化标题特效
         */
        init() {
            // 查找标题元素
            this.titleElement = document.getElementById('main-title');
            if (!this.titleElement) {
                console.warn('未找到标题元素 #main-title');
                return;
            }

            // 获取配置的特效类型
            this.decorationEffect = this.titleElement.dataset.decorationEffect || 'none';
            this.styleEffect = this.titleElement.dataset.styleEffect || 'none';
            this.originalText = this.titleElement.dataset.originalText || this.titleElement.textContent.trim();

            console.log('标题特效配置:', {
                decoration: this.decorationEffect,
                style: this.styleEffect,
                text: this.originalText
            });

            // 应用特效
            this.applyEffects();
        },

        /**
         * 应用所有特效
         */
        applyEffects() {
            // 应用装饰特效
            this.applyDecorationEffect();
            
            // 应用样式特效
            this.applyStyleEffect();
        },

        /**
         * 应用装饰特效
         */
        applyDecorationEffect() {
            if (this.decorationEffect === 'none') return;

            // 为粒子和星光特效准备嵌套结构
            if (this.decorationEffect === 'effect-particles' || this.decorationEffect === 'effect-starlight') {
                this.titleElement.innerHTML = `<span><span><span>${this.originalText}</span></span></span>`;
            }

            // 添加装饰特效类
            this.titleElement.classList.add(this.decorationEffect);

            // 为霓虹边缘特效设置data-text属性
            if (this.decorationEffect === 'effect-neon-edge') {
                this.titleElement.setAttribute('data-text', this.originalText);
            }
        },

        /**
         * 应用样式特效
         */
        applyStyleEffect() {
            if (this.styleEffect === 'none') return;

            // 添加样式特效类
            this.titleElement.classList.add(this.styleEffect);

            // 为特定特效设置数据属性
            if (this.styleEffect === 'effect-marker-pop' || this.styleEffect === 'effect-diagonal-split') {
                this.titleElement.setAttribute('data-text', this.originalText);
            }
        }
    };

    /**
     * 页面加载完成后初始化
     */
    document.addEventListener('DOMContentLoaded', () => {
        TitleEffectsManager.init();
    });

})();
