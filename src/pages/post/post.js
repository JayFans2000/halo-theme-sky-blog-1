/**
 * Sky Theme - 文章页面特定脚本
 * 仅在文章页面加载的JavaScript功能
 */

/* global Alpine */

// 导入文章页面特定样式
import './post.css';

/**
 * 文章页 Alpine.js 组件
 * 使用 alpine:init 事件动态注册，避免加载顺序问题
 */
document.addEventListener('alpine:init', () => {
  /**
   * 文章页点赞组件
   */
  Alpine.data('postLike', () => ({
    isLiked: false,
    likeCount: 0,
    postName: '',
    
    init() {
      // 从父级 Dock 元素读取文章数据
      const dockElement = this.$el.closest('[data-post-name]');
      if (dockElement) {
        this.postName = dockElement.dataset.postName || '';
        this.likeCount = parseInt(dockElement.dataset.upvoteCount || '0');
        
        // 检查点赞状态
        this.checkLikeStatus();
      }
    },
    
    checkLikeStatus() {
      if (!this.postName) return;
      
      // 从 localStorage 读取已点赞列表
      const upvotedNames = JSON.parse(
        localStorage.getItem('halo.upvoted.post.names') || '[]'
      );
      
      // 判断当前文章是否已点赞
      this.isLiked = upvotedNames.includes(this.postName);
    },
    
    async toggleLike() {
      if (!this.postName) {
        // console.warn('文章名称未找到');
        return;
      }
      
      // 检查是否已点赞（防止重复）
      if (this.isLiked) {
        // console.log('已经点赞过了');
        return;
      }
      
      try {
        // console.log('发送点赞请求:', this.postName);
        
        // 调用 Halo 官方点赞 API
        const response = await fetch('/apis/api.halo.run/v1alpha1/trackers/upvote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            group: 'content.halo.run',
            plural: 'posts',
            name: this.postName
          })
        });
        
        // console.log('点赞响应状态:', response.status);
        
        if (response.ok) {
          // console.log('点赞成功');
          
          // 更新点赞状态
          this.isLiked = true;
          this.likeCount += 1;
          
          // 保存到 localStorage
          const upvotedNames = JSON.parse(
            localStorage.getItem('halo.upvoted.post.names') || '[]'
          );
          if (!upvotedNames.includes(this.postName)) {
            upvotedNames.push(this.postName);
            localStorage.setItem(
              'halo.upvoted.post.names', 
              JSON.stringify(upvotedNames)
            );
          }
        } else {
          const errorText = await response.text();
          // console.error('点赞失败:', response.status, errorText);
        }
      } catch (error) {
        // console.error('点赞请求错误:', error);
      }
    }
  }));
  
  /**
   * 文章页评论数量组件
   */
  Alpine.data('postComment', () => ({
    commentCount: 0,
    
    init() {
      // 从父级 Dock 元素读取评论数据
      const dockElement = this.$el.closest('[data-comment-count]');
      if (dockElement) {
        this.commentCount = parseInt(dockElement.dataset.commentCount || '0');
      }
    },
    
    toggleCommentDrawer() {
      const checkbox = document.getElementById('comment-drawer');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
      }
    }
  }));
  
  /**
   * 目录抽屉组件
   */
  Alpine.data('tocDrawer', () => ({
    isOpen: false,
    
    init() {
      // 初始化目录抽屉内容
      this.$nextTick(() => {
        this.initTocDrawerContent();
      });
    },
    
    toggleDrawer() {
      this.isOpen = !this.isOpen;
    },
    
    initTocDrawerContent() {
      const tocDrawerNav = document.getElementById('toc-drawer-nav');
      const tocNav = document.getElementById('toc-nav');
      
      if (!tocDrawerNav) return;
      
      // 如果侧边栏目录存在，复制其内容
      if (tocNav && tocNav.innerHTML.trim()) {
        tocDrawerNav.innerHTML = tocNav.innerHTML;
        this.bindTocDrawerEvents();
        return;
      }
      
      // 如果侧边栏目录不存在，自行生成
      const articleContent = document.getElementById('article-content');
      if (!articleContent) {
        tocDrawerNav.innerHTML = '<p class="text-base-content/50 text-sm">暂无目录</p>';
        return;
      }
      
      const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        tocDrawerNav.innerHTML = '<p class="text-base-content/50 text-sm">暂无目录</p>';
        return;
      }
      
      // 生成目录HTML
      this.generateTocContent(tocDrawerNav, headings);
      this.bindTocDrawerEvents();
    },
    
    generateTocContent(container, headings) {
      const headingArray = Array.from(headings);
      const levels = headingArray.map(h => parseInt(h.tagName.charAt(1)));
      const minLevel = Math.min(...levels);
      const maxDisplayLevel = minLevel + 2;
      
      const filteredHeadings = headingArray.filter(h => {
        const level = parseInt(h.tagName.charAt(1));
        return level <= maxDisplayLevel;
      });
      
      const ol = document.createElement('ol');
      ol.className = 'toc-list';
      
      filteredHeadings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
        
        const level = parseInt(heading.tagName.charAt(1));
        const relativeLevel = level - minLevel;
        
        const li = document.createElement('li');
        li.className = 'toc-item-wrapper';
        li.style.setProperty('--toc-indent-multiplier', relativeLevel.toString());
        
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();
        link.className = 'toc-link';
        link.setAttribute('data-relative-level', relativeLevel.toString());
        link.setAttribute('data-heading-id', heading.id);
        
        li.appendChild(link);
        ol.appendChild(li);
      });
      
      container.appendChild(ol);
    },
    
    bindTocDrawerEvents() {
      const tocDrawerNav = document.getElementById('toc-drawer-nav');
      if (!tocDrawerNav) return;
      
      const links = tocDrawerNav.querySelectorAll('.toc-link');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const headingId = link.getAttribute('data-heading-id') || link.getAttribute('href').slice(1);
          const heading = document.getElementById(headingId);
          if (heading) {
            const navbarHeight = 80;
            const targetPosition = heading.offsetTop - navbarHeight;
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            // 点击后关闭抽屉
            this.isOpen = false;
          }
        });
      });
    }
  }));
});

