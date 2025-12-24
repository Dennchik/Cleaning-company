import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer'; // 👈 вот этот импорт добавь
import { fonts } from './vite/tasks/fonts';
import { fontStyle } from './vite/tasks/fontsStyle';
import { viteConvertPugInHtml } from '@mish.dev/vite-convert-pug-in-html';
import { compileScss } from './vite/tasks/scss.js';

// 🔹 Сначала конвертируем шрифты перед dev/build
fonts('./public/fonts');
compileScss();
export default defineConfig(({ command }) => {
  const isProd = command === 'build';

  return {
    plugins: [
      compileScss(),
      fontStyle(),

      viteConvertPugInHtml({
        minify: true,
        locals: {
          // Добавляем поддержку @@ синтаксиса
          '@@webRoot': isProd ? './' : '/',
          // Альтернативно можно использовать webRoot для совместимости
          webRoot: isProd ? './' : '/',
        },
        pugOptions: {
          pretty: !isProd, // форматирование только в development
          // Дополнительные опции Pug если нужно
        },
      }),
    ],
    base: './',
    server: {
      open: true,
    },
    css: {
      devSourcemap: true, // карты SCSS → CSS в dev

      preprocessorOptions: {},
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProd, // карты отключены в Production
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          // about: resolve(__dirname, 'page/about.html'),
          // contacts: resolve(__dirname, 'page/contacts.html'),
        },
      },
    },
  };
});
