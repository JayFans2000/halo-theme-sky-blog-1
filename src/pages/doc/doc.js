/**
 * 文档页脚本
 * 功能: 目录生成、版本选择器、图片懒加载
 */

import './doc.css';

// 导入公共文章内容脚本
import '../../static/js/article-content.js';

/**
 * 图片懒加载由 article-content.js 统一处理
 * 这里不再重复实现
 */

/**
 * 构建动态目录树结构 - 基于相对层级
 * @param {Array} headingElements - 过滤后的标题元素列表
 * @param {number} minLevel - 最小层级（基准层级）
 * @returns {Array} 目录树数据
 */
function buildDynamicTocTree(headingElements, minLevel) {
  const tocTree = [];
  const stack = [];

  headingElements.forEach((headingElement, headingIndex) => {
    // 为标题添加ID（如果没有的话）
    if (!headingElement.id) {
      headingElement.id = `heading-${headingIndex}`;
    }

    const absoluteLevel = parseInt(headingElement.tagName.charAt(1));
    const relativeLevel = absoluteLevel - minLevel;

    const tocItem = {
      id: headingElement.id,
      text: headingElement.textContent.trim(),
      absoluteLevel: absoluteLevel,
      relativeLevel: relativeLevel,
      element: headingElement,
      children: [],
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
}

/**
 * 递归创建动态目录HTML结构 - 树形嵌套
 * @param {Array} tocTree - 树形结构数据
 * @returns {HTMLElement} 生成的ol元素
 */
function createDynamicTocHTML(tocTree) {
  const ol = document.createElement('ol');
  ol.className = 'toc-list';

  tocTree.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'toc-item-wrapper';

    // 创建目录链接
    const linkElement = document.createElement('a');
    linkElement.href = `#${item.id}`;
    linkElement.textContent = item.text;
    linkElement.className = 'toc-link';

    // 设置相对层级属性（用于CSS样式）
    linkElement.setAttribute('data-relative-level', item.relativeLevel.toString());
    linkElement.setAttribute('data-heading-id', item.id);

    li.appendChild(linkElement);

    // 递归创建子节点
    if (item.children.length > 0) {
      const childrenOl = createDynamicTocHTML(item.children);
      li.appendChild(childrenOl);
    }

    ol.appendChild(li);
  });

  return ol;
}

// 目录生成 (使用 Intersection Observer 优化)
function initTOC() {
  const tocNav = document.getElementById('toc-nav');
  const tocCard = document.getElementById('toc-card');
  const content = document.getElementById('article-content');

  if (!tocNav || !content) return;

  const allHeadings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (!allHeadings.length) {
    if (tocCard) tocCard.style.display = 'none';
    return;
  }

  const levels = Array.from(allHeadings, (h) => +h.tagName[1]);
  const minLevel = Math.min(...levels);
  const headings = Array.from(allHeadings).filter(
    (h) => +h.tagName[1] <= minLevel + 2
  );

  if (!headings.length) {
    if (tocCard) tocCard.style.display = 'none';
    return;
  }

  // 构建树形目录结构
  const tocTree = buildDynamicTocTree(headings, minLevel);
  const tocList = createDynamicTocHTML(tocTree);

  // 清空现有内容并生成HTML结构
  tocNav.innerHTML = '';
  tocNav.appendChild(tocList);

  // 平滑滚动（事件委托）
  tocNav.addEventListener('click', (e) => {
    const link = e.target.closest('.toc-link');
    if (!link) return;
    e.preventDefault();
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  });

  // 滚动高亮 (Intersection Observer)
  const links = tocNav.querySelectorAll('.toc-link');
  let currentActive = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const headingId = entry.target.id;
          const activeLink = tocNav.querySelector(`.toc-link[data-heading-id="${headingId}"]`);
          if (activeLink && activeLink !== currentActive) {
            links.forEach((l) => l.classList.remove('active'));
            activeLink.classList.add('active');
            currentActive = activeLink;
          }
        }
      });
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  );

  headings.forEach((h) => observer.observe(h));
}

// 版本选择器
function initDropdowns() {
  document.addEventListener(
    'click',
    (e) => {
      document.querySelectorAll('.doc-version-dropdown.show').forEach((d) => {
        if (!d.closest('.doc-version-selector')?.contains(e.target)) {
          d.classList.remove('show');
        }
      });
    },
    { passive: true }
  );
}

