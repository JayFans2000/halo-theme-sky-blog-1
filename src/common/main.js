/**
 * Sky Theme - 主要 JavaScript 入口文件
 * 简化版本，只包含基础功能
 */

// 导入基础样式文件
import './css/tailwind.css';
import './css/nav-enhancements.css';
import './css/base.css';
import './css/floating-dock.css';

// 导入基础脚本
import './js/base.js';

// 导入 Alpine.js 公共模块
import { initializeAll } from './js/alpine-modules.js';

// 导入 Alpine.js
import Alpine from 'alpinejs';

// 将 Alpine 挂载到全局对象
window.Alpine = Alpine;

/**
 * 应用程序初始化
 * 在 Alpine.js 启动前初始化基础组件
 */
document.addEventListener('alpine:init', () => {
  // 初始化基础组件
  initializeAll();
  
});

// 启动 Alpine.js
Alpine.start();
