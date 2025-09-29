/**
 * Sky Theme - 文章页面特定脚本
 * 仅在文章页面加载的JavaScript功能
 */

// 文章页脚本
import './post.css';

/**
 * 文章页面功能模块
 * 使用原生JavaScript实现页面特定功能
 */
class PostPageManager {
  constructor() {
    // 目录相关
    this.tocContainer = null;
    this.tocList = null;
    this.mobileTocToggle = null;
    this.mobileTocDrawer = null;
    this.mobileTocOverlay = null;
    this.mobileTocClose = null;
    
    // 进度条
    this.progressBar = null;
    
    // 文章内容
    this.headings = [];
    this.currentActiveId = null;
    this.isScrolling = false;
    this.scrollTimeout = null;
    
    // 移动端状态
    this.isMobileTocOpen = false;
    
    this.init();
  }

  /**
   * 初始化页面功能
   */
  init() {
    this.initElements();
    this.generateTOC();
    this.initMobileTOC();
    this.initReadingProgress();
    this.initCodeCopyButtons();
    this.initLikeButton();
    this.initShareButtons();
    this.initScrollToTop();
    this.bindEvents();
    
    // 滚动时更新活跃目录项
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateActiveTOCItem();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * 初始化DOM元素引用
   */
  initElements() {
    this.tocContainer = document.querySelector('.toc-sidebar');
    this.tocList = document.querySelector('.toc-list');
    this.progressBar = document.querySelector('.reading-progress-fill');
    this.mobileTocToggle = document.querySelector('.mobile-toc-toggle');
    this.mobileTocDrawer = document.querySelector('.mobile-toc-drawer');
    this.mobileTocOverlay = document.querySelector('.mobile-toc-overlay');
    this.mobileTocClose = document.querySelector('.mobile-toc-close');
    
    // 获取文章内容区域的标题
    this.headings = Array.from(document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6'));
  }

  /**
   * 生成文章目录
   */
  generateTOC() {
    if (!this.tocList || this.headings.length === 0) {
      // 如果没有标题，隐藏目录容器
      if (this.tocContainer) {
        this.tocContainer.style.display = 'none';
      }
      if (this.mobileTocToggle) {
        this.mobileTocToggle.style.display = 'none';
      }
      return;
    }

    // 清空现有目录
    this.tocList.innerHTML = '';
    
    // 构建目录结构
    const tocStructure = this.buildTOCStructure();
    this.renderTOCStructure(tocStructure, this.tocList);
    
    // 同时为移动端目录生成内容
    this.generateMobileTOC(tocStructure);
  }
  
  /**
   * 构建目录层级结构
   * @returns {Array} 目录结构数组
   */
  buildTOCStructure() {
    const structure = [];
    const stack = [];
    
    this.headings.forEach((heading, index) => {
      // 为标题添加ID
      const id = heading.id || `heading-${index}`;
      heading.id = id;
      
      const level = parseInt(heading.tagName.charAt(1));
      const item = {
        id,
        text: heading.textContent.trim(),
        level,
        element: heading,
        children: []
      };
      
      // 找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        structure.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }
      
      stack.push(item);
    });
    
    return structure;
  }
  
  /**
   * 渲染目录结构
   * @param {Array} structure - 目录结构
   * @param {Element} container - 容器元素
   */
  renderTOCStructure(structure, container) {
    structure.forEach(item => {
      const li = document.createElement('li');
      li.className = 'toc-item';
      
      const a = document.createElement('a');
      a.href = `#${item.id}`;
      a.textContent = item.text;
      a.className = `toc-link toc-level-${item.level}`;
      a.dataset.target = item.id;
      a.dataset.level = item.level;
      
      li.appendChild(a);
      
      // 如果有子项，创建子列表
      if (item.children.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'toc-sublist';
        this.renderTOCStructure(item.children, ul);
        li.appendChild(ul);
      }
      
      container.appendChild(li);
    });
  }

  /**
   * 生成移动端目录
   * @param {Array} structure - 目录结构
   */
  generateMobileTOC(structure) {
    const mobileTocList = this.mobileTocDrawer?.querySelector('.toc-list');
    if (!mobileTocList) return;
    
    mobileTocList.innerHTML = '';
    this.renderTOCStructure(structure, mobileTocList);
  }
  
  /**
   * 初始化移动端目录功能
   */
  initMobileTOC() {
    if (!this.mobileTocToggle || !this.mobileTocDrawer || !this.mobileTocOverlay) return;
    
    // 切换按钮点击事件
    this.mobileTocToggle.addEventListener('click', () => {
      this.toggleMobileTOC();
    });
    
    // 关闭按钮点击事件
    if (this.mobileTocClose) {
      this.mobileTocClose.addEventListener('click', () => {
        this.closeMobileTOC();
      });
    }
    
    // 遮罩层点击事件
    this.mobileTocOverlay.addEventListener('click', () => {
      this.closeMobileTOC();
    });
    
    // 移动端目录项点击事件
    this.mobileTocDrawer.addEventListener('click', (e) => {
      if (e.target.classList.contains('toc-link')) {
        e.preventDefault();
        const targetId = e.target.dataset.target;
        this.scrollToHeading(targetId);
        this.closeMobileTOC();
      }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileTocOpen) {
        this.closeMobileTOC();
      }
    });
  }
  
  /**
   * 切换移动端目录显示状态
   */
  toggleMobileTOC() {
    if (this.isMobileTocOpen) {
      this.closeMobileTOC();
    } else {
      this.openMobileTOC();
    }
  }
  
  /**
   * 打开移动端目录
   */
  openMobileTOC() {
    this.isMobileTocOpen = true;
    this.mobileTocDrawer.classList.add('open');
    this.mobileTocOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * 关闭移动端目录
   */
  closeMobileTOC() {
    this.isMobileTocOpen = false;
    this.mobileTocDrawer.classList.remove('open');
    this.mobileTocOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /**
   * 初始化阅读进度条
   */
  initReadingProgress() {
    if (!this.progressBar) return;

    const updateProgress = () => {
      const article = document.querySelector('.post-content');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      // 计算阅读进度
      const startReading = articleTop - windowHeight * 0.3;
      const endReading = articleTop + articleHeight - windowHeight * 0.7;
      const totalReadingDistance = endReading - startReading;
      
      let progress = 0;
      if (scrollTop > startReading) {
        progress = Math.min(100, ((scrollTop - startReading) / totalReadingDistance) * 100);
      }
      
      this.progressBar.style.width = `${Math.max(0, progress)}%`;
    };

    // 初始更新
    updateProgress();

    // 滚动时更新（使用节流）
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    });
  }



  /**
   * 初始化代码复制按钮
   */
  initCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre[class*="language-"]');
    
    codeBlocks.forEach(block => {
      const button = document.createElement('button');
      button.className = 'code-copy-btn';
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      button.setAttribute('aria-label', '复制代码');
      button.setAttribute('title', '复制代码');
      
      button.addEventListener('click', async () => {
        const code = block.querySelector('code');
        if (!code) return;
        
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
          button.classList.add('copied');
          button.setAttribute('title', '已复制');
          
          setTimeout(() => {
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            button.classList.remove('copied');
            button.setAttribute('title', '复制代码');
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
          button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
          button.setAttribute('title', '复制失败');
          setTimeout(() => {
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>';
            button.setAttribute('title', '复制代码');
          }, 2000);
        }
      });
      
      block.style.position = 'relative';
      block.appendChild(button);
    });
  }

  /**
   * 复制代码到剪贴板
   * @param {Element} codeBlock - 代码块元素
   * @param {Element} button - 复制按钮元素
   */
  async copyCodeToClipboard(codeBlock, button) {
    const code = codeBlock.querySelector('code');
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code.textContent);
      
      // 更新按钮状态
      const originalText = button.textContent;
      button.textContent = '已复制';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
      
    } catch (err) {
      console.error('复制失败:', err);
      
      // 降级方案：使用传统方法
      this.fallbackCopyTextToClipboard(code.textContent, button);
    }
  }

  /**
   * 降级复制方案
   * @param {string} text - 要复制的文本
   * @param {Element} button - 复制按钮元素
   */
  fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      
      const originalText = button.textContent;
      button.textContent = '已复制';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
      
    } catch (err) {
      console.error('降级复制也失败了:', err);
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * 初始化点赞按钮
   */
  initLikeButton() {
    const likeBtn = document.querySelector('.like-btn');
    if (!likeBtn) return;

    // 从localStorage获取点赞状态
    const postId = this.getPostId();
    const isLiked = localStorage.getItem(`post-liked-${postId}`) === 'true';
    
    if (isLiked) {
      likeBtn.classList.add('liked');
    }

    likeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleLike(likeBtn, postId);
    });
  }

  /**
   * 切换点赞状态
   * @param {Element} button - 点赞按钮
   * @param {string} postId - 文章ID
   */
  toggleLike(button, postId) {
    const isLiked = button.classList.contains('liked');
    const countElement = button.querySelector('.like-count');
    
    if (isLiked) {
      button.classList.remove('liked');
      localStorage.removeItem(`post-liked-${postId}`);
      
      if (countElement) {
        const count = parseInt(countElement.textContent) || 0;
        countElement.textContent = Math.max(0, count - 1);
      }
    } else {
      button.classList.add('liked');
      localStorage.setItem(`post-liked-${postId}`, 'true');
      
      if (countElement) {
        const count = parseInt(countElement.textContent) || 0;
        countElement.textContent = count + 1;
      }
    }

    // 添加动画效果
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  }

  /**
   * 初始化分享功能
   */
  initShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = button.dataset.platform;
        this.shareToSocial(platform);
      });
    });
  }
  
  /**
   * 分享到社交平台
   * @param {string} platform - 平台名称
   */
  shareToSocial(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'weibo':
        shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
        break;
      case 'qq':
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`;
        break;
      case 'copy':
        this.copyToClipboard(window.location.href);
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }
  
  /**
   * 复制链接到剪贴板
   * @param {string} text - 要复制的文本
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('链接已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      this.showToast('复制失败，请手动复制');
    }
   }
   
   /**
    * 显示提示信息
    * @param {string} message - 提示信息
    */
   showToast(message) {
     // 创建toast元素
     const toast = document.createElement('div');
     toast.className = 'toast-message';
     toast.textContent = message;
     
     // 添加到页面
     document.body.appendChild(toast);
     
     // 显示动画
     setTimeout(() => {
       toast.classList.add('show');
     }, 10);
     
     // 自动隐藏
     setTimeout(() => {
       toast.classList.remove('show');
       setTimeout(() => {
         document.body.removeChild(toast);
       }, 300);
     }, 3000);
   }

  /**
   * 初始化返回顶部功能
   */
  initScrollToTop() {
    // 创建返回顶部按钮
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-to-top btn btn-circle btn-primary fixed bottom-8 right-8 z-50 opacity-0 transition-all duration-300';
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.setAttribute('aria-label', '返回顶部');
    document.body.appendChild(scrollTopBtn);

    // 滚动显示/隐藏按钮
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollTopBtn.style.opacity = '1';
        scrollTopBtn.style.pointerEvents = 'auto';
      } else {
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.pointerEvents = 'none';
      }
    });

    // 点击返回顶部
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 目录点击事件
    if (this.tocList) {
      this.tocList.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
          const targetId = e.target.dataset.target;
          this.scrollToHeading(targetId);
        }
      });
    }

    // 滚动时更新活跃目录项
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateActiveTOCItem();
          ticking = false;
        });
        ticking = true;
      }
    });

    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.updateActiveTOCItem();
      }, 250);
    });
  }

  /**
   * 滚动到指定标题
   * @param {string} headingId - 标题ID
   */
  scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (!heading) return;

    const offsetTop = heading.offsetTop - 100; // 留出导航栏空间
    
    this.isScrolling = true;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });

    // 滚动完成后重置标志
    setTimeout(() => {
      this.isScrolling = false;
    }, 1000);
  }

  /**
   * 更新活跃的目录项
   */
  updateActiveTOCItem() {
    if (this.isScrolling || !this.tocList) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    let activeId = null;
    
    // 找到当前可见的标题
    for (let i = this.headings.length - 1; i >= 0; i--) {
      const heading = this.headings[i];
      const headingTop = heading.offsetTop - 150;
      
      if (scrollTop >= headingTop) {
        activeId = heading.id;
        break;
      }
    }

    // 更新活跃状态
    if (activeId !== this.currentActiveId) {
      // 移除之前的活跃状态
      const prevActive = this.tocList.querySelector('.active');
      if (prevActive) {
        prevActive.classList.remove('active');
      }

      // 添加新的活跃状态
      if (activeId) {
        const newActive = this.tocList.querySelector(`[data-target="${activeId}"]`);
        if (newActive) {
          newActive.classList.add('active');
        }
      }

      this.currentActiveId = activeId;
    }
  }

  /**
   * 获取文章ID
   * @returns {string} 文章ID
   */
  getPostId() {
    // 从URL或页面元素获取文章ID
    const postIdElement = document.querySelector('[data-post-id]');
    if (postIdElement) {
      return postIdElement.dataset.postId;
    }
    
    // 从URL路径获取
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1] || 'unknown';
  }


}

/**
 * 图片懒加载功能
 */
class PostLazyImageLoader {
  constructor() {
    this.images = [];
    this.observer = null;
    this.init();
  }

  /**
   * 初始化懒加载
   */
  init() {
    this.images = Array.from(document.querySelectorAll('img[data-src]'));
    
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      this.images.forEach(img => {
        this.observer.observe(img);
      });
    } else {
      // 降级方案：直接加载所有图片
      this.images.forEach(img => {
        this.loadImage(img);
      });
    }
  }

  /**
   * 加载图片
   * @param {Element} img - 图片元素
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    img.src = src;
    img.classList.add('loaded');
    
    if (this.observer) {
      this.observer.unobserve(img);
    }
  }
}

/**
 * 相关文章推荐功能
 */
class PostRelatedPostsManager {
  constructor() {
    this.container = null;
    this.currentPostId = null;
    this.currentTags = [];
    this.currentCategory = null;
    this.relatedPosts = [];
    
    this.init();
  }

  /**
   * 初始化相关文章推荐
   */
  init() {
    this.container = document.querySelector('.related-posts');
    if (!this.container) return;

    this.extractCurrentPostInfo();
    this.loadRelatedPosts();
  }

  /**
   * 提取当前文章信息
   */
  extractCurrentPostInfo() {
    // 获取文章ID
    const postIdElement = document.querySelector('[data-post-id]');
    this.currentPostId = postIdElement ? postIdElement.dataset.postId : null;

    // 获取文章标签
    const tagElements = document.querySelectorAll('.post-tags .tag');
    this.currentTags = Array.from(tagElements).map(tag => tag.textContent.trim());

    // 获取文章分类
    const categoryElement = document.querySelector('.post-category');
    this.currentCategory = categoryElement ? categoryElement.textContent.trim() : null;
  }

  /**
   * 加载相关文章
   */
  async loadRelatedPosts() {
    try {
      // 这里应该调用实际的API获取相关文章
      // 目前使用模拟数据
      this.relatedPosts = this.generateMockRelatedPosts();
      this.renderRelatedPosts();
    } catch (error) {
      console.error('加载相关文章失败:', error);
      this.showErrorMessage();
    }
  }

  /**
   * 生成模拟相关文章数据
   * @returns {Array} 相关文章列表
   */
  generateMockRelatedPosts() {
    return [
      {
        id: 'post-1',
        title: 'Vue 3 Composition API 深度解析',
        excerpt: '深入了解 Vue 3 的 Composition API，掌握现代 Vue 开发的核心概念和最佳实践。',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Vue.js%20logo%20with%20modern%20code%20editor%20interface%20clean%20tech%20style&image_size=landscape_4_3',
        category: '前端开发',
        tags: ['Vue.js', 'JavaScript', 'Web开发'],
        publishDate: '2024-01-15',
        readTime: '8 分钟',
        views: 1250
      },
      {
        id: 'post-2',
        title: 'TypeScript 高级类型系统实战',
        excerpt: '探索 TypeScript 的高级类型特性，提升代码质量和开发效率的实用技巧。',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=TypeScript%20logo%20with%20code%20syntax%20highlighting%20professional%20developer%20workspace&image_size=landscape_4_3',
        category: '编程语言',
        tags: ['TypeScript', 'JavaScript', '类型系统'],
        publishDate: '2024-01-12',
        readTime: '12 分钟',
        views: 980
      },
      {
        id: 'post-3',
        title: '现代 CSS 布局技术全解',
        excerpt: 'Grid、Flexbox、Container Queries 等现代 CSS 布局技术的完整指南。',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=CSS%20grid%20flexbox%20layout%20design%20colorful%20geometric%20patterns%20modern%20web%20design&image_size=landscape_4_3',
        category: '前端开发',
        tags: ['CSS', 'Web设计', '响应式'],
        publishDate: '2024-01-10',
        readTime: '15 分钟',
        views: 1580
      }
    ];
  }

  /**
   * 渲染相关文章
   */
  renderRelatedPosts() {
    const postsGrid = this.container.querySelector('.related-posts-grid');
    if (!postsGrid) return;

    postsGrid.innerHTML = '';

    this.relatedPosts.forEach(post => {
      const postElement = this.createPostElement(post);
      postsGrid.appendChild(postElement);
    });

    // 添加加载完成的动画
    this.animatePostsAppearance();
  }

  /**
   * 创建文章元素
   * @param {Object} post - 文章数据
   * @returns {Element} 文章DOM元素
   */
  createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'related-post-card group cursor-pointer';
    article.dataset.postId = post.id;

    article.innerHTML = `
      <div class="related-post-thumbnail">
        <img 
          src="${post.thumbnail}" 
          alt="${post.title}"
          class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div class="related-post-overlay">
          <span class="category-badge">${post.category}</span>
        </div>
      </div>
      
      <div class="related-post-content">
        <h3 class="related-post-title">${post.title}</h3>
        <p class="related-post-excerpt">${post.excerpt}</p>
        
        <div class="related-post-tags">
          ${post.tags.map(tag => `<span class="tag tag-sm">${tag}</span>`).join('')}
        </div>
        
        <div class="related-post-meta">
          <div class="meta-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>${this.formatDate(post.publishDate)}</span>
          </div>
          
          <div class="meta-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${post.readTime}</span>
          </div>
          
          <div class="meta-item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span>${post.views}</span>
          </div>
        </div>
      </div>
    `;

    // 绑定点击事件
    article.addEventListener('click', () => {
      this.navigateToPost(post);
    });

    return article;
  }

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @returns {string} 格式化后的日期
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 周前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  /**
   * 导航到文章页面
   * @param {Object} post - 文章数据
   */
  navigateToPost(post) {
    // 添加点击动画
    const card = document.querySelector(`[data-post-id="${post.id}"]`);
    if (card) {
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    }

    // 模拟导航（实际应该使用路由）
    setTimeout(() => {
      window.location.href = `/posts/${post.id}`;
    }, 200);
  }

  /**
   * 动画显示文章卡片
   */
  animatePostsAppearance() {
    const cards = this.container.querySelectorAll('.related-post-card');
    
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  /**
   * 显示错误消息
   */
  showErrorMessage() {
    const postsGrid = this.container.querySelector('.related-posts-grid');
    if (!postsGrid) return;

    postsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-base-content/60 mb-4">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-lg font-medium">暂时无法加载相关文章</p>
          <p class="text-sm mt-2">请稍后再试</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="location.reload()">
          重新加载
        </button>
      </div>
    `;
  }
}

