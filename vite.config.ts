import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { lectureContent } from './plugins/lecture-content.ts';

const page = (name: string): string => fileURLToPath(new URL(name, import.meta.url));

// GitHub Pages 는 https://<user>.github.io/<repo>/ 하위 경로로 서빙하므로 자산 경로를 상대 경로로 만든다.
export default defineConfig({
  base: './',
  plugins: [lectureContent({ 'index.html': 'content', 'summary.html': 'content-summary' })],
  build: {
    rollupOptions: {
      input: { main: page('index.html'), summary: page('summary.html') },
    },
  },
});
