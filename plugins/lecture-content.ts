import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Marked, type Tokens } from 'marked';
import type { Plugin } from 'vite';

// content/*.md 를 파일 이름 순서대로 읽어 index.html 의 자리표시자를 채운다.
//   <!-- lecture:toc -->      목차 링크 (데스크톱·모바일 목차 양쪽)
//   <!-- lecture:sections --> 각 장의 <section class="doc-section">
//
// md 파일 머리말:
//   id     h2 의 id 이자 목차 앵커 (필수)
//   title  h2 제목 (필수)
//   num    장 번호. 있으면 h2 위 번호와 목차 번호로 쓴다
//   toc    목차·머리말에 쓸 짧은 이름. 없으면 title
//
// 본문 문법 확장:
//   [@06]                참고 문헌 #ref-06 으로 가는 인용 링크
//   ```lang 라벨          코드 패널 머리 라벨. 라벨이 없으면 lang 에 맞는 기본 이름
//   GFM 표               .table-wrap 으로 감싸 페이지 나눔에서 행 단위로 쪼갠다

type Chapter = { id: string; title: string; num?: string; toc?: string; html: string };

const CODE_LABELS: Record<string, string> = {
  bash: 'Shell',
  sh: 'Shell',
  ts: 'TypeScript',
  js: 'JavaScript',
  json: 'JSON',
  md: 'Markdown',
  yaml: 'YAML',
  text: 'Text',
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked({
  gfm: true,
  extensions: [
    {
      name: 'cite',
      level: 'inline',
      start: (src: string) => src.indexOf('[@'),
      tokenizer(src: string) {
        const m = /^\[@(\d+)\]/.exec(src);
        if (m) return { type: 'cite', raw: m[0], id: m[1] };
        return undefined;
      },
      renderer: (token) => `<a class="cite" href="#ref-${token.id}">[${token.id}]</a>`,
    },
  ],
  renderer: {
    code({ text, lang }: Tokens.Code) {
      const [language = 'text', ...rest] = (lang ?? '').trim().split(/\s+/);
      const label = rest.join(' ') || CODE_LABELS[language] || language;
      return (
        `<div class="code-panel"><div class="code-header"><span>${escapeHtml(label)}</span>` +
        `<button aria-label="코드 복사" class="copy-code" type="button">복사</button></div>` +
        `<pre class="code-block"><code class="language-${escapeHtml(language)}">${escapeHtml(text)}\n</code></pre></div>\n`
      );
    },
  },
  hooks: {
    postprocess: (html: string) =>
      html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>'),
  },
});

function parseFrontmatter(file: string, raw: string): { meta: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!m?.[1]) throw new Error(`${file}: 머리말(---)이 없습니다`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv?.[1]) meta[kv[1]] = (kv[2] ?? '').replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: raw.slice(m[0].length) };
}

function loadChapters(dir: string): Chapter[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const { meta, body } = parseFrontmatter(file, readFileSync(join(dir, file), 'utf8'));
      if (!meta.id || !meta.title) throw new Error(`${file}: id 와 title 이 필요합니다`);
      return { id: meta.id, title: meta.title, num: meta.num, toc: meta.toc, html: marked.parse(body) as string };
    });
}

const tocLabel = (c: Chapter): string => c.toc ?? c.title;

function renderToc(chapters: Chapter[]): string {
  return chapters
    .map(
      (c) =>
        `<a data-target="${c.id}" href="#${c.id}"><span class="toc-num">${c.num ?? ''}</span>${escapeHtml(tocLabel(c))}</a>`,
    )
    .join('');
}

function renderSections(chapters: Chapter[]): string {
  return chapters
    .map((c) => {
      const running = c.num ? `${c.num} · ${tocLabel(c)}` : tocLabel(c);
      const index = c.num ? `<span class="chapter-index">${c.num}</span> ` : '';
      return (
        `<section class="doc-section" data-running="${escapeHtml(running)}">\n` +
        `<h2 class="chapter-title" id="${c.id}">${index}${escapeHtml(c.title)}</h2>\n` +
        `${c.html}</section>`
      );
    })
    .join('\n');
}

export function lectureContent(contentDir = 'content'): Plugin {
  let dir = contentDir;
  return {
    name: 'lecture-content',
    configResolved(config) {
      dir = resolve(config.root, contentDir);
    },
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (file: string) => {
        if (file.startsWith(dir)) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const chapters = loadChapters(dir);
        return html
          .replaceAll('<!-- lecture:toc -->', renderToc(chapters))
          .replace('<!-- lecture:sections -->', renderSections(chapters));
      },
    },
  };
}
