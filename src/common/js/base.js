/**
 * Sky Theme - 基础公共脚本
 * 包含全局工具函数和公共功能
 */

/**
 * 页面加载屏幕（可配置）
 * 从 html 标签的 data 属性读取配置
 */
(function() {
  // 读取配置
  const config = {
    enabled: document.documentElement.dataset.loadingEnabled === 'true',
    type: document.documentElement.dataset.loadingType || 'spinner',
    imageUrl: document.documentElement.dataset.loadingImageUrl || '',
    text: document.documentElement.dataset.loadingText || '加载中...'
  };
  
  // 如果禁用，跳过
  if (!config.enabled) return;
  
  // 生成加载图标 HTML
  let loadingIcon = '';
  if (config.type === 'image' && config.imageUrl) {
    loadingIcon = `<img src="${config.imageUrl}" style="width: 64px; height: 64px; object-fit: contain;" alt="Loading">`;
  } else {
    loadingIcon = `<span class="loading loading-${config.type} loading-lg text-primary"></span>`;
  }
  
  // 创建加载屏幕
  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'app-loading';
  loadingScreen.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: var(--color-base-100);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.5s ease;
  `;
  
  loadingScreen.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      ${loadingIcon}
      <p style="margin-top: 1rem; color: var(--color-base-content); opacity: 0.6; font-size: 0.875rem;">${config.text}</p>
    </div>
  `;
  
  // 尽早插入到页面
  if (document.body) {
    document.body.insertBefore(loadingScreen, document.body.firstChild);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.insertBefore(loadingScreen, document.body.firstChild);
    });
  }
  
  // 页面完全加载后移除
  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }, 150);
  });
})();

/**
 * 工具函数集合
 */
window.SkyUtils = {
  /**
   * 防抖函数
   * @param {Function} func 要防抖的函数
   * @param {number} wait 等待时间
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 节流函数
   * @param {Function} func 要节流的函数
   * @param {number} limit 限制时间
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * 格式化日期
   * @param {Date|string} date 日期
   * @param {string} format 格式
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  /**
   * 获取相对时间
   * @param {Date|string} date 日期
   * @returns {string} 相对时间字符串
   */
  getRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  },

  /**
   * 复制文本到剪贴板
   * @param {string} text 要复制的文本
   * @returns {Promise<boolean>} 是否复制成功
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  },

  /**
   * 平滑滚动到指定元素
   * @param {string|Element} target 目标元素或选择器
   * @param {number} offset 偏移量
   */
  scrollToElement(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * 全局事件处理器
 */
window.SkyEvents = {
  /**
   * 页面加载完成事件
   */
  onPageLoad() {
    
    // 初始化懒加载图片
    this.initLazyImages();
    
    // 初始化外部链接
    this.initExternalLinks();
  },

  /**
   * 初始化懒加载图片
   */
  initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // 降级方案
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  },

  /**
   * 初始化外部链接
   */
  initExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
      if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }
};

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  window.SkyEvents.onPageLoad();
});