/**
 * 评论系统管理器
 */
class PostCommentsManager {
  constructor() {
    this.container = null;
    this.commentForm = null;
    this.commentsList = null;
    this.comments = [];
    this.replyingTo = null;
    
    this.init();
  }

  /**
   * 初始化评论系统
   */
  init() {
    this.container = document.querySelector('.comments-section');
    if (!this.container) return;

    this.commentForm = this.container.querySelector('.comment-form');
    this.commentsList = this.container.querySelector('.comments-list');
    
    this.bindEvents();
    this.loadComments();
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    if (this.commentForm) {
      this.commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCommentSubmit(e);
      });

      // 字符计数
      const textarea = this.commentForm.querySelector('textarea[name="content"]');
      if (textarea) {
        textarea.addEventListener('input', () => {
          this.updateCharacterCount(textarea);
        });
      }
    }
  }

  /**
   * 加载评论列表
   */
  async loadComments() {
    try {
      // 这里应该调用实际的API获取评论
      // 目前使用模拟数据
      this.comments = this.generateMockComments();
      this.renderComments();
    } catch (error) {
      console.error('加载评论失败:', error);
      this.showErrorMessage();
    }
  }

  /**
   * 生成模拟评论数据
   * @returns {Array} 评论列表
   */
  generateMockComments() {
    return [
      {
        id: 'comment-1',
        author: {
          name: '张三',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20developer%20avatar%20friendly%20smile%20portrait&image_size=square',
          website: 'https://zhangsan.dev',
          isAuthor: false
        },
        content: '这篇文章写得非常好！特别是关于 TypeScript 高级类型的部分，让我学到了很多新知识。希望能看到更多这样的深度技术文章。',
        publishTime: '2024-01-15T10:30:00Z',
        likes: 12,
        isLiked: false,
        replies: [
          {
            id: 'reply-1',
            author: {
              name: '博主',
              avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=blog%20author%20professional%20headshot%20confident%20smile&image_size=square',
              website: null,
              isAuthor: true
            },
            content: '感谢你的支持！我会继续分享更多实用的技术内容。',
            publishTime: '2024-01-15T11:15:00Z',
            likes: 3,
            isLiked: false,
            replyTo: 'comment-1'
          }
        ]
      },
      {
        id: 'comment-2',
        author: {
          name: '李四',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=female%20developer%20avatar%20professional%20portrait%20glasses&image_size=square',
          website: null,
          isAuthor: false
        },
        content: '代码示例很清晰，但是我在实际项目中遇到了一些兼容性问题，能否分享一下解决方案？',
        publishTime: '2024-01-15T14:20:00Z',
        likes: 5,
        isLiked: true,
        replies: []
      }
    ];
  }

  /**
   * 渲染评论列表
   */
  renderComments() {
    if (!this.commentsList) return;

    this.commentsList.innerHTML = '';

    if (this.comments.length === 0) {
      this.showEmptyState();
      return;
    }

    this.comments.forEach(comment => {
      const commentElement = this.createCommentElement(comment);
      this.commentsList.appendChild(commentElement);
    });

    // 更新评论统计
    this.updateCommentsCount();
  }

  /**
   * 创建评论元素
   * @param {Object} comment - 评论数据
   * @returns {Element} 评论DOM元素
   */
  createCommentElement(comment) {
    const article = document.createElement('article');
    article.className = 'comment-item';
    article.dataset.commentId = comment.id;

    article.innerHTML = `
      <div class="comment-avatar">
        <img src="${comment.author.avatar}" alt="${comment.author.name}" class="avatar" />
      </div>
      
      <div class="comment-content">
        <div class="comment-header">
          <div class="comment-author">
            ${comment.author.website ? 
              `<a href="${comment.author.website}" target="_blank" rel="noopener" class="author-name">${comment.author.name}</a>` :
              `<span class="author-name">${comment.author.name}</span>`
            }
            ${comment.author.isAuthor ? '<span class="author-badge">作者</span>' : ''}
          </div>
          
          <div class="comment-meta">
            <time class="comment-time" datetime="${comment.publishTime}">
              ${this.formatTime(comment.publishTime)}
            </time>
          </div>
        </div>
        
        <div class="comment-body">
          <p>${comment.content}</p>
        </div>
        
        <div class="comment-actions">
          <button class="action-btn like-btn ${comment.isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
            <svg class="w-4 h-4" fill="${comment.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            <span class="like-count">${comment.likes}</span>
          </button>
          
          <button class="action-btn reply-btn" data-comment-id="${comment.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
            </svg>
            回复
          </button>
        </div>
        
        ${comment.replies && comment.replies.length > 0 ? this.createRepliesHTML(comment.replies) : ''}
      </div>
    `;

    // 绑定评论操作事件
    this.bindCommentEvents(article);

    return article;
  }

  /**
   * 创建回复HTML
   * @param {Array} replies - 回复列表
   * @returns {string} 回复HTML字符串
   */
  createRepliesHTML(replies) {
    const repliesHTML = replies.map(reply => `
      <article class="reply-item" data-reply-id="${reply.id}">
        <div class="comment-avatar">
          <img src="${reply.author.avatar}" alt="${reply.author.name}" class="avatar" />
        </div>
        
        <div class="comment-content">
          <div class="comment-header">
            <div class="comment-author">
              ${reply.author.website ? 
                `<a href="${reply.author.website}" target="_blank" rel="noopener" class="author-name">${reply.author.name}</a>` :
                `<span class="author-name">${reply.author.name}</span>`
              }
              ${reply.author.isAuthor ? '<span class="author-badge">作者</span>' : ''}
            </div>
            
            <div class="comment-meta">
              <time class="comment-time" datetime="${reply.publishTime}">
                ${this.formatTime(reply.publishTime)}
              </time>
            </div>
          </div>
          
          <div class="comment-body">
            <p>${reply.content}</p>
          </div>
          
          <div class="comment-actions">
            <button class="action-btn like-btn ${reply.isLiked ? 'liked' : ''}" data-reply-id="${reply.id}">
              <svg class="w-4 h-4" fill="${reply.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <span class="like-count">${reply.likes}</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    return `<div class="replies-list">${repliesHTML}</div>`;
  }

  /**
   * 绑定评论操作事件
   * @param {Element} commentElement - 评论元素
   */
  bindCommentEvents(commentElement) {
    // 点赞按钮
    const likeBtn = commentElement.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        this.handleLike(e.target.closest('.like-btn'));
      });
    }

    // 回复按钮
    const replyBtn = commentElement.querySelector('.reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', (e) => {
        this.handleReply(e.target.closest('.reply-btn'));
      });
    }
  }

  /**
   * 处理评论提交
   * @param {Event} event - 提交事件
   */
  async handleCommentSubmit(event) {
    const formData = new FormData(event.target);
    const commentData = {
      author: formData.get('author'),
      email: formData.get('email'),
      website: formData.get('website'),
      content: formData.get('content'),
      replyTo: this.replyingTo
    };

    // 验证表单数据
    if (!this.validateCommentData(commentData)) {
      return;
    }

    try {
      // 显示提交状态
      this.showSubmittingState();

      // 这里应该调用实际的API提交评论
      await this.submitComment(commentData);

      // 重置表单
      this.resetCommentForm();
      
      // 重新加载评论
      await this.loadComments();
      
      // 显示成功消息
      this.showSuccessMessage('评论提交成功！');
    } catch (error) {
      console.error('提交评论失败:', error);
      this.showErrorMessage('评论提交失败，请稍后再试');
    } finally {
      this.hideSubmittingState();
    }
  }

  /**
   * 验证评论数据
   * @param {Object} data - 评论数据
   * @returns {boolean} 验证结果
   */
  validateCommentData(data) {
    if (!data.author || data.author.trim().length === 0) {
      this.showValidationError('请输入您的姓名');
      return false;
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      this.showValidationError('请输入有效的邮箱地址');
      return false;
    }

    if (!data.content || data.content.trim().length === 0) {
      this.showValidationError('请输入评论内容');
      return false;
    }

    if (data.content.length > 1000) {
      this.showValidationError('评论内容不能超过1000个字符');
      return false;
    }

    return true;
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 验证结果
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 处理点赞操作
   * @param {Element} likeBtn - 点赞按钮
   */
  async handleLike(likeBtn) {
    const commentId = likeBtn.dataset.commentId || likeBtn.dataset.replyId;
    const isLiked = likeBtn.classList.contains('liked');
    const likeCountSpan = likeBtn.querySelector('.like-count');
    const currentCount = parseInt(likeCountSpan.textContent);

    try {
      // 更新UI状态
      likeBtn.classList.toggle('liked');
      likeCountSpan.textContent = isLiked ? currentCount - 1 : currentCount + 1;

      // 这里应该调用实际的API更新点赞状态
      await this.toggleLike(commentId, !isLiked);
    } catch (error) {
      // 回滚UI状态
      likeBtn.classList.toggle('liked');
      likeCountSpan.textContent = currentCount;
      console.error('点赞操作失败:', error);
    }
  }

  /**
   * 处理回复操作
   * @param {Element} replyBtn - 回复按钮
   */
  handleReply(replyBtn) {
    const commentId = replyBtn.dataset.commentId;
    this.replyingTo = commentId;

    // 滚动到评论表单
    this.commentForm.scrollIntoView({ behavior: 'smooth' });
    
    // 聚焦到内容输入框
    const textarea = this.commentForm.querySelector('textarea[name="content"]');
    if (textarea) {
      textarea.focus();
    }

    // 显示回复提示
    this.showReplyIndicator(commentId);
  }

  /**
   * 显示回复指示器
   * @param {string} commentId - 评论ID
   */
  showReplyIndicator(commentId) {
    // 移除现有的回复指示器
    const existingIndicator = this.commentForm.querySelector('.reply-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // 创建新的回复指示器
    const indicator = document.createElement('div');
    indicator.className = 'reply-indicator';
    indicator.innerHTML = `
      <span>正在回复评论 #${commentId}</span>
      <button type="button" class="cancel-reply-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;

    // 绑定取消回复事件
    indicator.querySelector('.cancel-reply-btn').addEventListener('click', () => {
      this.cancelReply();
    });

    // 插入到表单前面
    this.commentForm.insertBefore(indicator, this.commentForm.firstChild);
  }

  /**
   * 取消回复
   */
  cancelReply() {
    this.replyingTo = null;
    const indicator = this.commentForm.querySelector('.reply-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * 更新字符计数
   * @param {Element} textarea - 文本域元素
   */
  updateCharacterCount(textarea) {
    const maxLength = 1000;
    const currentLength = textarea.value.length;
    const counter = this.commentForm.querySelector('.char-counter');
    
    if (counter) {
      counter.textContent = `${currentLength}/${maxLength}`;
      counter.classList.toggle('text-error', currentLength > maxLength);
    }
  }

  /**
   * 格式化时间
   * @param {string} timeString - 时间字符串
   * @returns {string} 格式化后的时间
   */
  formatTime(timeString) {
    const date = new Date(timeString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  /**
   * 更新评论统计
   */
  updateCommentsCount() {
    const totalComments = this.comments.reduce((count, comment) => {
      return count + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);

    const countElement = document.querySelector('.comments-count');
    if (countElement) {
      countElement.textContent = totalComments;
    }
  }

  /**
   * 显示空状态
   */
  showEmptyState() {
    this.commentsList.innerHTML = `
      <div class="comments-empty">
        <svg class="w-16 h-16 mx-auto mb-4 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p class="text-base-content/60 text-center">还没有评论，来发表第一个评论吧！</p>
      </div>
    `;
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  showErrorMessage(message = '加载评论失败') {
    // 实现错误消息显示逻辑
    console.error(message);
  }

  /**
   * 显示成功消息
   * @param {string} message - 成功消息
   */
  showSuccessMessage(message) {
    // 实现成功消息显示逻辑
    console.log(message);
  }

  /**
   * 显示验证错误
   * @param {string} message - 验证错误消息
   */
  showValidationError(message) {
    // 实现验证错误显示逻辑
    alert(message); // 临时实现，实际应该使用更好的UI
  }

  /**
   * 显示提交状态
   */
  showSubmittingState() {
    const submitBtn = this.commentForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';
    }
  }

  /**
   * 隐藏提交状态
   */
  hideSubmittingState() {
    const submitBtn = this.commentForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '发表评论';
    }
  }

  /**
   * 重置评论表单
   */
  resetCommentForm() {
    this.commentForm.reset();
    this.cancelReply();
    
    // 重置字符计数
    const counter = this.commentForm.querySelector('.char-counter');
    if (counter) {
      counter.textContent = '0/1000';
      counter.classList.remove('text-error');
    }
  }

  /**
   * 提交评论（模拟API调用）
   * @param {Object} commentData - 评论数据
   * @returns {Promise} 提交结果
   */
  async submitComment(commentData) {
    // 模拟API调用延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('提交评论:', commentData);
        resolve({ success: true });
      }, 1000);
    });
  }

  /**
   * 切换点赞状态（模拟API调用）
   * @param {string} commentId - 评论ID
   * @param {boolean} isLiked - 点赞状态
   * @returns {Promise} 操作结果
   */
  async toggleLike(commentId, isLiked) {
    // 模拟API调用延迟
    console.log(`切换评论 ${commentId} 的点赞状态为: ${isLiked}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`${isLiked ? '点赞' : '取消点赞'} 评论:`, commentId);
        resolve({ success: true });
      }, 300);
    });
  }
}

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', () => {
  // 初始化文章页面管理器
  new PostPageManager();
  
  // 初始化图片懒加载
  new PostLazyImageLoader();
  
  // 初始化相关文章推荐
  new PostRelatedPostsManager();
  
  // 初始化评论系统
  new PostCommentsManager();
  
  console.log('文章页面初始化完成');
});

// 导出供其他模块使用
window.PostPageManager = PostPageManager;
window.PostLazyImageLoader = PostLazyImageLoader;
window.PostRelatedPostsManager = PostRelatedPostsManager;
window.PostCommentsManager = PostCommentsManager;
