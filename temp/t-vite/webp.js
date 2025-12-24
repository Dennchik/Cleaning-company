import path from 'path';
import { globSync } from 'glob';
import sharp from 'sharp';

export function convertImagesToWebp({
  inputDir = 'public/img',
  quality = 80,
  extensions = ['jpg', 'jpeg', 'png'],
} = {}) {
  const extSet = new Set(extensions.map((e) => `.${e}`));

  async function processFile(file) {
    const outPath = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    await sharp(file).webp({ quality }).toFile(outPath);
    console.log(`✅ ${path.basename(file)} → ${path.basename(outPath)}`);
  }

  async function processAll() {
    const patterns = extensions.map((ext) => `${inputDir}/**/*.${ext}`);
    const files = patterns.flatMap((pattern) => globSync(pattern));
    if (!files.length) {
      console.log('⚠️ Нет изображений для конвертации');
      return;
    }
    for (const file of files) {
      try {
        await processFile(file);
      } catch (err) {
        console.error(`❌ Ошибка при конвертации ${file}:`, err.message);
      }
    }
  }

  return {
    name: 'convert-images-to-webp',
    async buildStart() {
      console.log('🔄 Конвертация изображений в WebP...');
      await processAll();
    },
    configureServer(server) {
      console.log('👀 Наблюдение за изображениями для WebP');

      const handleChange = (file) => {
        if (extSet.has(path.extname(file).toLowerCase())) {
          processFile(file)
            .then(() => server.ws.send({ type: 'full-reload' }))
            .catch((err) =>
              console.error(`❌ Ошибка при конвертации ${file}:`, err.message)
            );
        }
      };

      server.watcher.on('add', handleChange);
      server.watcher.on('change', handleChange);
    },
  };
}