/**
 * 文章页面功能管理器
 * 使用单一作用域避免压缩时变量名冲突
 */
(function() {
    'use strict';
    


    /**
     * 文章页面管理器
     */
    const pageManager = {
        /**
         * 初始化所有功能
         */
        init() {
            this.initWordCount();
            this.initHeadingAnchors();
            this.initTOC();
            this.initReadingProgress();
            this.initCodeCopy();
            this.initScrollToTop();
        },

        /**
         * 初始化标题锚点链接
         */
        initHeadingAnchors() {
            const articleContent = document.getElementById('article-content');
            if (!articleContent) return;
            
            const headings = articleContent.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
            
            headings.forEach(heading => {
                const id = heading.getAttribute('id');
                if (!id) return;
                
                // 创建锚点链接包装器
                heading.style.position = 'relative';
                heading.style.cursor = 'pointer';
                
                // 创建锚点图标
                const anchor = document.createElement('a');
                anchor.href = `#${id}`;
                anchor.className = 'heading-anchor';
                anchor.innerHTML = '<span class="icon-[heroicons--link] w-4 h-4"></span>';
                anchor.setAttribute('aria-label', '复制链接');
                anchor.style.cssText = `
                    position: absolute;
                    left: -1.5em;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    color: var(--color-primary);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                `;
                
                // 悬停显示
                heading.addEventListener('mouseenter', () => {
                    anchor.style.opacity = '1';
                });
                
                heading.addEventListener('mouseleave', () => {
                    anchor.style.opacity = '0';
                });
                
                // 点击复制链接
                anchor.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const url = window.location.origin + window.location.pathname + `#${id}`;
                    
                    try {
                        await navigator.clipboard.writeText(url);
                        anchor.innerHTML = '<span class="icon-[heroicons--check] w-4 h-4"></span>';
                        setTimeout(() => {
                            anchor.innerHTML = '<span class="icon-[heroicons--link] w-4 h-4"></span>';
                        }, 2000);
                    } catch (err) {
                        // 复制失败静默处理
                    }
                });
                
                heading.insertBefore(anchor, heading.firstChild);
            });
        },

        /**
         * 初始化目录导航 - 动态层级识别系统
         */
        initTOC() {
            const tocNavigation = document.getElementById('toc-nav');
            const tocCard = document.getElementById('toc-card');
            if (!tocNavigation) return;

            // 只从文章正文内容区域获取标题元素
            const articleContent = document.getElementById('article-content');
            if (!articleContent) {
                if (tocCard) tocCard.style.display = 'none';
                return;
            }

            const headingElements = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
            if (headingElements.length === 0) {
                if (tocCard) tocCard.style.display = 'none';
                return;
            }

            // 动态识别层级结构 - 自动检测最高级标题
            const hierarchyInfo = this.analyzeHeadingHierarchy(headingElements);
            if (hierarchyInfo.filteredHeadings.length === 0) {
                if (tocCard) tocCard.style.display = 'none';
                return;
            }
            
            // 有目录，显示卡片
            if (tocCard) tocCard.style.display = 'block';

            // 构建动态目录树结构
            const tocTree = this.buildDynamicTocTree(hierarchyInfo.filteredHeadings, hierarchyInfo.minLevel);
            const tocList = this.createDynamicTocHTML(tocTree);

            // 清空现有内容并生成HTML结构
            tocNavigation.innerHTML = '';
            tocNavigation.appendChild(tocList);

            // 初始化滚动高亮功能
            this.initTocScrollHighlight(hierarchyInfo.filteredHeadings);
            
            // 初始化自适应布局监听
            this.initAdaptiveLayout();
        },

        /**
         * 动态分析标题层级结构
         * @param {NodeList} headingElements - 所有标题元素
         * @returns {Object} 层级分析结果
         */
        analyzeHeadingHierarchy(headingElements) {
            const headingArray = Array.from(headingElements);
            
            // 获取所有标题的级别
            const levels = headingArray.map(heading => parseInt(heading.tagName.charAt(1)));
            
            // 找到最小级别（最高级标题）
            const minLevel = Math.min(...levels);
            
            // 计算最大显示层级（最多显示3级）
            const maxDisplayLevel = minLevel + 2;
            
            // 过滤标题：只保留前3个相对层级
            const filteredHeadings = headingArray.filter(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                return level <= maxDisplayLevel;
            });

            return {
                filteredHeadings,
                minLevel,
                maxDisplayLevel,
                totalLevels: levels.length > 0 ? Math.max(...levels) - minLevel + 1 : 0
            };
        },

        /**
         * 构建动态目录树结构 - 基于相对层级
         * @param {Array} headingElements - 过滤后的标题元素列表
         * @param {number} minLevel - 最小层级（基准层级）
         * @returns {Array} 目录树数据
         */
        buildDynamicTocTree(headingElements, minLevel) {
            const tocTree = [];
            const stack = [];

            headingElements.forEach((headingElement, headingIndex) => {
                // 为标题添加ID（如果没有的话）
                if (!headingElement.id) {
                    headingElement.id = `heading-${headingIndex}`;
                }

                const absoluteLevel = parseInt(headingElement.tagName.charAt(1));
                const relativeLevel = absoluteLevel - minLevel; // 计算相对层级

                const tocItem = {
                    id: headingElement.id,
                    text: headingElement.textContent.trim(),
                    absoluteLevel: absoluteLevel,
                    relativeLevel: relativeLevel,
                    element: headingElement,
                    children: []
                };

                // 清理栈，移除比当前级别高或相等的节点
                while (stack.length > 0 && stack[stack.length - 1].relativeLevel >= relativeLevel) {
                    stack.pop();
                }

                // 添加到父节点或根节点
                if (stack.length === 0) {
                    tocTree.push(tocItem);
                } else {
                    stack[stack.length - 1].children.push(tocItem);
                }

                stack.push(tocItem);
            });

            return tocTree;
        },

        /**
         * 创建动态目录HTML结构 - 统一样式系统
         * @param {Array} tocTree - 树形结构数据
         * @returns {HTMLElement} 生成的ol元素
         */
        createDynamicTocHTML(tocTree) {
            const ol = document.createElement('ol');
            ol.className = 'toc-list';

            tocTree.forEach(item => {
                const li = document.createElement('li');
                li.className = 'toc-item-wrapper';
                
                // 设置动态缩进级别
                const indentLevel = item.relativeLevel;
                li.style.setProperty('--toc-indent-multiplier', indentLevel.toString());

                // 创建目录链接
                const linkElement = document.createElement('a');
                linkElement.href = `#${item.id}`;
                linkElement.textContent = item.text;
                linkElement.className = 'toc-link tooltip tooltip-right';
                
                // 设置相对层级属性（用于CSS样式）
                linkElement.setAttribute('data-relative-level', item.relativeLevel.toString());
                linkElement.setAttribute('data-absolute-level', item.absoluteLevel.toString());
                linkElement.setAttribute('data-heading-id', item.id);
                linkElement.setAttribute('data-tip', item.text); // DaisyUI tooltip属性

                // 添加点击事件监听器
                linkElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.smoothScrollToHeading(item.element);
                });

                li.appendChild(linkElement);

                // 递归创建子节点
                if (item.children.length > 0) {
                    const childrenOl = this.createDynamicTocHTML(item.children);
                    li.appendChild(childrenOl);
                }

                ol.appendChild(li);
            });

            return ol;
        },

        /**
         * 初始化自适应布局监听
         */
        initAdaptiveLayout() {
            const tocContainer = document.querySelector('.toc-container');
            if (!tocContainer) return;

            // 创建 ResizeObserver 监听视口变化
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(() => {
                    this.updateTocLayout();
                });
                
                resizeObserver.observe(document.documentElement);
            }

            // 监听窗口大小变化（兼容性备选方案）
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.updateTocLayout();
                }, 150);
            });

            // 初始化布局
            this.updateTocLayout();
        },

        /**
         * 更新目录布局
         */
        updateTocLayout() {
            const tocContainer = document.querySelector('.toc-container');
            if (!tocContainer) return;

            // 获取实际内容高度
            const tocNav = document.getElementById('toc-nav');
            if (!tocNav) return;
            
            const actualContentHeight = tocNav.scrollHeight;

            // 使用 CSS 的 max-height 限制，不手动设置
            // 如果内容少，容器会自动收缩
            
            // 检查是否需要滚动
            const maxHeight = parseFloat(getComputedStyle(tocContainer).maxHeight);
            const needsScroll = actualContentHeight > maxHeight;
            tocContainer.classList.toggle('has-scroll', needsScroll);
        },



        /**
         * 平滑滚动到指定标题
         * @param {HTMLElement} headingElement - 目标标题元素
         */
        smoothScrollToHeading(headingElement) {
            if (!headingElement) return;
            
            // 计算导航栏高度偏移
            const navbarHeight = 80; // 导航栏大约高度
            const targetPosition = headingElement.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        },

        /**
         * 获取文章中最小的标题层级
         * @param {NodeList} headingElements - 标题元素列表
         * @returns {number} 最小标题层级
         */
        getMinHeadingLevel(headingElements) {
            let minLevel = 6; // 初始化为最大可能值
            
            headingElements.forEach(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                if (level < minLevel) {
                    minLevel = level;
                }
            });
            
            return minLevel;
        },

        /**
         * 初始化目录滚动高亮功能
         * @param {NodeList} headingElements - 标题元素列表
         */
        initTocScrollHighlight(headingElements) {
            let isUpdating = false;

            const updateActiveSection = () => {
                const scrollPosition = window.scrollY + 120; // 考虑导航栏高度的偏移量
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                let activeIndex = -1;

                // 检查是否滚动到页面底部
                if (scrollPosition + windowHeight >= documentHeight - 50) {
                    // 如果接近页面底部，高亮最后一个标题
                    activeIndex = headingElements.length - 1;
                } else {
                    // 找到当前最接近的标题
                    headingElements.forEach((headingElement, headingIndex) => {
                        const headingTop = headingElement.offsetTop;
                        const nextHeading = headingElements[headingIndex + 1];
                        const nextHeadingTop = nextHeading ? nextHeading.offsetTop : documentHeight;

                        // 当前标题在视口范围内
                        if (headingTop <= scrollPosition && scrollPosition < nextHeadingTop) {
                            activeIndex = headingIndex;
                        }
                    });
                }

                // 更新高亮状态
                this.updateTocHighlight(activeIndex);
                isUpdating = false;
            };

            const handleScroll = () => {
                if (!isUpdating) {
                    requestAnimationFrame(updateActiveSection);
                    isUpdating = true;
                }
            };

            // 监听滚动事件
            window.addEventListener('scroll', handleScroll, { passive: true });
            
            // 初始化时执行一次
            updateActiveSection();
        },

        /**
         * 更新目录高亮状态 - 优化滚动定位算法
         * @param {number} activeIndex - 当前激活的标题索引
         */
        updateTocHighlight(activeIndex) {
            const tocLinks = document.querySelectorAll('.toc-link');
            
            tocLinks.forEach((linkElement, linkIndex) => {
                if (linkIndex === activeIndex) {
                    linkElement.classList.add('active');
                    
                    // 确保激活项在可视区域内 - 优化滚动定位算法
                    const tocContainer = document.querySelector('.toc-container');
                    if (tocContainer) {
                        // 使用更精确的位置计算方法
                        this.scrollToActiveItem(tocContainer, linkElement);
                    }
                } else {
                    linkElement.classList.remove('active');
                }
            });
        },

        /**
         * 将激活的目录项滚动到可视区域中心 - 增强版滚动算法
         * @param {HTMLElement} container - 目录容器元素
         * @param {HTMLElement} activeItem - 激活的目录项元素
         */
        scrollToActiveItem(container, activeItem) {
            
            // 计算容器的可视区域信息
            const containerTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const containerScrollHeight = container.scrollHeight;
            
            // 计算元素在容器内的相对位置
            let itemOffsetTop = 0;
            let currentElement = activeItem;
            while (currentElement && currentElement !== container) {
                itemOffsetTop += currentElement.offsetTop;
                currentElement = currentElement.offsetParent;
                if (currentElement === container) break;
            }
            
            // 如果无法通过offsetParent计算，使用getBoundingClientRect方法
            if (currentElement !== container) {
                const containerAbsoluteTop = container.getBoundingClientRect().top + window.scrollY;
                const itemAbsoluteTop = activeItem.getBoundingClientRect().top + window.scrollY;
                itemOffsetTop = itemAbsoluteTop - containerAbsoluteTop + container.scrollTop;
            }
            
            const itemHeight = activeItem.offsetHeight;
            
            // 计算可视区域范围
            const visibleTop = containerTop;
            const visibleBottom = containerTop + containerHeight;
            const itemTop = itemOffsetTop;
            const itemBottom = itemOffsetTop + itemHeight;
            
            // 增强的可见性检测 - 考虑部分可见情况
            const isFullyVisible = itemTop >= visibleTop && itemBottom <= visibleBottom;
            const isPartiallyVisible = (itemTop < visibleBottom && itemBottom > visibleTop);
            
            // 如果元素不完全可见，计算最佳滚动位置
            if (!isFullyVisible) {
                let targetScrollTop;
                
                // 边界检测和调整 - 增强版边界处理
                const maxScrollTop = Math.max(0, containerScrollHeight - containerHeight);
                const minScrollTop = 0;
                
                // 优先将元素居中显示
                const centerOffset = containerHeight / 2 - itemHeight / 2;
                targetScrollTop = itemOffsetTop - centerOffset;
                
                // 智能边界处理策略
                if (targetScrollTop < minScrollTop) {
                    // 接近顶部边界时的处理
                    if (itemOffsetTop < containerHeight / 3) {
                        // 如果元素在容器上部1/3区域，滚动到顶部
                        targetScrollTop = minScrollTop;
                    } else {
                        // 否则给元素留出一些上边距
                        targetScrollTop = Math.max(minScrollTop, itemOffsetTop - 40);
                    }
                } else if (targetScrollTop > maxScrollTop) {
                    // 接近底部边界时的处理
                    const itemDistanceFromBottom = containerScrollHeight - itemOffsetTop - itemHeight;
                    if (itemDistanceFromBottom < containerHeight / 3) {
                        // 如果元素在容器下部1/3区域，滚动到底部
                        targetScrollTop = maxScrollTop;
                    } else {
                        // 否则给元素留出一些下边距
                        targetScrollTop = Math.min(maxScrollTop, itemOffsetTop - containerHeight + itemHeight + 40);
                    }
                }
                
                // 特殊情况处理：元素完全在可视区域上方
                if (itemBottom < visibleTop) {
                    const distanceAbove = visibleTop - itemBottom;
                    if (distanceAbove > containerHeight) {
                        // 距离很远时，居中显示
                        targetScrollTop = Math.max(minScrollTop, itemOffsetTop - centerOffset);
                    } else {
                        // 距离较近时，滚动到元素顶部附近
                        targetScrollTop = Math.max(minScrollTop, itemOffsetTop - 20);
                    }
                }
                // 特殊情况处理：元素完全在可视区域下方
                else if (itemTop > visibleBottom) {
                    const distanceBelow = itemTop - visibleBottom;
                    if (distanceBelow > containerHeight) {
                        // 距离很远时，居中显示
                        targetScrollTop = Math.min(maxScrollTop, itemOffsetTop - centerOffset);
                    } else {
                        // 距离较近时，滚动到元素底部附近
                        targetScrollTop = Math.min(maxScrollTop, itemOffsetTop - containerHeight + itemHeight + 20);
                    }
                }
                
                // 防抖处理：避免频繁的小幅度滚动
                const currentScrollTop = container.scrollTop;
                const scrollDifference = Math.abs(targetScrollTop - currentScrollTop);
                
                // 只有滚动距离超过阈值时才执行滚动
                if (scrollDifference > 5) {
                    // 根据滚动距离调整滚动行为
                    const scrollBehavior = scrollDifference > containerHeight ? 'auto' : 'smooth';
                    
                    container.scrollTo({
                        top: targetScrollTop,
                        behavior: scrollBehavior
                    });
                    
                    // 调试信息（开发环境可启用）
                    // if (window.location.hostname === 'localhost') {
                    //     console.log('TOC Scroll Debug:', {
                    //         itemOffsetTop,
                    //         containerHeight,
                    //         containerScrollHeight,
                    //         targetScrollTop,
                    //         currentScrollTop,
                    //         scrollDifference,
                    //         scrollBehavior,
                    //         isFullyVisible,
                    //         isPartiallyVisible,
                    //         maxScrollTop,
                    //         minScrollTop
                    //     });
                    // }
                }
            }
        },

        /**
         * 初始化阅读进度条
         */
        initReadingProgress() {
            const progressBar = document.getElementById('reading-progress');
            if (!progressBar) return;

            let isUpdatingProgress = false;

            const updateProgress = () => {
                const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollProgress = (window.scrollY / documentHeight) * 100;
                
                progressBar.style.width = `${Math.min(scrollProgress, 100)}%`;
                isUpdatingProgress = false;
            };

            const handleProgressScroll = () => {
                if (!isUpdatingProgress) {
                    requestAnimationFrame(updateProgress);
                    isUpdatingProgress = true;
                }
            };

            window.addEventListener('scroll', handleProgressScroll, { passive: true });
        },

        /**
         * 初始化代码复制功能
         */
        initCodeCopy() {
            const codeBlocks = document.querySelectorAll('pre code');
            
            codeBlocks.forEach((codeElement) => {
                const preElement = codeElement.parentElement;
                if (!preElement) return;

                // 创建复制按钮
                const copyButton = document.createElement('button');
                copyButton.className = 'absolute top-2 right-2 px-3 py-1 bg-base-200 hover:bg-base-300 rounded text-sm transition-colors';
                copyButton.textContent = '复制';
                copyButton.setAttribute('aria-label', '复制代码');

                // 设置相对定位
                preElement.style.position = 'relative';
                preElement.appendChild(copyButton);

                // 添加复制功能
                copyButton.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(codeElement.textContent);
                        copyButton.textContent = '已复制';
                        copyButton.classList.add('bg-success', 'text-success-content');
                        
                        setTimeout(() => {
                            copyButton.textContent = '复制';
                            copyButton.classList.remove('bg-success', 'text-success-content');
                        }, 2000);
                    } catch (copyError) {
                        // console.error('复制失败:', copyError);
                        copyButton.textContent = '复制失败';
                        setTimeout(() => {
                            copyButton.textContent = '复制';
                        }, 2000);
                    }
                });
            });
        },

        /**
         * 初始化字数统计和阅读时间计算
         */
        initWordCount() {
            const articleContent = document.getElementById('article-content');
            const wordCountEl = document.getElementById('word-count');
            const readingTimeEl = document.getElementById('reading-time');
            
            if (!articleContent || !wordCountEl || !readingTimeEl) return;
            
            // 克隆内容以便处理
            const clone = articleContent.cloneNode(true);
            
            // 移除所有代码块
            const codeBlocks = clone.querySelectorAll('pre');
            codeBlocks.forEach(block => block.remove());
            
            // 获取纯文本内容
            const text = clone.textContent || clone.innerText || '';
            
            // 统计中文字符数
            const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
            const chineseCount = chineseChars.length;
            
            // 统计英文单词数
            const englishText = text.replace(/[\u4e00-\u9fa5]/g, ' ');
            const englishWords = englishText.match(/[a-zA-Z]+/g) || [];
            const englishCount = englishWords.length;
            
            // 总字数（中文字符 + 英文单词）
            const totalWords = chineseCount + englishCount;
            
            // 计算阅读时间（中文 300 字/分钟，英文 200 词/分钟）
            const readingTimeMinutes = Math.ceil(
                (chineseCount / 300) + (englishCount / 200)
            );
            
            // 更新显示
            wordCountEl.textContent = totalWords.toLocaleString();
            readingTimeEl.textContent = Math.max(1, readingTimeMinutes);
        },

        /**
         * 初始化回到顶部功能
         */
        initScrollToTop() {
            const scrollTopButton = document.getElementById('scroll-to-top');
            if (!scrollTopButton) return;

            let isCheckingScroll = false;

            const toggleButtonVisibility = () => {
                if (window.scrollY > 300) {
                    scrollTopButton.classList.remove('opacity-0', 'pointer-events-none');
                    scrollTopButton.classList.add('opacity-100');
                } else {
                    scrollTopButton.classList.add('opacity-0', 'pointer-events-none');
                    scrollTopButton.classList.remove('opacity-100');
                }
                isCheckingScroll = false;
            };

            const handleScrollCheck = () => {
                if (!isCheckingScroll) {
                    requestAnimationFrame(toggleButtonVisibility);
                    isCheckingScroll = true;
                }
            };

            window.addEventListener('scroll', handleScrollCheck, { passive: true });

            scrollTopButton.addEventListener('click', () => {
                if ('scrollBehavior' in document.documentElement.style) {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                    window.scrollTo(0, 0);
                }
            });
        }
    };

    /**
     * 文章内容图片懒加载
     * 跳过首屏前 N 张图片，后续图片添加 loading="lazy"
     */
    function setupContentLazyLoad() {
        const content = document.getElementById('article-content');
        if (!content) return;
        
        const images = content.querySelectorAll('img:not([loading])');
        const skipCount = 2; // 跳过前2张（首屏可能可见）
        
        images.forEach((img, index) => {
            if (index >= skipCount) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }

    /**
     * 页面加载完成后初始化
     */
    document.addEventListener('DOMContentLoaded', () => {
        pageManager.init();
        setupContentLazyLoad();
        initAdmonitionGlow();
    });

    /**
     * Admonition 鼠标跟随发光效果
     */
    function initAdmonitionGlow() {
        const admonitions = document.querySelectorAll('#article-content .admonition');
        
        admonitions.forEach(admonition => {
            admonition.addEventListener('mouseenter', () => {
                admonition.style.setProperty('--glow-opacity', '1');
            });
            
            admonition.addEventListener('mouseleave', () => {
                admonition.style.setProperty('--glow-opacity', '0');
            });
            
            admonition.addEventListener('mousemove', (e) => {
                const rect = admonition.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                admonition.style.setProperty('--glow-x', `${x}px`);
                admonition.style.setProperty('--glow-y', `${y}px`);
            });
        });
    }

})();