/**
 * Sky Theme Components - JavaScript 组件模块
 * 只包含模板中实际使用的功能
 */

/* global Alpine */

/**
 * 悬浮 Dock 控制器
 * 模板使用：templates/modules/floating-dock.html, templates/modules/post/floating-dock.html
 */
function createFloatingDock() {
  return {
    isVisible: true,
    isCommentDrawerOpen: false,
    scrollTimeout: null,
    scrollPercent: 0,
    
    init() {
      this.updateVisibility();
      
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateVisibility();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },
    
    updateVisibility() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // 只在页面最顶部（< 50px）时隐藏
      this.isVisible = scrollTop >= 50;
      this.scrollPercent = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    },
    
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    
    // 文章页专用方法
    openShareModal() {
      const modal = document.getElementById('share_modal');
      if (modal) {
        modal.showModal();
      }
    },
    
    toggleCommentDrawer() {
      this.isCommentDrawerOpen = !this.isCommentDrawerOpen;
      const checkbox = document.getElementById('comment-drawer');
      if (checkbox) {
        checkbox.checked = this.isCommentDrawerOpen;
      }
    }
  };
}

/**
 * 分享模态框控制器
 * 模板使用：templates/modules/post/floating-dock.html
 */
function createShareModal() {
  return {
    shareUrl: '',
    shareTitle: '',
    shareTitleTemplate: '',
    copied: false,
    showQRCode: false,
    
    init() {
      this.shareUrl = window.location.href;
      const originalTitle = document.title;
      const siteName = document.querySelector('meta[property="og:site_name"]')?.content || '';
      const author = document.querySelector('meta[name="author"]')?.content || '';
      
      // 从模板的 data 属性读取分享标题模板
      this.shareTitleTemplate = this.$el.dataset.shareTitleTemplate || '';
      
      // 如果有模板，替换变量
      if (this.shareTitleTemplate) {
        this.shareTitle = this.shareTitleTemplate
          .replace(/{title}/g, originalTitle)
          .replace(/{site}/g, siteName)
          .replace(/{author}/g, author);
      } else {
        this.shareTitle = originalTitle;
      }
    },
    
    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.shareUrl);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    },
    
    shareToPlatform(element) {
      const urlTemplate = element.dataset.shareUrl;
      
      // 替换 URL 中的变量
      const shareUrl = urlTemplate
        .replace(/{url}/g, encodeURIComponent(this.shareUrl))
        .replace(/{title}/g, encodeURIComponent(this.shareTitle));
      
      // 打开分享链接
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },
    
    shareToWeChat() {
      this.showQRCode = !this.showQRCode;
      
      if (this.showQRCode) {
        // 使用简单的方式生成二维码（可以后续集成 QRCode 库）
        this.$nextTick(() => {
          const container = document.getElementById('qrcode-container');
          if (container) {
            container.innerHTML = `
              <div class="text-center p-8 bg-base-200 rounded">
                <p class="text-sm">二维码功能需要集成 QRCode 库</p>
                <p class="text-xs text-base-content/60 mt-2">URL: ${this.shareUrl}</p>
              </div>
            `;
          }
        });
      }
    }
  };
}

/**
 * 评论抽屉控制器
 * 模板使用：templates/modules/post/floating-dock.html
 */
function createCommentDrawer() {
  return {
    isOpen: false,
    
    init() {
      // 监听抽屉状态
      const checkbox = document.getElementById('comment-drawer');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.isOpen = e.target.checked;
        });
      }
      
      // 监听关闭抽屉事件
      window.addEventListener('close-comment-drawer', () => {
        this.closeDrawer();
      });
    },
    
    closeDrawer() {
      this.isOpen = false;
      const checkbox = document.getElementById('comment-drawer');
      if (checkbox) {
        checkbox.checked = false;
      }
    }
  };
}

/**
 * 首页头部控制器
 * 模板使用：templates/modules/index/header.html
 */
function createHeaderController() {
  return {
    scrollOffset: 0,
    scrolled: false,
    showMoments: true,
    showPublishModal: false,
    isTablet: false,
    
    init() {
      // 检测设备类型
      this.detectDevice();
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        this.detectDevice();
      });
      
      // 监听滚动事件，使用节流优化性能
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            this.updateScrollOffset();
            ticking = false;
          });
          ticking = true;
        }
      });
    },
    
    detectDevice() {
      this.isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    },
    
    updateScrollOffset() {
      this.scrollOffset = window.scrollY;
      
      // 更新scrolled状态，用于背景蒙版透明度控制
      this.scrolled = this.scrollOffset > 50;
      
      // 平板端优化：减少视差效果强度
      if (this.isTablet) {
        this.scrollOffset *= 0.7;
      }
    }
  };
}

/**
 * 导航栏控制器
 * 模板使用：templates/modules/nav.html
 */
function createNavbarController() {
  return {
    scrolled: false,
    
    init() {
      // 滚动监听
      window.addEventListener('scroll', () => {
        this.scrolled = window.scrollY > 20;
        // 添加/移除 scrolled 类到 navbar
        const navbar = this.$el.querySelector('.navbar');
        if (navbar) {
          if (this.scrolled) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        }
      });
    }
  };
}

/**
 * 主题切换控制器
 * 模板使用：templates/modules/nav.html
 * 统一管理整个应用的主题状态
 */
function createThemeToggle() {
  return {
    isDark: false,
    lightTheme: '',
    darkTheme: '',
    
    init() {
      // 在初始化时保存主题配置到组件实例
      this.lightTheme = this.$el.dataset.lightTheme || 'light';
      this.darkTheme = this.$el.dataset.darkTheme || 'dark';
      const defaultTheme = this.$el.dataset.defaultTheme || 'dark_theme';
      
      // 从 localStorage 读取用户偏好
      const savedTheme = localStorage.getItem('theme-mode');
      
      // 确定当前主题状态
      this.isDark = savedTheme ? (savedTheme === 'dark_theme') : (defaultTheme === 'dark_theme');
      
      // 应用主题
      const themeName = this.isDark ? this.darkTheme : this.lightTheme;
      document.documentElement.setAttribute('data-theme', themeName);
    },
    
    toggleTheme() {
      this.isDark = !this.isDark;
      const themeMode = this.isDark ? 'dark_theme' : 'light_theme';
      
      localStorage.setItem('theme-mode', themeMode);
      document.documentElement.setAttribute('data-theme', this.isDark ? this.darkTheme : this.lightTheme);
    }
  };
}



/**
 * 初始化所有组件
 * 注册模板中实际使用的 Alpine.js 组件
 */
function initializeAll() {
  // 注册模板中使用的组件
  Alpine.data('floatingDock', createFloatingDock);
  Alpine.data('shareModal', createShareModal);
  Alpine.data('commentDrawer', createCommentDrawer);
  Alpine.data('headerController', createHeaderController);
  Alpine.data('navbarController', createNavbarController);
  Alpine.data('createThemeToggle', createThemeToggle);
  
}


export {
  initializeAll,
  createFloatingDock,
  createShareModal,
  createCommentDrawer,
  createHeaderController,
  createNavbarController,
  createThemeToggle
};