// 侧边栏与 Footer 碰撞检测
function initSidebarFooterCollision() {
  const sidebar = document.querySelector('.doc-sidebar');
  const toc = document.querySelector('.doc-toc');
  const footer = document.querySelector('footer');
  const docLayout = document.querySelector('.doc-layout');

  if (!footer || (!sidebar && !toc)) return;

  // 获取导航栏高度，默认为 64
  let navHeight = 64;
  if (docLayout) {
    const val = getComputedStyle(docLayout).getPropertyValue('--doc-nav-height');
    if (val) navHeight = parseInt(val);
  } else {
    // 尝试从 root 获取或直接使用默认
    const val = getComputedStyle(document.documentElement).getPropertyValue('--doc-nav-height');
    if (val) navHeight = parseInt(val);
  }

  const offset = navHeight + 16; // nav + 1rem

  function updateSidebarPositions() {
    // 使用 document.documentElement.clientHeight 兼容性更好
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const footerRect = footer.getBoundingClientRect();

    // 计算 footer 顶部距离视口顶部的距离
    // 如果 footerRect.top < viewportHeight，说明 footer 已经进入视口（或在视口上方）

    [sidebar, toc].forEach((el) => {
      if (!el) return;

      const elHeight = el.offsetHeight;
      // 计算停止位置：Footer 顶部 - 1rem - 元素高度
      // 这是元素 top 允许的最大值（相对于视口）
      // footerRect.top 是 footer 顶部相对于视口的 Y 坐标
      const stopPositionTop = footerRect.top - 16 - elHeight;

      // 如果计算出的位置小于默认 offset（顶部固定位置），说明 footer 顶到了侧边栏
      if (stopPositionTop < offset) {
        el.style.top = `${stopPositionTop}px`;
      } else {
        // 否则保持在顶部固定位置
        if (el.style.top !== `${offset}px`) {
          el.style.top = `${offset}px`;
        }
      }
    });
  }

  // 使用 passive 事件和 requestAnimationFrame 优化性能
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateSidebarPositions();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // 初始化及窗口大小改变时更新
  updateSidebarPositions();
  window.addEventListener('resize', updateSidebarPositions);
}

// 初始化抽屉
function initDrawers() {
  // 目录抽屉
  const tocOverlay = document.getElementById('doc-toc-overlay');
  const tocDrawer = document.getElementById('doc-toc-drawer');
  const tocDrawerNav = document.getElementById('doc-toc-drawer-nav');

  if (tocOverlay && tocDrawer) {
    window.openDocTocDrawer = () => {
      tocOverlay.classList.add('open');
      tocDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
      
      // 初始化目录内容
      if (tocDrawerNav && !tocDrawerNav.querySelector('.toc-list')) {
        const tocNav = document.getElementById('toc-nav');
        if (tocNav && tocNav.innerHTML.trim()) {
          tocDrawerNav.innerHTML = tocNav.innerHTML;
          bindTocDrawerEvents(tocDrawerNav);
        }
      }
    };

    window.closeDocTocDrawer = () => {
      tocOverlay.classList.remove('open');
      tocDrawer.classList.remove('open');
      document.body.style.overflow = '';
    };
  }

  // 侧边栏抽屉
  const sidebarOverlay = document.getElementById('doc-sidebar-overlay');
  const sidebarDrawer = document.getElementById('doc-sidebar-drawer');

  if (sidebarOverlay && sidebarDrawer) {
    window.openDocSidebarDrawer = () => {
      sidebarOverlay.classList.add('open');
      sidebarDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    window.closeDocSidebarDrawer = () => {
      sidebarOverlay.classList.remove('open');
      sidebarDrawer.classList.remove('open');
      document.body.style.overflow = '';
    };
  }

  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (tocDrawer?.classList.contains('open')) window.closeDocTocDrawer();
      if (sidebarDrawer?.classList.contains('open')) window.closeDocSidebarDrawer();
    }
  });
}

function bindTocDrawerEvents(container) {
  const links = container.querySelectorAll('.toc-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const headingId = link.getAttribute('data-heading-id') || link.getAttribute('href').slice(1);
      const heading = document.getElementById(headingId);
      if (heading) {
        window.closeDocTocDrawer();
        setTimeout(() => {
          window.scrollTo({
            top: heading.offsetTop - 80,
            behavior: 'smooth'
          });
        }, 100);
      }
    });
  });
}

// 初始化
function init() {
  // initLazyLoad(); - 已由 article-content.js 统一处理
  initTOC();
  initDropdowns();
  initSidebarFooterCollision();
  initDrawers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
