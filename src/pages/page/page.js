/**
 * 单页面脚本
 * 模板位置：templates/page.html
 */

// 导入页面样式（已包含 article-content.css）
import './page.css';

// 导入公共文章内容脚本
import '../../static/js/article-content.js';

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  initPageContent();
});

/**
 * 初始化页面内容
 * 注意：现在使用 article-content ID 以便复用公共样式和脚本
 * 实际的内容处理由 article-content.js 统一处理
 */
function initPageContent() {
  // article-content.js 已经处理了所有内容初始化
  // 这里可以添加 page 页面特有的逻辑（如果需要）
  console.log('Page content initialized');
}
