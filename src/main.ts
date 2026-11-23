import './style.css';

// #source 의 .doc-section 을 A4 시트(.sheet)로 나눠 담는다.
// 섹션마다 새 시트에서 시작하고, 넘치는 블록은 다음 시트로 보낸다.
// 문단·목록·표는 시트 경계에서 쪼갤 수 있고, 그 밖의 블록(코드·그림)은 통째로 옮긴다.
// JS 가 꺼져 있으면 #source 가 한 장의 긴 종이로 그대로 보인다.
const DOC_TITLE = '스킬과 피드백 루프로 품질 높이기';
const SHEET_PX = (210 * 96) / 25.4;
const MIN_LINES = 2;

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 가 없습니다`);
  return el as T;
}

const sheetsEl = byId('sheets');
const source = byId('source');
const pageCount = byId('page-count');
const progress = byId('reading-progress');

function overflows(body: HTMLElement): boolean {
  const last = body.lastElementChild;
  if (!last) return false;
  return last.getBoundingClientRect().bottom > body.getBoundingClientRect().bottom + 0.5;
}

function newSheet(section: HTMLElement): HTMLElement {
  const sheet = document.createElement('section');
  sheet.className = 'sheet';
  if (section.classList.contains('doc-section--cover')) sheet.classList.add('sheet--cover');

  const head = document.createElement('header');
  head.className = 'sheet-head';
  for (const text of [DOC_TITLE, section.dataset.running ?? '']) {
    const span = document.createElement('span');
    span.textContent = text;
    head.append(span);
  }

  const body = document.createElement('div');
  body.className = 'sheet-body';

  const foot = document.createElement('footer');
  foot.className = 'sheet-foot';
  const no = document.createElement('span');
  no.className = 'sheet-no';
  foot.append(no);

  sheet.append(head, body, foot);
  sheetsEl.append(sheet);
  return body;
}

const keepWithNext = (el: Element): boolean =>
  /^H[23]$/.test(el.tagName) || el.classList.contains('keep-with-next');

// 쪼갤 수 없으면 블록을 원래대로 되돌리고 null 을 돌려준다.
function splitParagraph(p: HTMLElement, body: HTMLElement): HTMLElement | null {
  const rest = p.cloneNode(false) as HTMLElement;
  rest.removeAttribute('id');
  while (overflows(body) && p.lastChild) rest.prepend(p.lastChild);

  const first = rest.firstChild;
  if (first instanceof Text) {
    const tokens = first.data.split(/(?<=\s)/);
    const probe = document.createTextNode('');
    p.append(probe);
    let lo = 0;
    let hi = tokens.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      probe.data = tokens.slice(0, mid).join('');
      if (overflows(body)) hi = mid - 1;
      else lo = mid;
    }
    probe.data = tokens.slice(0, lo).join('');
    first.data = tokens.slice(lo).join('');
    if (!probe.data) probe.remove();
    if (!first.data) first.remove();
  }

  const lineHeight = parseFloat(getComputedStyle(p).lineHeight) || 24;
  const lines = p.textContent?.trim() ? Math.round(p.getBoundingClientRect().height / lineHeight) : 0;
  if (lines < MIN_LINES || !rest.textContent?.trim()) {
    p.append(...rest.childNodes);
    p.normalize();
    return null;
  }
  return rest;
}

function splitList(list: HTMLUListElement | HTMLOListElement, body: HTMLElement): HTMLElement | null {
  const rest = list.cloneNode(false) as HTMLUListElement | HTMLOListElement;
  rest.removeAttribute('id');
  while (overflows(body) && list.children.length > 1 && list.lastElementChild) {
    rest.prepend(list.lastElementChild);
  }
  if (overflows(body) || !rest.children.length) {
    list.append(...rest.children);
    return null;
  }
  if (list instanceof HTMLOListElement && rest instanceof HTMLOListElement) {
    rest.start = (list.start || 1) + list.children.length;
  }
  return rest;
}

function splitTable(wrap: HTMLElement, body: HTMLElement): HTMLElement | null {
  const tbody = wrap.querySelector('tbody');
  if (!tbody) return null;
  const rest = wrap.cloneNode(true) as HTMLElement;
  rest.removeAttribute('id');
  const restBody = rest.querySelector('tbody');
  if (!restBody) return null;
  restBody.replaceChildren();
  while (overflows(body) && tbody.rows.length > 2 && tbody.lastElementChild) {
    restBody.prepend(tbody.lastElementChild);
  }
  if (overflows(body) || !restBody.rows.length) {
    tbody.append(...restBody.children);
    return null;
  }
  return rest;
}

function trySplit(block: HTMLElement, body: HTMLElement): HTMLElement | null {
  if (block instanceof HTMLParagraphElement) return splitParagraph(block, body);
  if (block instanceof HTMLUListElement || block instanceof HTMLOListElement) return splitList(block, body);
  if (block.classList.contains('table-wrap')) return splitTable(block, body);
  return null;
}

function flagOverflow(body: HTMLElement): void {
  body.closest('.sheet')?.classList.add('sheet--overflow');
}

function paginateSection(section: HTMLElement): void {
  let body = newSheet(section);

  const place = (block: HTMLElement): void => {
    body.append(block);
    if (!overflows(body)) return;

    const rest = trySplit(block, body);
    if (rest) {
      body = newSheet(section);
      place(rest);
      return;
    }

    // 제목이 시트 맨 아래에 홀로 남지 않도록 함께 넘긴다.
    const carry: Element[] = [block];
    let prev = block.previousElementSibling;
    while (prev && keepWithNext(prev)) {
      carry.unshift(prev);
      prev = prev.previousElementSibling;
    }
    if (!prev) {
      flagOverflow(body);
      return;
    }

    body = newSheet(section);
    body.append(...carry);
    if (!overflows(body)) return;

    const rest2 = trySplit(block, body);
    if (rest2) {
      body = newSheet(section);
      place(rest2);
    } else {
      flagOverflow(body);
    }
  };

  for (const block of [...section.children] as HTMLElement[]) place(block);
}

function fitSheets(): void {
  const available = sheetsEl.parentElement?.clientWidth ?? SHEET_PX;
  sheetsEl.style.setProperty('--sheet-zoom', Math.min(1, available / SHEET_PX).toFixed(4));
}

async function paginate(): Promise<void> {
  await document.fonts.ready;
  for (const section of [...source.children] as HTMLElement[]) paginateSection(section);
  source.remove();

  const sheets = [...sheetsEl.querySelectorAll<HTMLElement>('.sheet')];
  sheets.forEach((sheet, i) => {
    const no = sheet.querySelector('.sheet-no');
    if (no) no.textContent = `${i + 1} / ${sheets.length}`;
  });
  pageCount.textContent = `A4 · ${sheets.length}쪽`;
  fitSheets();
  refreshReadingState();
}

// 읽기 진행 바와 목차 하이라이트
const tocEntries = [...document.querySelectorAll<HTMLAnchorElement>('.toc a[data-target]')];

function refreshReadingState(): void {
  const root = document.documentElement;
  const maxScroll = Math.max(1, root.scrollHeight - innerHeight);
  progress.style.width = `${Math.min(100, Math.max(0, (scrollY / maxScroll) * 100))}%`;

  let index = 0;
  tocEntries.forEach((a, i) => {
    const target = a.dataset.target ? document.getElementById(a.dataset.target) : null;
    if (target && target.getBoundingClientRect().top < 145) index = i;
  });
  tocEntries.forEach((a, i) => a.classList.toggle('active', i === index));
}

addEventListener('scroll', refreshReadingState, { passive: true });
addEventListener('resize', () => {
  fitSheets();
  refreshReadingState();
});

byId('print-action').addEventListener('click', () => window.print());

for (const button of document.querySelectorAll<HTMLButtonElement>('.copy-code')) {
  button.addEventListener('click', async () => {
    const code = button.closest('.code-panel')?.querySelector('pre code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = '복사됨';
      setTimeout(() => (button.textContent = '복사'), 1500);
    } catch {
      button.textContent = '선택하여 복사';
    }
  });
}

void paginate();
