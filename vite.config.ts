import { defineConfig } from "vite";
import { glob } from "glob";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";

/**
 * 复制静态资源到构建目录
 */
function copyStaticAssets() {
  const srcStaticDir = 'src/static';
  const destAssetsDir = 'templates/assets';
  
  if (!existsSync(srcStaticDir)) {
    return;
  }
  
  function copyRecursive(src: string, dest: string) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    
    const items = readdirSync(src);
    items.forEach(item => {
      const srcPath = join(src, item);
      const destPath = join(dest, item);
      
      if (statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        // 跳过 README.md 文件
        if (item !== 'README.md') {
          copyFileSync(srcPath, destPath);
        }
      }
    });
  }
  
  copyRecursive(srcStaticDir, destAssetsDir);
}

/**
 * 极简构建配置
 * 只处理JS入口，CSS通过JS导入处理
 */
function generateEntries() {
  const entries: Record<string, string> = {};
  
  // 公共资源入口
  entries['main'] = 'src/common/main.js';
  
  // 扫描页面JS文件
  const jsFiles = glob.sync("src/pages/**/*.js");
  jsFiles.forEach((file) => {
    const matches = file.match(/src\/pages\/([^\/]+)\/\1\.js$/);
    if (matches) {
      const pageName = matches[1];
      entries[pageName] = file;
      console.log(`📄 ${pageName}: ${file}`);
    }
  });
  
  console.log(`✅ 生成 ${Object.keys(entries).length} 个入口点`);
  return entries;
}

export default defineConfig({
  build: {
    outDir: "templates/assets",
    minify: 'terser',
    rollupOptions: {
      input: generateEntries(),
      output: {
        entryFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            const name = assetInfo.name.replace('.css', '');
            if (name === 'main') {
              return 'css/main.css';
            }
            return `css/${name}.css`;
          }
          return "assets/[name][extname]";
        },
        manualChunks: undefined,
      },
    },
    assetsInlineLimit: 0,
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        copyStaticAssets();
      }
    }
  ]
});
