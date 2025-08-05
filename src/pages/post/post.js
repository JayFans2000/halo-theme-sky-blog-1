/**
 * Sky Theme - 文章页面特定脚本
 * 仅在文章页面加载的JavaScript功能
 */

// 导入文章页特定样式
import './post.css';

/**
 * 文章页面控制器
 */
function createPostController() {
  return {
    // 目录相关
    tocVisible: false,
    activeHeading: '',
    
    // 阅读进度
    readingProgress: 0,
    
    // 代码块相关
    codeBlocks: [],
    
    init() {
      this.initToc();
      this.initReadingProgress();
      this.initCodeBlocks();
      this.initImageZoom();
      
    },
    
    /**
     * 初始化文章目录
     */
    initToc() {
      const headings = document.querySelectorAll('.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6');
      
      if (headings.length === 0) return;
      
      // 创建目录
      this.generateToc(headings);
      
      // 监听滚动，高亮当前标题
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeHeading = entry.target.id;
            this.updateTocActive();
          }
        });
      }, {
        rootMargin: '-20% 0px -70% 0px'
      });
      
      headings.forEach(heading => {
        if (!heading.id) {
          heading.id = this.generateHeadingId(heading.textContent);
        }
        observer.observe(heading);
      });
    },
    
    /**
     * 生成目录HTML
     */
    generateToc(headings) {
      const tocContainer = document.querySelector('.post-toc');
      if (!tocContainer) return;
      
      let tocHtml = '<ul>';
      let currentLevel = 1;
      
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        const id = heading.id || this.generateHeadingId(heading.textContent);
        const text = heading.textContent;
        
        if (level > currentLevel) {
          tocHtml += '<ul>'.repeat(level - currentLevel);
        } else if (level < currentLevel) {
          tocHtml += '</ul>'.repeat(currentLevel - level);
        }
        
        tocHtml += `<li><a href="#${id}" @click="scrollToHeading('${id}')">${text}</a></li>`;
        currentLevel = level;
      });
      
      tocHtml += '</ul>';
      tocContainer.innerHTML = tocHtml;
    },
    
    /**
     * 生成标题ID
     */
    generateHeadingId(text) {
      return text.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
    },
    
    /**
     * 更新目录激活状态
     */
    updateTocActive() {
      const tocLinks = document.querySelectorAll('.post-toc a');
      tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${this.activeHeading}`) {
          link.classList.add('active');
        }
      });
    },
    
    /**
     * 滚动到指定标题
     */
    scrollToHeading(id) {
      const element = document.getElementById(id);
      if (element) {
        window.SkyUtils.scrollToElement(element, 80);
      }
    },
    
    /**
     * 初始化阅读进度
     */
    initReadingProgress() {
      const content = document.querySelector('.post-content');
      if (!content) return;
      
      const updateProgress = window.SkyUtils.throttle(() => {
        const contentRect = content.getBoundingClientRect();
        const contentHeight = content.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrolled = Math.max(0, -contentRect.top);
        const maxScroll = contentHeight - windowHeight;
        
        this.readingProgress = maxScroll > 0 ? Math.min(100, (scrolled / maxScroll) * 100) : 0;
      }, 100);
      
      window.addEventListener('scroll', updateProgress);
      updateProgress();
    },
    
    /**
     * 初始化代码块功能
     */
    initCodeBlocks() {
      const codeBlocks = document.querySelectorAll('pre code');
      
      codeBlocks.forEach((block, index) => {
        const pre = block.parentElement;
        
        // 添加复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-sm btn-ghost absolute top-2 right-2 opacity-70 hover:opacity-100';
        copyBtn.innerHTML = '复制';
        copyBtn.onclick = () => this.copyCode(block, copyBtn);
        
        pre.style.position = 'relative';
        pre.appendChild(copyBtn);
        
        // 添加语言标签
        const language = block.className.match(/language-(\w+)/);
        if (language) {
          const langLabel = document.createElement('span');
          langLabel.className = 'absolute top-2 left-2 text-xs opacity-70 bg-base-300 px-2 py-1 rounded';
          langLabel.textContent = language[1];
          pre.appendChild(langLabel);
        }
      });
    },
    
    /**
     * 复制代码
     */
    async copyCode(codeBlock, button) {
      const code = codeBlock.textContent;
      const success = await window.SkyUtils.copyToClipboard(code);
      
      if (success) {
        button.textContent = '已复制';
        button.classList.add('btn-success');
        setTimeout(() => {
          button.textContent = '复制';
          button.classList.remove('btn-success');
        }, 2000);
      } else {
        button.textContent = '复制失败';
        button.classList.add('btn-error');
        setTimeout(() => {
          button.textContent = '复制';
          button.classList.remove('btn-error');
        }, 2000);
      }
    },
    
    /**
     * 初始化图片缩放功能
     */
    initImageZoom() {
      const images = document.querySelectorAll('.post-content img');
      
      images.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = () => this.zoomImage(img);
      });
    },
    
    /**
     * 图片缩放
     */
    zoomImage(img) {
      // 创建模态框
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      modal.onclick = () => modal.remove();
      
      const zoomedImg = document.createElement('img');
      zoomedImg.src = img.src;
      zoomedImg.className = 'max-w-full max-h-full object-contain';
      zoomedImg.onclick = (e) => e.stopPropagation();
      
      modal.appendChild(zoomedImg);
      document.body.appendChild(modal);
      
      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.className = 'absolute top-4 right-4 text-white text-2xl hover:text-gray-300';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => modal.remove();
      modal.appendChild(closeBtn);
    },
    
    /**
     * 切换目录显示
     */
    toggleToc() {
      this.tocVisible = !this.tocVisible;
    }
  };
}

/**
 * 文章分享功能
 */
window.PostShare = {
  /**
   * 分享到微博
   */
  shareToWeibo() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`);
  },
  
  /**
   * 分享到QQ空间
   */
  shareToQzone() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${url}&title=${title}`);
  },
  
  /**
   * 复制链接
   */
  async copyLink() {
    const success = await window.SkyUtils.copyToClipboard(window.location.href);
    if (success) {
      // 这里可以显示提示消息
    }
  }
};

// 注册文章页面组件
document.addEventListener('alpine:init', () => {
  Alpine.data('postController', createPostController);
});

