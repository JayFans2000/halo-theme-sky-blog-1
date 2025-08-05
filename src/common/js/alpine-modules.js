/**
 * Sky Theme Components - JavaScript 组件模块
 * 只包含模板中实际使用的功能
 */

/**
 * 回到顶部控制器
 * 模板使用：templates/modules/footer.html
 */
function createBackToTop() {
  return {
    isVisible: false,
    progress: 0,
    progressStroke: '0 113',
    
    init() {
      // 初始化时计算一次进度
      this.updateProgress();
      
      // 监听滚动事件
      window.addEventListener('scroll', () => {
        this.updateProgress();
      });
    },
    
    updateProgress() {
      const scrollTop = window.scrollY;
      // 按钮在滚动超过100px时显示
      this.isVisible = scrollTop > 100;
      
      // 进度环始终根据滚动位置更新
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      const circumference = 2 * Math.PI * 18; // r=18
      const strokeDasharray = circumference * progress;
      this.progressStroke = `${strokeDasharray} ${circumference}`;
    },
    
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
}

/**
 * 首页头部控制器
 * 模板使用：templates/modules/index/header.html
 */
function createHeaderController() {
  return {
    scrolled: false,
    scrollOffset: 0,
    progressStroke: '0 113',
    
    init() {
      // 滚动监听
      window.addEventListener('scroll', () => {
        this.scrollOffset = window.scrollY;
        this.scrolled = this.scrollOffset > 20;
        
        // 计算进度条
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(this.scrollOffset / maxScroll, 1);
        const circumference = 2 * Math.PI * 18; // r=18
        const strokeDasharray = circumference * progress;
        this.progressStroke = `${strokeDasharray} ${circumference}`;
      });
      
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
  Alpine.data('backToTop', createBackToTop);
  Alpine.data('headerController', createHeaderController);
  Alpine.data('navbarController', createNavbarController);
  Alpine.data('createThemeToggle', createThemeToggle);
  
}


export {
  initializeAll,
  createBackToTop,
  createHeaderController,
  createNavbarController,
  createThemeToggle
};
