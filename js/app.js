"use strict";
/* ════════════════════════════════════════════════════════════
   Kiln — local-first BYOK chat. One file, no build, no backend.
   ════════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const h = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const svg = (d, w = 15, sw = 1.5) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  down: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  eye:  svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  redo: svg('<path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>'),
  pen:  svg('<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>', 13),
  trash:svg('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 13),
  check:svg('<path d="M20 6 9 17l-5-5"/>', 16, 2),
  arrow:svg('<path d="M5 12h14M12 5l7 7-7 7"/>', 13),
  chev: svg('<path d="m9 18 6-6-6-6"/>', 11, 2),
  x:    svg('<path d="M18 6 6 18M6 6l12 12"/>', 12, 1.8)
};

/* ─────────── provider registry ───────────
   เพิ่ม provider ใหม่ (เช่น Ollama) ได้โดยเติม object ที่นี่ + case ใน callProvider */
const PROVIDERS = {
  demo: {
    name:'โหมดทดสอบ', wire:'demo', base:'local', prefix:'ไม่ต้องใช้ Key',
    help:'จำลองการส่งไฟล์ในเครื่อง ไม่เรียก AI API และไม่ใช้เครดิต',
    models:[{ id:'kiln-test-lab', label:'Test Lab', note:'ไม่ต้องใช้ Key', vision:true, think:false }]
  },
  openai: {
    name: 'OpenAI', wire: 'openai', base: 'https://api.openai.com/v1',
    prefix: 'sk-…', help: 'platform.openai.com/api-keys',
    models: [
      { id:'gpt-5.2',       label:'GPT-5.2',       note:'เรือธง',        vision:true,  think:'opt', off:true },
      { id:'gpt-5.2-mini',  label:'GPT-5.2 Mini',  note:'เร็ว คุ้ม',      vision:true,  think:'opt', off:true },
      { id:'gpt-5.1',       label:'GPT-5.1',       note:'เสถียร',        vision:true,  think:'opt', off:true },
      { id:'gpt-5.1-mini',  label:'GPT-5.1 Mini',  note:'',              vision:true,  think:'opt', off:true },
      { id:'gpt-5',         label:'GPT-5',         note:'',              vision:true,  think:'opt' },
      { id:'gpt-5-mini',    label:'GPT-5 Mini',    note:'',              vision:true,  think:'opt' },
      { id:'o4-mini',       label:'o4-mini',       note:'คณิต/ตรรกะ',     vision:true,  think:'opt' },
      { id:'gpt-4.1',       label:'GPT-4.1',       note:'ไม่คิดก่อนตอบ',  vision:true,  think:false },
      { id:'gpt-4o',        label:'GPT-4o',        note:'',              vision:true,  think:false }
    ]
  },
  anthropic: {
    name: 'Anthropic', wire: 'anthropic', base: 'https://api.anthropic.com/v1',
    prefix: 'sk-ant-…', help: 'console.anthropic.com',
    models: [
      { id:'claude-opus-4-5-20251101',   label:'Claude Opus 4.5',   note:'ลึกที่สุด',   vision:true, think:'opt', off:true },
      { id:'claude-sonnet-4-5-20250929', label:'Claude Sonnet 4.5', note:'สมดุล',      vision:true, think:'opt', off:true },
      { id:'claude-haiku-4-5-20251001',  label:'Claude Haiku 4.5',  note:'เร็ว',       vision:true, think:'opt', off:true },
      { id:'claude-sonnet-4-20250514',   label:'Claude Sonnet 4',   note:'',           vision:true, think:'opt', off:true },
      { id:'claude-3-5-haiku-latest',    label:'Claude 3.5 Haiku',  note:'ประหยัด',    vision:true, think:false }
    ]
  },
  google: {
    name: 'Gemini', wire: 'gemini', base: 'https://generativelanguage.googleapis.com/v1beta',
    prefix: 'AIza…', help: 'aistudio.google.com/apikey — มีโควตาฟรี',
    models: [
      { id:'gemini-3-pro-preview',  label:'Gemini 3 Pro',        note:'บริบทยาว',  vision:true, think:'opt', tlevel:true },
      { id:'gemini-2.5-pro',        label:'Gemini 2.5 Pro',      note:'',          vision:true, think:'opt' },
      { id:'gemini-2.5-flash',      label:'Gemini 2.5 Flash',    note:'เร็ว',      vision:true, think:'opt', off:true },
      { id:'gemini-2.5-flash-lite', label:'Gemini 2.5 Flash Lite', note:'ถูกสุด',  vision:true, think:'opt', off:true },
      { id:'gemini-2.0-flash',      label:'Gemini 2.0 Flash',    note:'',          vision:true, think:false }
    ]
  },
  deepseek: {
    name: 'DeepSeek', wire: 'deepseek', base: 'https://api.deepseek.com',
    prefix: 'sk-…', help: 'platform.deepseek.com — V4 เปิดโหมดคิดไว้เป็นค่าเริ่มต้น',
    models: [
      { id:'deepseek-v4-pro', label:'DeepSeek V4 Pro',   note:'บริบท 1M · แรงสุด', vision:false, think:'opt', off:true },
      { id:'deepseek-flash',  label:'DeepSeek V4.1 Flash', note:'เร็ว ถูก',        vision:false, think:'opt', off:true },
      { id:'deepseek-v4-flash', label:'DeepSeek V4 Flash', note:'ชื่อเดิม (ยังใช้ได้)', vision:false, think:'opt', off:true }
    ]
  },
  openrouter: {
    name: 'OpenRouter', wire: 'openrouter', base: 'https://openrouter.ai/api/v1',
    prefix: 'sk-or-…', help: 'openrouter.ai/keys — กุญแจเดียว ใช้ได้เกือบทุกโมเดล',
    models: [
      { id:'deepseek/deepseek-v4-pro',   label:'DeepSeek V4 Pro',   note:'', vision:false, think:'opt', off:true },
      { id:'deepseek/deepseek-v4-flash', label:'DeepSeek V4 Flash', note:'', vision:false, think:'opt', off:true },
      { id:'deepseek/deepseek-v4-flash:free', label:'DeepSeek V4 Flash', note:'ฟรี (จำกัดโควตา)', vision:false, think:'opt', off:true },
      { id:'openai/gpt-5.2',             label:'GPT-5.2',           note:'', vision:true,  think:'opt', off:true },
      { id:'anthropic/claude-opus-4.5',  label:'Claude Opus 4.5',   note:'', vision:true,  think:'opt', off:true },
      { id:'anthropic/claude-sonnet-4.5',label:'Claude Sonnet 4.5', note:'', vision:true,  think:'opt', off:true },
      { id:'google/gemini-3-pro-preview',label:'Gemini 3 Pro',      note:'', vision:true,  think:'opt' },
      { id:'x-ai/grok-4',                label:'Grok 4',            note:'', vision:true,  think:'opt' },
      { id:'qwen/qwen3-max',             label:'Qwen3 Max',         note:'', vision:false, think:'opt', off:true },
      { id:'moonshotai/kimi-k2',         label:'Kimi K2',           note:'', vision:false, think:false },
      { id:'meta-llama/llama-4-maverick',label:'Llama 4 Maverick',  note:'', vision:true,  think:false }
    ]
  },
  compatible: {
    name: 'ค่ายอื่น (OpenAI-compatible)', wire: 'compat', base: '',
    prefix: 'API key ของค่ายนั้น', help: 'ตั้งชื่อค่าย, API Base URL และ Model ID ของคุณเอง',
    models: [{ id:'', label:'กำหนด Model ID เอง', note:'ตั้งค่า URL ด้านล่าง', vision:true, think:false }]
  }
};
const LEVELS = [
  { v:'off',    th:'ปิด',        d:'ตอบทันที ไม่คิดก่อน — เร็วและถูกที่สุด' },
  { v:'auto',   th:'อัตโนมัติ',  d:'ปล่อยให้โมเดลตัดสินใจเอง' },
  { v:'low',    th:'ต่ำ',        d:'คิดสั้น ๆ พอให้ไม่ผิดพลาดง่าย' },
  { v:'medium', th:'กลาง',       d:'สมดุลระหว่างความลึกกับเวลา' },
  { v:'high',   th:'สูง',        d:'คิดยาว เหมาะกับโจทย์ยาก ใช้โทเคนมาก' }
];
const ANTHROPIC_BUDGET = { low:2000, medium:8000, high:24000 };
const GEMINI_BUDGET    = { low:1024, medium:8192, high:24576 };
const DEEPSEEK_EFFORT  = { low:'low', medium:'high', high:'max' };

/* ─────────── state ─────────── */
const K = { keys:'kiln.keys', cfg:'kiln.cfg', chats:'kiln.chats' };
const jget = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast('พื้นที่ในเครื่องเต็ม — ลบบทสนทนาเก่าที่มีไฟล์หรือรูปใหญ่ออกก่อน'); return false; } };

let keys  = jget(K.keys, {});
let cfg   = Object.assign({ provider:'openai', model:{}, level:'auto', sys:'', temp:0.7, enter:false, theme:null, search:false,
  proxy:'', proxyAll:false,
  compatible:{ name:'', base:'', model:'' } }, jget(K.cfg, {}));
cfg.model = cfg.model || {};
cfg.compatible = Object.assign({ name:'', base:'', model:'' }, cfg.compatible || {});
if (!PROVIDERS[cfg.provider]) cfg.provider = 'openai';
let chats = jget(K.chats, []);
let curId = chats[0]?.id || null;
let pending = [];        // attachments awaiting send
let ctrl = null, busy = false, pvSource = '';

const saveCfg   = () => jset(K.cfg, cfg);
const saveChats = () => jset(K.chats, chats);

/* ─────────── apiFetch — ทางออกเดียวของเครือข่าย + ตัวช่วยแก้ CORS ───────────
   1) ยิงตรงไปที่ปลายทางก่อน (กุญแจไม่ผ่านตัวกลาง)
   2) ถ้าเบราว์เซอร์บล็อก/เชื่อมต่อไม่ได้ (TypeError) และตั้ง Proxy URL ไว้ → ลองใหม่ผ่านพร็อกซี
      แล้วจำโฮสต์นั้นไว้ในรอบนี้ ครั้งต่อไปไปทางพร็อกซีเลย
   3) ถ้ายังไม่ได้ตั้งพร็อกซี → โยนข้อความอธิบายแทนคำว่า "Load failed" เฉย ๆ */
const proxyHosts = new Set();
const hostOf = u => { try { return new URL(u).host; } catch { return ''; } };
const viaProxy = (proxy, url) => proxy.replace(/\/+$/, '') + '/?url=' + encodeURIComponent(url);
function netError(url, e, triedProxy) {
  const host = hostOf(url) || 'ปลายทาง';
  const why = (e && e.message) ? e.message : String(e);
  const tips = triedProxy
    ? 'ลองผ่านพร็อกซีแล้วก็ยังไม่ได้ — ตรวจว่า Worker deploy แล้ว, ALLOWED_ORIGINS ตรงกับโดเมนเว็บนี้ และโฮสต์อยู่ใน allowlist'
    : 'สาเหตุที่พบบ่อย: ปลายทางไม่เปิด CORS (เช่น DeepSeek / ค่าย custom), เน็ตหลุด, ตัวบล็อกโฆษณา, หรือกุญแจถูกจำกัดโดเมน/Referrer — แก้ CORS ได้โดยตั้ง Proxy URL ในหน้าตั้งค่า';
  return new Error(`เชื่อมต่อ ${host} ไม่ได้ (${why}) · ${tips}`);
}
async function apiFetch(url, init) {
  const proxy = String(cfg.proxy || '').trim();
  const host = hostOf(url);
  if (proxy && (cfg.proxyAll || proxyHosts.has(host))) {
    try { return await fetch(viaProxy(proxy, url), init); }
    catch (e) { if (e?.name === 'AbortError') throw e; throw netError(url, e, true); }
  }
  try { return await fetch(url, init); }
  catch (e) {
    if (e?.name === 'AbortError') throw e;
    if (!proxy) throw netError(url, e, false);
    try { const r = await fetch(viaProxy(proxy, url), init); proxyHosts.add(host); return r; }
    catch (e2) { if (e2?.name === 'AbortError') throw e2; throw netError(url, e2, true); }
  }
}
function compatBase(base) {
  return String(base || '').trim().replace(/\/$/, '').replace(/\/chat\/completions$/i, '');
}
const P = () => {
  if (cfg.provider !== 'compatible') return PROVIDERS[cfg.provider] || PROVIDERS.openai;
  const c = cfg.compatible;
  const id = c.model || cfg.model.compatible || '';
  return { ...PROVIDERS.compatible, name:c.name.trim() || PROVIDERS.compatible.name, base:compatBase(c.base),
    models:[{ id, label:id || 'กำหนด Model ID เอง', note:'กำหนดเอง', vision:true, think:false }] };
};
const mId  = () => cfg.provider === 'compatible' ? (cfg.compatible.model || cfg.model.compatible || '') : (cfg.model[cfg.provider] || P().models[0].id);
const M    = () => P().models.find(m => m.id === mId()) || P().models[0];
const chat = () => chats.find(c => c.id === curId);

/* ─────────── theme ─────────── */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  $('#themeLbl').textContent = t === 'dark' ? 'สว่าง' : 'มืด';
  $('#swTheme')?.classList.toggle('on', t === 'dark');
  const mt = document.querySelector('meta[name=theme-color]');
  if (mt) mt.content = t === 'dark' ? '#131210' : '#f3f1ec';
}
function initTheme() {
  const t = cfg.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(t);
}
function flipTheme() {
  cfg.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  saveCfg(); applyTheme(cfg.theme);
}

/* ─────────── toast ─────────── */
let tT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2100); }

/* ─────────── markdown ─────────── */
if (window.marked) { try { marked.setOptions({ gfm:true, breaks:true }); } catch {} }
function md(src) {
  if (!window.marked) return (src || '').replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));
  const raw = marked.parse(src || '');
  return window.DOMPurify ? DOMPurify.sanitize(raw, { ADD_ATTR:['target'] }) : raw;
}
const EXT = { python:'py', py:'py', javascript:'js', js:'js', node:'js', jsx:'jsx', typescript:'ts', ts:'ts', tsx:'tsx',
  html:'html', htm:'html', xml:'xml', svg:'svg', css:'css', scss:'scss', less:'less', json:'json', jsonc:'json', bash:'sh', shell:'sh', sh:'sh', zsh:'sh',
  java:'java', c:'c', cpp:'cpp', 'c++':'cpp', csharp:'cs', cs:'cs', go:'go', golang:'go', rust:'rs', rs:'rs', php:'php',
  ruby:'rb', rb:'rb', sql:'sql', yaml:'yml', yml:'yml', markdown:'md', md:'md', swift:'swift', kotlin:'kt', kt:'kt',
  dart:'dart', r:'r', lua:'lua', toml:'toml', ini:'ini', csv:'csv', tsv:'tsv', diff:'diff', dockerfile:'Dockerfile', text:'txt', plaintext:'txt',
  vue:'vue', svelte:'svelte', astro:'astro', conf:'conf', env:'env', makefile:'Makefile' };
const LANG_FROM_EXT = { py:'python', js:'javascript', mjs:'javascript', cjs:'javascript', ts:'typescript', tsx:'tsx', jsx:'jsx',
  html:'html', htm:'html', css:'css', scss:'scss', json:'json', md:'markdown', yml:'yaml', yaml:'yaml', sh:'bash', rs:'rust',
  go:'go', rb:'ruby', php:'php', java:'java', c:'c', cpp:'cpp', cs:'csharp', sql:'sql', svg:'svg', vue:'javascript', toml:'ini' };
const extFor = l => EXT[(l || '').toLowerCase()] || 'txt';
const langFromName = name => {
  const base = String(name || '').split('/').pop() || '';
  if (/^dockerfile$/i.test(base)) return 'dockerfile';
  if (/^makefile$/i.test(base)) return 'makefile';
  const e = base.includes('.') ? base.split('.').pop().toLowerCase() : '';
  return LANG_FROM_EXT[e] || e || 'text';
};
const isHtmlish = (lang, raw, name='') => /^(html|htm|svg)$/i.test(lang) || /\.(html?|svg)$/i.test(name) || /<!doctype html|<html[\s>]/i.test(raw || '');
const byteSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const safePath = p => String(p || 'file.txt').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.\//g, '').slice(0, 180) || 'file.txt';
const guessName = (lang, raw, i) => {
  const m = String(raw || '').match(/(?:\/\/|#)\s*file:\s*([^\s]+)/i) || String(raw || '').match(/\/\*\s*file:\s*([^\s*]+)/i);
  if (m) return safePath(m[1]);
  const e = extFor(lang);
  if (e === 'Dockerfile') return 'Dockerfile';
  if (e === 'html' || isHtmlish(lang, raw)) return i ? `page-${i + 1}.html` : 'index.html';
  if (e === 'css') return i ? `styles-${i + 1}.css` : 'styles.css';
  if (e === 'js') return i ? `script-${i + 1}.js` : 'script.js';
  return `file-${i + 1}.${e}`;
};
function extractArtifacts(text) {
  const files = [], re = /```([^\n`]*)\n([\s\S]*?)```/g;
  let m, i = 0;
  while ((m = re.exec(text || '')) !== null) {
    const meta = (m[1] || '').trim();
    const body = m[2].replace(/\n$/, '');
    if (!body.trim()) continue;
    let lang = 'text', name = '';
    if (meta) {
      const parts = meta.split(/\s+/);
      if (parts[0].includes('.') || parts[0].includes('/')) { name = parts[0]; lang = langFromName(name); }
      else { lang = parts[0].toLowerCase(); const fp = parts.find(p => p.includes('.') || /^file:/i.test(p)); if (fp) name = fp.replace(/^file:/i, ''); }
    }
    name = safePath(name || guessName(lang, body, i));
    files.push({ name, lang: lang || langFromName(name), content: body, runnable: isHtmlish(lang, body, name) });
    i++;
  }
  return files;
}
function stripCodeFences(text, files) {
  if (!files?.length) return text || '';
  let out = text || '', i = 0;
  out = out.replace(/```[^\n`]*\n[\s\S]*?```/g, () => {
    const f = files[i++];
    return f ? `\n«file:${f.name}»\n` : '\n';
  });
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
function fileCard(file, all) {
  const row = h('button', 'fcard');
  const ext = (file.name.split('.').pop() || file.lang || 'txt').slice(0, 4);
  row.append(h('div', 'ic', ext));
  const meta = h('div', 'meta');
  meta.append(h('b', null, file.name));
  meta.append(h('span', null, `${file.lang || 'text'} · ${byteSize((file.content || '').length)}${file.runnable ? ' · รันได้' : ''}`));
  row.append(meta);
  const acts = h('div', 'acts');
  const b = (html, title, fn) => { const x = h('button'); x.innerHTML = html; x.title = title; x.onclick = e => { e.stopPropagation(); fn(); }; return x; };
  if (file.runnable) acts.append(b(I.eye, 'พรีวิวรัน', () => openFilePreview(file, all, 'run')));
  acts.append(b(svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>', 14), 'ดูโค้ด', () => openFilePreview(file, all, 'code')));
  acts.append(b(I.copy, 'คัดลอก', () => copy(file.content)));
  acts.append(b(I.down, 'ดาวน์โหลด', () => save(file.content, file.name.split('/').pop())));
  row.append(acts);
  row.onclick = () => openFilePreview(file, all, file.runnable ? 'run' : 'code');
  return row;
}
function buildFileSet(files) {
  const box = h('div', 'fileset');
  const head_ = h('div', 'fileset-h');
  head_.append(h('span', 'ttl', files.length === 1 ? '1 ไฟล์' : files.length + ' ไฟล์'));
  if (files.length > 1) {
    const z = h('button', null, 'ดาวน์โหลด ZIP');
    z.onclick = () => downloadZip(files, `project-${stamp()}.zip`);
    head_.append(z);
  }
  box.append(head_);
  files.forEach(f => box.append(fileCard(f, files)));
  return box;
}
function decorateCode(root) {
  // ใช้เฉพาะตอนไม่มีระบบไฟล์การ์ด (fallback)
  root.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    if (pre.parentElement?.classList.contains('code') || pre.closest('.fileset')) return;
    const cls = [...code.classList].find(c => c.startsWith('language-')) || '';
    let lang = cls.replace('language-', '') || 'text';
    const raw = code.textContent;
    const wrap = h('div', 'code'), bar = h('div', 'code-bar');
    bar.append(h('span', 'lang', lang));
    const mk = (html, title, fn) => { const b = h('button'); b.innerHTML = html; b.title = title; b.onclick = fn; return b; };
    if (isHtmlish(lang, raw)) bar.append(mk(I.eye, 'พรีวิว', () => openFilePreview({ name:'preview.html', content:raw, lang, runnable:true }, null, 'run')));
    bar.append(mk(I.copy, 'คัดลอก', () => copy(raw)));
    bar.append(mk(I.down, 'ดาวน์โหลด', () => save(raw, `snippet-${stamp()}.${extFor(lang)}`)));
    pre.replaceWith(wrap); wrap.append(bar, pre);
  });
}
function renderAssistantBody(container, content) {
  const files = extractArtifacts(content);
  const proseText = files.length ? stripCodeFences(content, files) : content;
  const clean = proseText.replace(/«file:([^»]+)»/g, (_, name) => `\n**ไฟล์:** \`${name}\`\n`);
  if (clean.trim()) {
    const p = h('div', 'prose'); p.innerHTML = md(clean); decorateCode(p); container.append(p);
  }
  if (files.length) container.append(buildFileSet(files));
  return files;
}
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
function copy(text) {
  const done = () => toast('คัดลอกแล้ว');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => legacyCopy(text, done));
  else legacyCopy(text, done);
}
function legacyCopy(text, done) {
  const t = h('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0;top:0';
  document.body.append(t); t.select();
  try { document.execCommand('copy'); done(); } catch { toast('คัดลอกไม่สำเร็จ'); }
  t.remove();
}
function save(content, name, mime = 'text/plain') {
  try {
    const url = URL.createObjectURL(new Blob([content], { type: mime + ';charset=utf-8' }));
    const a = h('a'); a.href = url; a.download = name; a.rel = 'noopener';
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
    toast('บันทึก ' + name);
  } catch { toast('บันทึกไฟล์ไม่สำเร็จ'); }
}
async function downloadZip(files, name = `files-${stamp()}.zip`) {
  if (!window.JSZip) { toast('ยังโหลดตัวสร้าง ZIP ไม่ได้'); return; }
  try {
    const zip = new JSZip();
    files.forEach(f => zip.file(safePath(f.name), f.content || ''));
    const blob = await zip.generateAsync({ type:'blob', compression:'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = h('a'); a.href = url; a.download = name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
    toast('บันทึก ' + name + ` (${files.length} ไฟล์)`);
  } catch (e) { toast('สร้าง ZIP ไม่สำเร็จ'); }
}
function buildPreviewHtml(file, all) {
  const src = file.content || '';
  if (!all?.length || all.length === 1) return src;
  // ถ้าเป็นโปรเจกต์หลายไฟล์ และเป็น HTML — ฝัง css/js ญาติเข้าไปเพื่อพรีวิวรันได้
  if (!isHtmlish(file.lang, src, file.name)) return src;
  let html = src;
  const map = Object.fromEntries(all.map(f => [safePath(f.name).split('/').pop(), f]));
  html = html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (full, href) => {
    const base = href.split('/').pop();
    return map[base] ? `<style data-from="${base}">\n${map[base].content}\n</style>` : full;
  });
  html = html.replace(/<script([^>]*)src=["']([^"']+\.js)["']([^>]*)>\s*<\/script>/gi, (full, a, srcPath, b) => {
    const base = srcPath.split('/').pop();
    return map[base] ? `<script${a}${b}>\n${map[base].content}\n<\/script>` : full;
  });
  return html;
}
let pvFile = null, pvAll = null, previewSeq = 0;
function openFilePreview(file, all, mode = 'run') {
  previewSeq++;
  pvFile = file; pvAll = all || [file];
  $('#pvDl').disabled = false; $('#pvNew').disabled = false;
  pvSource = buildPreviewHtml(file, pvAll);
  $('#pvTitle').textContent = file.name;
  $('#pvCode').textContent = file.content || '';
  $('#pvModeRun').textContent = 'รัน'; $('#pvModeCode').textContent = 'โค้ด';
  $('#pvFrame').removeAttribute('src');
  $('#pvFrame').srcdoc = file.runnable || isHtmlish(file.lang, file.content, file.name) ? pvSource : `<pre style="white-space:pre-wrap;font:14px/1.5 ui-monospace,monospace;padding:16px">${escapeHTML(file.content || '')}</pre>`;
  const canRun = file.runnable || isHtmlish(file.lang, file.content, file.name);
  $('#pvMode').hidden = !canRun;
  setPreviewMode(canRun && mode === 'run' ? 'run' : 'code');
  open$('#pvWrap');
}
function setPreviewMode(mode) {
  const run = mode === 'run';
  $('#pvWrap').classList.toggle('show-code', !run);
  $('#pvModeRun').classList.toggle('on', run);
  $('#pvModeCode').classList.toggle('on', !run);
}
function openPreview(src) { openFilePreview({ name:'preview.html', content:src, lang:'html', runnable:true }, null, 'run'); }
$('#pvModeRun').onclick = () => setPreviewMode('run');
$('#pvModeCode').onclick = () => setPreviewMode('code');
$('#pvDl').onclick = () => {
  if (!pvFile) return;
  if (pvFile.demoId && demoUrls.has(pvFile.demoId)) {
    const a = h('a'); a.href = demoUrls.get(pvFile.demoId); a.download = pvFile.name;
    document.body.append(a); a.click(); a.remove();
    return;
  }
  save(pvFile.content || '', (pvFile.name || 'file').split('/').pop());
};
$('#pvNew').onclick = () => {
  try {
    if (pvFile?.demoId) {
      window.open(demoUrls.get(pvFile.demoId) || '#', '_blank', 'noopener');
      return;
    }
    const type = (pvFile?.runnable || isHtmlish(pvFile?.lang, pvFile?.content, pvFile?.name)) ? 'text/html' : 'text/plain';
    window.open(URL.createObjectURL(new Blob([type === 'text/html' ? pvSource : (pvFile?.content || '')], { type })), '_blank');
  } catch { toast('เบราว์เซอร์บล็อกหน้าต่างใหม่'); }
};

/* ─────────── Test Lab: real files, generated locally when needed ─────────── */
const DEMO_SPECS = [
  { id:'pdf',  cmd:'1',    name:'test.pdf',   label:'PDF',         mime:'application/pdf', description:'เอกสาร 1 หน้า', native:true },
  { id:'pptx', cmd:'1.1',  name:'test.pptx',  label:'PowerPoint',  mime:'application/vnd.openxmlformats-officedocument.presentationml.presentation', description:'สไลด์จริง เปิดใน Keynote/PowerPoint' },
  { id:'docx', cmd:'1.2',  name:'test.docx',  label:'Word',        mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description:'เอกสารจริง เปิดใน Pages/Word' },
  { id:'xlsx', cmd:'1.3',  name:'test.xlsx',  label:'Excel',       mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description:'ตารางจริง เปิดใน Numbers/Excel' },
  { id:'png',  cmd:'1.4',  name:'test.png',   label:'PNG',         mime:'image/png', description:'ภาพที่วาดในเบราว์เซอร์', native:true },
  { id:'svg',  cmd:'1.5',  name:'test.svg',   label:'SVG',         mime:'image/svg+xml', description:'ภาพเวกเตอร์', native:true },
  { id:'html', cmd:'1.6',  name:'index.html',label:'HTML',        mime:'text/html', description:'หน้าเว็บพรีวิวรันได้', native:true },
  { id:'css',  cmd:'1.7',  name:'styles.css',label:'CSS',         mime:'text/css', description:'สไตล์ของหน้าเว็บ' },
  { id:'js',   cmd:'1.8',  name:'app.js',    label:'JavaScript',  mime:'text/javascript', description:'สคริปต์หน้าเว็บ' },
  { id:'json', cmd:'1.9',  name:'test.json', label:'JSON',        mime:'application/json', description:'ข้อมูลแบบมีโครงสร้าง' },
  { id:'csv',  cmd:'1.10', name:'test.csv',  label:'CSV',         mime:'text/csv', description:'ตารางตัวอักษร' },
  { id:'txt',  cmd:'1.11', name:'test.txt',  label:'TXT',         mime:'text/plain', description:'ข้อความล้วน' },
  { id:'md',   cmd:'1.12', name:'README.md',label:'Markdown',    mime:'text/markdown', description:'เอกสารอ่านง่าย' },
  { id:'py',   cmd:'1.13', name:'test.py',   label:'Python',      mime:'text/x-python', description:'สคริปต์ Python' },
  { id:'xml',  cmd:'1.14', name:'test.xml',  label:'XML',         mime:'application/xml', description:'ข้อมูลแบบ XML' },
  { id:'yaml', cmd:'1.15', name:'test.yaml',label:'YAML',        mime:'text/yaml', description:'ไฟล์ตั้งค่า' },
  { id:'sql',  cmd:'1.16', name:'test.sql', label:'SQL',         mime:'application/sql', description:'ตัวอย่างคำสั่งฐานข้อมูล' },
  { id:'ts',   cmd:'1.17', name:'test.ts',  label:'TypeScript',  mime:'text/typescript', description:'โค้ดแบบระบุชนิดข้อมูล' },
  { id:'jpg',  cmd:'1.18', name:'test.jpg', label:'JPG',         mime:'image/jpeg', description:'ภาพถ่ายตัวอย่าง', native:true }
];
const DEMO_BY_ID = Object.assign(Object.create(null), Object.fromEntries(DEMO_SPECS.map(s => [s.id, s])));
const demoArtifacts = new Map(), demoUrls = new Map(), demoZipCache = new Map(), demoZipUrls = new Map();
const isDemoText = id => !['pdf','pptx','docx','xlsx','png','jpg'].includes(id);

function demoGuide() {
  const lines = DEMO_SPECS.map(s => `| \`${s.cmd}\` | ${s.label} | \`.${s.name.split('.').pop()}\` |`);
  return [
    '**Test Lab — พิมพ์เลขแล้วส่งได้เลย**',
    'ไฟล์ถูกสร้างในเบราว์เซอร์ของคุณ ไม่ใช้ API Key และไม่ส่งข้อมูลไปที่โมเดล (PPTX ต้องต่อเน็ตเพื่อโหลดตัวสร้างไฟล์ครั้งแรก)',
    '| คำสั่ง | ไฟล์ | นามสกุล |', '|:--|:--|:--|', ...lines,
    '| `2` | ZIP รวมไฟล์ตัวอย่างทั้งหมด | `.zip` |',
    '| `3` | โปรเจกต์เว็บ 3 ไฟล์ + ZIP | `.html` `.css` `.js` |',
    '| แนบไฟล์ | รายงานว่าแอปอ่านอะไรได้บ้าง (รวม ZIP) | ทุกนามสกุล |',
    '', 'พิมพ์อย่างอื่น หรือ `help` เพื่อดูรายการนี้อีกครั้ง กดไฟล์เพื่อพรีวิวแล้วดาวน์โหลดได้',
    '', 'ทดสอบการแตก ZIP: ดาวน์โหลด ZIP จากคำสั่ง `2` แล้วแนบกลับเข้ามา — ต้องเห็นเป็นไฟล์แนบ **ชิ้นเดียว**'
  ].join('\n');
}
/* รายงานว่าแอปอ่านไฟล์แนบได้อะไรบ้าง — ใช้ทดสอบการอัปโหลด/แตก ZIP โดยไม่เปลืองเครดิต */
function uploadReport(attachments) {
  const lines = ['**รายงานไฟล์ที่ได้รับ** — โหมดทดสอบไม่ส่งไฟล์ออกไปไหน', ''];
  displayAttachments(attachments).forEach(a => {
    if (a.type === 'zip') {
      lines.push(`- **${a.name}** — ZIP ${a.total} ไฟล์ = ไฟล์แนบ 1 ชิ้น · อ่านได้ ${a.files.length}` +
        (a.skipped?.length ? ` · ข้าม ${a.skipped.length}` : '') + (a.ignored ? ` · ซ่อนไฟล์ระบบ ${a.ignored}` : ''));
      a.files.slice(0, 30).forEach(f => lines.push(`  - \`${f.name}\` · ${byteSize(f.size ?? (f.text || '').length)}` +
        (f.office ? ' · ดึงข้อความจาก Office' : '') + (f.cut ? ' · ส่งช่วงแรก' : '')));
      if (a.files.length > 30) lines.push(`  - …อีก ${a.files.length - 30} ไฟล์`);
      (a.skipped || []).slice(0, 15).forEach(s => lines.push(`  - ~~\`${s.name}\`~~ · ${s.reason}`));
    } else if (a.type === 'image') {
      lines.push(`- **${a.name}** — รูปภาพ${a.resized ? ' (ย่อเหลือด้านยาว 1600px แล้ว)' : ''}`);
    } else {
      lines.push(`- **${a.name}** — ${a.meta ? 'ส่งได้เฉพาะชื่อไฟล์' : a.office ? 'ดึงข้อความจาก Office' : 'ไฟล์ข้อความ'} · ${byteSize(a.size ?? (a.text || '').length)}`);
    }
  });
  lines.push('', 'แตะป้าย **ZIP** ในข้อความของคุณเพื่อเปิดดูทีละไฟล์ · ถ้าใช้โมเดลจริง เนื้อหาเหล่านี้จะถูกส่งเป็นบริบทให้ AI');
  return lines.join('\n');
}
function buildDemoReply(text, attachments=[]) {
  const q = String(text || '').trim().toLowerCase();
  const item = DEMO_SPECS.find(s => q === s.cmd || q === s.id || q === '.' + s.id);
  const received = attachments.length ? '\n\n' + uploadReport(attachments) : '';
  if (item) return {
    content:`**${item.label} พร้อมแล้ว**\n\n${item.description} แตะชื่อไฟล์เพื่อดูตัวอย่าง หรือกดดาวน์โหลดด้านขวา\n\nพิมพ์ \`2\` เพื่อรับ ZIP รวมทุกชนิด${received}`,
    demoFiles:[item.id]
  };
  if (q === '2') return {
    content:`**ชุดไฟล์ทดสอบทั้งหมด**\n\nดาวน์โหลดเป็น ZIP ไฟล์เดียว มีไฟล์ตัวอย่างจริง ${DEMO_SPECS.length} ชนิด เปิดรายการด้านล่างเพื่อดูหรือดาวน์โหลดทีละไฟล์${received}`,
    demoFiles:DEMO_SPECS.map(s => s.id), demoZip:true
  };
  if (q === '3') return {
    content:`**โปรเจกต์เว็บ 3 ไฟล์**\n\n\`index.html\`, \`styles.css\`, \`app.js\` — ทดลองพรีวิวหน้าเว็บ, ดูโค้ด แล้วกด ZIP ได้${received}`,
    demoFiles:['html','css','js'], demoZip:true
  };
  if (attachments.length && !q) return { content:uploadReport(attachments) };
  return { content:demoGuide() + received };
}

function demoText(id) {
  switch(id) {
    case 'svg': return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#f3f1ec"/><circle cx="720" cy="160" r="100" fill="#b5502c" opacity=".85"/><path d="M64 420H896" stroke="#d9d2c6" stroke-width="2"/><text x="64" y="280" fill="#1a1a18" font-family="Georgia,serif" font-size="80">Kiln Test Lab</text><text x="70" y="340" fill="#8b857a" font-family="Arial,sans-serif" font-size="26">SVG generated locally</text></svg>`;
    case 'html': return '<!DOCTYPE html>\n<html lang="th">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Kiln Test Lab</title>\n<link rel="stylesheet" href="styles.css">\n<style>body{margin:0;background:#f3f1ec;color:#1a1a18;font-family:Arial,sans-serif}main{max-width:680px;margin:18vh auto;padding:24px}h1{font:normal 72px Georgia,serif;letter-spacing:-.05em}p{color:#625f58}button{border:1px solid #1a1a18;background:transparent;padding:12px 20px;font:inherit;cursor:pointer}</style>\n</head>\n<body>\n<main><small>DEMO / KILN</small><h1>Hello, world.</h1><p>A tiny website you can preview and download.</p><button id="try">Click to test</button><p id="result"></p></main>\n<script src="app.js"><' + '/script>\n<script>document.querySelector("#try").addEventListener("click",()=>document.querySelector("#result").textContent="It works.")<' + '/script>\n</body>\n</html>\n';
    case 'css': return '/* Kiln Test Lab - styles.css */\n:root { color-scheme: light; }\nbody { background: #f3f1ec; color: #1a1a18; }\nh1 { color: #b5502c; }\nbutton:hover { background: #1a1a18; color: white; }\n';
    case 'js': return '/* Kiln Test Lab - app.js */\nconsole.info("Kiln test project loaded");\nconst button = document.querySelector("#try");\nif (button) button.setAttribute("title", "This button works");\n';
    case 'json': return JSON.stringify({ app:'Kiln Test Lab', ok:true, files:DEMO_SPECS.length, created:'in your browser', values:[1,2,3] }, null, 2) + '\n';
    case 'csv': return '\uFEFFname,type,status\nKiln,CSV,ready\nTest Lab,example,ready\n';
    case 'txt': return 'Kiln Test Lab\n\nThis is a real .txt file generated in your browser.\nNo model API key was used.\n';
    case 'md': return '# Kiln Test Lab\n\nA sample Markdown file.\n\n- Test file downloads\n- Test ZIP contents\n- Test browser previews\n\nOpen `index.html` to see the web demo.\n';
    case 'py': return '# Kiln Test Lab - test.py\n\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("world"))\n';
    case 'xml': return '<?xml version="1.0" encoding="UTF-8"?>\n<test name="Kiln" version="1"><status>ready</status><file>test.xml</file></test>\n';
    case 'yaml': return 'app: Kiln Test Lab\nmode: demo\nready: true\nfiles:\n  - test.pdf\n  - test.pptx\n  - index.html\n';
    case 'sql': return '-- Kiln Test Lab - test.sql\nCREATE TABLE IF NOT EXISTS samples (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nINSERT INTO samples (name) VALUES (\'Kiln Test Lab\');\nSELECT * FROM samples;\n';
    case 'ts': return '/* Kiln Test Lab - test.ts */\ntype Sample = { name: string; ready: boolean };\nconst sample: Sample = { name: "Kiln Test Lab", ready: true };\nconsole.log(sample.name, sample.ready);\n';
    default: return '';
  }
}

function demoPdf() {
  const stream = 'q\n0.953 0.945 0.925 rg\n0 0 595 842 re f\nQ\n0.71 0.31 0.17 rg\n48 630 86 86 re f\n0.10 0.10 0.09 rg\nBT /F1 32 Tf 48 730 Td (Kiln Test Lab) Tj ET\nBT /F1 17 Tf 48 590 Td (A real PDF, made in your browser.) Tj ET\nBT /F1 12 Tf 48 565 Td (No API key or server is required.) Tj ET\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
  ];
  let pdf = '%PDF-1.4\n%Kiln Test Lab\n';
  const positions = [0];
  for (let i=0;i<objects.length;i++) {
    positions.push(pdf.length);
    pdf += `${i+1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  pdf += positions.slice(1).map(p => `${String(p).padStart(10,'0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type:'application/pdf' });
}

function demoOfficeZip(kind) {
  if (!window.JSZip) throw new Error('ต้องโหลด JSZip ก่อนสร้างไฟล์ Office');
  const z = new JSZip();
  const ct = 'http://schemas.openxmlformats.org/package/2006/content-types';
  const rel = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const od = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  if (kind === 'docx') {
    const wm = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    z.file('[Content_Types].xml', `<Types xmlns="${ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    z.file('_rels/.rels', `<Relationships xmlns="${rel}"><Relationship Id="rId1" Type="${od}/officeDocument" Target="word/document.xml"/></Relationships>`);
    z.file('word/document.xml', `<w:document xmlns:w="${wm}"><w:body><w:p><w:r><w:rPr><w:b/><w:sz w:val="40"/></w:rPr><w:t>Kiln Test Lab</w:t></w:r></w:p><w:p><w:r><w:t>This is a real DOCX file generated in your browser.</w:t></w:r></w:p><w:p><w:r><w:t>No model API key was used.</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);
    return z;
  }
  const sm = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  z.file('[Content_Types].xml', `<Types xmlns="${ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  z.file('_rels/.rels', `<Relationships xmlns="${rel}"><Relationship Id="rId1" Type="${od}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  z.file('xl/workbook.xml', `<workbook xmlns="${sm}" xmlns:r="${od}"><sheets><sheet name="Test" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  z.file('xl/_rels/workbook.xml.rels', `<Relationships xmlns="${rel}"><Relationship Id="rId1" Type="${od}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  z.file('xl/worksheets/sheet1.xml', `<worksheet xmlns="${sm}"><dimension ref="A1:C3"/><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>Type</t></is></c><c r="C1" t="inlineStr"><is><t>Status</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Kiln</t></is></c><c r="B2" t="inlineStr"><is><t>XLSX</t></is></c><c r="C2" t="inlineStr"><is><t>Ready</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Browser</t></is></c><c r="B3" t="inlineStr"><is><t>Local</t></is></c><c r="C3"><v>1</v></c></row></sheetData></worksheet>`);
  return z;
}

let pptxLoader;
function loadPptx() {
  if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
  if (!pptxLoader) pptxLoader = new Promise((resolve, reject) => {
    const s = h('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js';
    s.onload = () => window.PptxGenJS ? resolve(window.PptxGenJS) : reject(new Error('โหลดตัวสร้าง PPTX ไม่สำเร็จ'));
    s.onerror = () => reject(new Error('ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อโหลดตัวสร้าง PPTX'));
    document.head.append(s);
  }).catch(e => { pptxLoader = null; throw e; });
  return pptxLoader;
}
async function demoPptx() {
  const PptxGenJS = await loadPptx();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Kiln Test Lab';
  pptx.subject = 'Browser file test';
  pptx.title = 'Kiln Test Lab';
  const slide = pptx.addSlide();
  slide.background = { color:'F3F1EC' };
  slide.addText('KILN / TEST LAB', { x:.8, y:.65, w:10.5, h:.35, fontFace:'Aptos', fontSize:13, color:'B5502C', bold:true, charSpacing:2 });
  slide.addText('Hello, world.', { x:.8, y:2.15, w:11.2, h:1, fontFace:'Georgia', fontSize:48, color:'1A1A18', breakLine:false });
  slide.addText('A real PowerPoint file, made on your device.', { x:.85, y:3.55, w:10, h:.55, fontFace:'Aptos', fontSize:19, color:'625F58' });
  slide.addText('01  /  FILE FORMAT TEST', { x:.85, y:6.75, w:6, h:.28, fontFace:'Aptos', fontSize:11, color:'8B857A' });
  const data = await pptx.write({ outputType:'blob' });
  return data instanceof Blob ? data : new Blob([data], { type:DEMO_BY_ID.pptx.mime });
}

function demoImage(mime) {
  return new Promise((resolve, reject) => {
    const canvas = h('canvas'); canvas.width=960; canvas.height=540;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('เบราว์เซอร์นี้ไม่รองรับ Canvas')); return; }
    ctx.fillStyle='#f3f1ec'; ctx.fillRect(0,0,960,540);
    ctx.fillStyle='#b5502c'; ctx.beginPath(); ctx.arc(747,160,104,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a18'; ctx.font='74px Georgia,serif'; ctx.fillText('Kiln Test Lab',64,288);
    ctx.fillStyle='#625f58'; ctx.font='25px Arial,sans-serif'; ctx.fillText('Made locally in your browser',70,345);
    ctx.fillStyle='#d9d2c6'; ctx.fillRect(64,414,832,2);
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('สร้างรูปภาพไม่สำเร็จ')), mime, .92);
  });
}

async function makeDemoArtifact(id) {
  const spec = DEMO_BY_ID[id];
  if (!spec) throw new Error('ไม่รู้จักชนิดไฟล์');
  let blob, content = null;
  if (id === 'pdf') blob = demoPdf();
  else if (id === 'pptx') blob = await demoPptx();
  else if (id === 'docx' || id === 'xlsx') blob = await demoOfficeZip(id).generateAsync({ type:'blob', mimeType:spec.mime, compression:'DEFLATE' });
  else if (id === 'png' || id === 'jpg') blob = await demoImage(spec.mime);
  else { content = demoText(id); blob = new Blob([content], { type:spec.mime + ';charset=utf-8' }); }
  return { spec, blob, content };
}
function getDemoArtifact(id) {
  if (!demoArtifacts.has(id)) demoArtifacts.set(id, makeDemoArtifact(id).catch(e => {
    demoArtifacts.delete(id); throw e;
  }));
  return demoArtifacts.get(id);
}
async function getDemoUrl(id) {
  if (!demoUrls.has(id)) demoUrls.set(id, URL.createObjectURL((await getDemoArtifact(id)).blob));
  return demoUrls.get(id);
}
function getDemoZip(ids) {
  const valid = [...new Set(ids)].filter(id => DEMO_BY_ID[id]);
  const key = valid.join('|');
  if (!demoZipCache.has(key)) demoZipCache.set(key, (async () => {
    if (!window.JSZip) throw new Error('ต้องโหลด JSZip ก่อนสร้าง ZIP');
    const zip = new JSZip();
    for (const id of valid) {
      const { spec, blob } = await getDemoArtifact(id);
      zip.file(spec.name, await blob.arrayBuffer());
    }
    return zip.generateAsync({ type:'blob', compression:'DEFLATE' });
  })().catch(e => { demoZipCache.delete(key); throw e; }));
  return demoZipCache.get(key);
}
async function getDemoZipUrl(ids) {
  const key = [...new Set(ids)].filter(id => DEMO_BY_ID[id]).join('|');
  if (!demoZipUrls.has(key)) demoZipUrls.set(key, URL.createObjectURL(await getDemoZip(ids)));
  return demoZipUrls.get(key);
}

function preparedDemoLink(label, name, prepare) {
  const a = h('a'); a.textContent = 'กำลังเตรียม…'; a.href='#';
  a.setAttribute('aria-label', `ดาวน์โหลด ${name}`);
  a.addEventListener('click', e => e.stopPropagation());
  a.onclick = e => { if (a.dataset.ready !== 'true') e.preventDefault(); };
  const start = () => {
    a.dataset.ready = 'false'; a.textContent = 'กำลังเตรียม…';
    prepare().then(url => {
      a.href = url; a.download = name; a.textContent = label; a.dataset.ready = 'true';
    }).catch(err => {
      a.textContent = 'ลองอีกครั้ง'; a.title = err.message || String(err);
      a.onclick = e => { e.preventDefault(); a.onclick = evt => { if (a.dataset.ready !== 'true') evt.preventDefault(); }; start(); };
    });
  };
  start();
  return a;
}
function demoFileRow(id, group) {
  const s = DEMO_BY_ID[id];
  const row = h('div', 'fcard');
  row.setAttribute('role', 'button'); row.tabIndex = 0;
  row.setAttribute('aria-label', 'พรีวิว ' + s.name);
  row.onclick = () => previewDemoFile(id, group);
  row.onkeydown = e => {
    if (e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); }
  };
  row.append(h('span', 'ic', s.name.split('.').pop().slice(0,4)));
  const meta = h('div', 'meta');
  meta.append(h('b', null, s.name), h('span', null, s.description)); row.append(meta);
  const acts = h('div', 'acts');
  const preview = h('button'); preview.innerHTML = I.eye; preview.title = 'พรีวิว ' + s.name;
  preview.setAttribute('aria-label', 'พรีวิว ' + s.name);
  preview.onclick = e => { e.stopPropagation(); previewDemoFile(id, group); };
  acts.append(preview);
  const link = preparedDemoLink('↓', s.name, () => getDemoUrl(id));
  link.title = 'ดาวน์โหลด ' + s.name;
  acts.append(link); row.append(acts);
  return row;
}
function buildDemoFileSet(ids, packaged) {
  const valid = [...new Set(ids)].filter(id => DEMO_BY_ID[id]);
  const box = h('div', 'fileset');
  const top = h('div', 'fileset-h');
  top.append(h('span', 'ttl', `${valid.length} ไฟล์ทดสอบ`));
  if (packaged && valid.length) {
    const name = valid.length === DEMO_SPECS.length ? 'kiln-test-all.zip' : 'kiln-test-project.zip';
    top.append(preparedDemoLink('ดาวน์โหลด ZIP', name, () => getDemoZipUrl(valid)));
  }
  box.append(top);
  if (packaged && valid.length > 3) {
    const details = h('details', 'demo-list');
    details.append(h('summary', null, `ดู ${valid.length} ไฟล์ใน ZIP และดาวน์โหลดทีละไฟล์`));
    valid.forEach(id => details.append(demoFileRow(id, valid)));
    box.append(details);
  } else valid.forEach(id => box.append(demoFileRow(id, valid)));
  return box;
}
async function previewDemoFile(id, group) {
  const spec = DEMO_BY_ID[id];
  if (!spec) return;
  const seq = ++previewSeq;
  pvFile = null; $('#pvDl').disabled = true; $('#pvNew').disabled = true;
  $('#pvTitle').textContent = spec.name;
  $('#pvMode').hidden = true;
  $('#pvWrap').classList.remove('show-code');
  $('#pvFrame').src = 'about:blank';
  $('#pvFrame').srcdoc = '<p style="font:16px sans-serif;padding:20px">กำลังเตรียมไฟล์ตัวอย่าง…</p>';
  open$('#pvWrap');
  try {
    const artifact = await getDemoArtifact(id);
    if (seq !== previewSeq || !$('#pvWrap').classList.contains('on')) return;
    if (isDemoText(id) && id !== 'svg') {
      let all = null;
      if (id === 'html' && group?.includes('css') && group?.includes('js')) {
        all = await Promise.all(['html','css','js'].map(async key => {
          const f = await getDemoArtifact(key);
          return { name:f.spec.name, content:f.content, lang:langFromName(f.spec.name) };
        }));
        if (seq !== previewSeq || !$('#pvWrap').classList.contains('on')) return;
      }
      openFilePreview({ name:spec.name, lang:langFromName(spec.name), content:artifact.content, runnable:id === 'html' }, all, id === 'html' ? 'run' : 'code');
      return;
    }
    pvFile = { name:spec.name, demoId:id, blob:artifact.blob };
    pvSource = '';
    $('#pvCode').textContent = `Kiln Test Lab\n\n${spec.name}\n${spec.description}\n\nไฟล์จริงถูกสร้างบนอุปกรณ์นี้ ไม่ได้ส่งจาก AI`;
    await getDemoUrl(id);
    if (seq !== previewSeq || !$('#pvWrap').classList.contains('on')) return;
    $('#pvDl').disabled = false; $('#pvNew').disabled = false;
    if (spec.native) {
      $('#pvMode').hidden = false;
      $('#pvModeRun').textContent = 'ดูไฟล์';
      $('#pvModeCode').textContent = 'รายละเอียด';
      $('#pvFrame').removeAttribute('srcdoc');
      $('#pvFrame').src = demoUrls.get(id);
      setPreviewMode('run');
    } else {
      $('#pvMode').hidden = true;
      $('#pvFrame').srcdoc = `<div style="font:16px/1.7 -apple-system,sans-serif;padding:24px;color:#1a1a18"><h2>${spec.label}</h2><p>ไฟล์ Office ต้องเปิดใน ${id === 'pptx' ? 'Keynote / PowerPoint' : id === 'docx' ? 'Pages / Word' : 'Numbers / Excel'}</p><p>กด <b>ดาวน์โหลด</b> แล้วเปิดจากแอป Files บน iPhone</p></div>`;
      setPreviewMode('run');
    }
  } catch(e) {
    if (seq === previewSeq && $('#pvWrap').classList.contains('on'))
      $('#pvFrame').srcdoc = `<p style="font:16px sans-serif;padding:20px">สร้างไฟล์ไม่สำเร็จ: ${escapeHTML(e.message || String(e))}</p>`;
  }
}

/* ─────────── sheets ─────────── */
const open$  = sel => { $(sel).classList.add('on'); document.body.style.overflow = 'hidden'; };
const close$ = sel => $(sel).classList.remove('on');
$$('[data-close]').forEach(b => b.onclick = () => b.closest('.sheet-wrap').classList.remove('on'));

/* ─────────── rail ─────────── */
const railOpen  = () => { $('#rail').classList.add('open'); $('#scrim').classList.add('on'); };
const railClose = () => { $('#rail').classList.remove('open'); $('#scrim').classList.remove('on'); };
$('#btnMenu').onclick = railOpen;
$('#scrim').onclick = railClose;
$('#btnTheme2').onclick = flipTheme;

function newChat() {
  const c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title:'บทสนทนาใหม่', messages:[], ts: Date.now() };
  chats.unshift(c); curId = c.id; saveChats(); drawRail(); drawThread(); railClose();
}
function drawRail() {
  const list = $('#chatList'); list.innerHTML = '';
  $('#convCount').textContent = String(chats.length).padStart(2, '0');
  if (!chats.length) { list.append(h('div', 'empty-rail', 'ยังไม่มีบทสนทนา')); return; }
  chats.forEach((c, i) => {
    const row = h('div', 'conv' + (c.id === curId ? ' on' : ''));
    row.append(h('span', 'idx', String(i + 1).padStart(2, '0')));
    const body = h('div', 'body');
    body.append(h('div', 'nm', c.title || 'บทสนทนาใหม่'));
    body.append(h('div', 'meta', `${c.messages.length} ข้อความ · ${when(c.ts)}`));
    body.onclick = () => { curId = c.id; drawRail(); drawThread(); railClose(); };
    const acts = h('div', 'acts');
    const ren = h('button'); ren.innerHTML = I.pen; ren.title = 'เปลี่ยนชื่อ';
    ren.onclick = e => { e.stopPropagation(); const n = prompt('ชื่อบทสนทนา', c.title); if (n && n.trim()) { c.title = n.trim().slice(0, 60); saveChats(); drawRail(); head(); } };
    const del = h('button'); del.innerHTML = I.trash; del.title = 'ลบ';
    del.onclick = e => {
      e.stopPropagation();
      if (!confirm('ลบ "' + (c.title || '') + '" ?')) return;
      chats = chats.filter(x => x.id !== c.id);
      if (curId === c.id) curId = chats[0]?.id || null;
      saveChats(); drawRail(); drawThread();
    };
    acts.append(ren, del);
    row.append(body, acts); list.append(row);
  });
}
function when(ts) {
  if (!ts) return '—';
  const d = new Date(ts), n = new Date();
  if (d.toDateString() === n.toDateString()) return d.toTimeString().slice(0, 5);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/* ─────────── header ─────────── */
function head() {
  $('#hTitle').textContent = chat()?.title || 'บทสนทนาใหม่';
  const btn = $('#modelBtn');
  btn.querySelector('.nm').textContent = M().label;
  btn.querySelector('.st').classList.toggle('live', cfg.provider === 'demo' || !!keys[cfg.provider]);
  const m = M();
  const show = m.think === 'opt';
  $('#btnReason').style.display = show ? '' : 'none';
  if (show) $('#reasonVal').textContent = (LEVELS.find(l => l.v === cfg.level) || LEVELS[1]).th;
  $('#btnSearch').style.display = cfg.provider === 'demo' ? 'none' : '';
  $('#btnSearch').classList.toggle('on', !!cfg.search);
  $('#hintKey').textContent = cfg.enter ? '⏎ ส่ง' : '';
}

/* ─────────── thread ─────────── */
function drawThread() {
  const box = $('#msgs'); box.innerHTML = ''; head();
  const c = chat();
  if (!c || !c.messages.length) { box.append(blankState()); return; }
  c.messages.forEach((m, i) => box.append(turnEl(m, i)));
  jump(true);
}
function blankState() {
  const w = h('div', 'blank');
  const t = h('h2', 'k'); t.innerHTML = 'ถามอะไร<i>ก็ได้</i>';
  w.append(t);
  if (cfg.provider === 'demo') {
    t.innerHTML = 'Kiln <i>Test Lab</i>';
    w.append(h('p', 'sub', 'ลองพิมพ์ 1 เพื่อรับ PDF, 1.1 สำหรับ PowerPoint หรือ 2 เพื่อรับ ZIP รวมทุกไฟล์ ไม่ต้องใส่ API Key'));
    const seeds = h('div', 'seeds');
    [['01','PDF ตัวอย่าง','1'], ['02','PowerPoint ตัวอย่าง','1.1'],
      ['03','ZIP รวมทุกนามสกุล','2'], ['04','โปรเจกต์เว็บ 3 ไฟล์','3'],
      ['05','แนบไฟล์ / ZIP เพื่อทดสอบการอ่านไฟล์','@attach']].forEach(([n,label,command]) => {
        const s = h('button', 'seed'); s.append(h('span', 'n', n), h('span', 't', label));
        const a = h('span', 'ar'); a.innerHTML = I.arrow; s.append(a);
        s.onclick = () => {
          if (command === '@attach') { $('#fileIn').click(); return; }
          $('#ta').value = command; grow(); syncSend(); $('#ta').focus();
        };
        seeds.append(s);
      });
    w.append(seeds);
    return w;
  }
  w.append(h('p', 'sub', keys[cfg.provider]
    ? `พร้อมใช้งานกับ ${P().name} · ${M().label} — บทสนทนาทั้งหมดอยู่ในเครื่องนี้เท่านั้น`
    : `ยังไม่ได้ใส่กุญแจของ ${P().name} — เปิดหน้าตั้งค่าเพื่อเริ่มต้น`));
  if (!keys[cfg.provider]) {
    const b = h('button', 'b solid');
    b.style.cssText = 'max-width:210px;margin:0 0 30px';
    b.textContent = 'ใส่กุญแจเพื่อเริ่มต้น';
    b.onclick = openSettings; w.append(b);
    const test = h('button', 'note', 'หรือทดลอง Test Lab โดยไม่ใช้ Key  →');
    test.style.cssText = 'display:block;margin:-19px 0 27px;text-align:left;color:var(--accent)';
    test.onclick = () => { cfg.provider = 'demo'; saveCfg(); drawThread(); };
    w.append(test);
  }
  const seeds = h('div', 'seeds');
  [['อธิบายเรื่องที่ซับซ้อนให้เข้าใจง่าย', 'อธิบาย transformer แบบที่เด็ก ม.ปลาย เข้าใจได้ ใช้การเปรียบเทียบ'],
   ['โปรเจกต์หลายไฟล์ + ZIP', 'สร้างเว็บเพจมินิมอล 3 ไฟล์: index.html, styles.css, app.js สำหรับพอร์ตโฟลิโอส่วนตัว ส่งแต่ละไฟล์ใน code fence คนละอัน พร้อมชื่อไฟล์'],
   ['ออกแบบหน้าเว็บหนึ่งหน้า', 'สร้างหน้าเว็บ HTML ไฟล์เดียวสำหรับร้านกาแฟเล็ก ๆ สไตล์มินิมอล ใช้ฟอนต์ serif'],
   ['สรุปเป็นตารางเปรียบเทียบ', 'เปรียบเทียบข้อดีข้อเสียของการเช่ากับการซื้อบ้านในกรุงเทพ เป็นตาราง']
  ].forEach(([label, prompt], i) => {
    const s = h('button', 'seed');
    s.append(h('span', 'n', String(i + 1).padStart(2, '0')), h('span', 't', label));
    const a = h('span', 'ar'); a.innerHTML = I.arrow; s.append(a);
    s.onclick = () => { $('#ta').value = prompt; grow(); syncSend(); $('#ta').focus(); };
    seeds.append(s);
  });
  w.append(seeds);
  return w;
}
function turnEl(m, idx) {
  if (m.role === 'user') {
    const t = h('div', 'turn u'), col = h('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;max-width:100%';
    if (m.attachments?.length) {
      const f = h('div', 'files');
      displayAttachments(m.attachments).forEach(a => {
        const tag = h(a.type === 'zip' ? 'button' : 'span', 'file-tag' + (a.type === 'zip' ? ' zip' : ''));
        if (a.type === 'image') { const im = h('img'); im.src = a.dataUrl; im.alt = ''; tag.append(im); }
        else tag.append(h('span', 'kind', attKind(a)));
        tag.append(document.createTextNode(attLabel(a)));
        if (a.type === 'zip') { tag.title = 'ดูไฟล์ใน ZIP'; tag.onclick = () => openZipSheet(a); }
        f.append(tag);
      });
      col.append(f);
    }
    if (m.content?.trim()) col.append(h('div', 'box', m.content));
    t.append(col); return t;
  }
  const t = h('div', 'turn a');
  const who = h('div', 'who');
  who.innerHTML = `<span class="nm">${m.error ? 'เกิดข้อผิดพลาด' : 'คำตอบ'} · <b>${escapeHTML(m.model || '')}</b></span><span class="line"></span>`;
  t.append(who);
  if (m.queries?.length) t.append(seekEl(m.queries, false));
  if (m.reasoning?.trim()) t.append(thinkEl(m.reasoning, false));
  if (m.error) {
    const f = h('div', 'fail'); f.innerHTML = '<b>ส่งคำขอไม่สำเร็จ</b>';
    f.append(document.createTextNode(m.content)); t.append(f);
  } else {
    const files = renderAssistantBody(t, m.content || '');
    if (m.demoFiles?.length) t.append(buildDemoFileSet(m.demoFiles, !!m.demoZip));
    const acts = h('div', 'turn-acts');
    const mk = (ic, label, fn) => { const b = h('button'); b.innerHTML = ic + '<span>' + label + '</span>'; b.onclick = fn; return b; };
    acts.append(mk(I.copy, 'คัดลอก', () => copy(m.content)));
    acts.append(mk(I.down, 'บันทึก .md', () => save(m.content, `kiln-${stamp()}.md`, 'text/markdown')));
    if (files.length > 1) acts.append(mk(I.down, 'ZIP ทั้งหมด', () => downloadZip(files, `project-${stamp()}.zip`)));
    else if (files.length === 1) acts.append(mk(I.down, 'ดาวน์โหลดไฟล์', () => save(files[0].content, files[0].name.split('/').pop())));
    acts.append(mk(I.redo, 'ตอบใหม่', () => regen(idx)));
    t.append(acts);
  }
  if (m.sources?.length) t.append(citeEl(m.sources));
  return t;
}
function citeEl(sources) {
  const w = h('div', 'cites');
  sources.slice(0, 8).forEach(s => {
    const a = h('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = s.title || s.url;
    w.append(a);
  });
  return w;
}
function thinkEl(text, live) {
  const d = h('details', 'think' + (live ? ' live' : ''));
  const s = h('summary');
  s.innerHTML = (live ? '<span class="dotp"></span>' : '') + `<span>${live ? 'กำลังคิด' : 'กระบวนการคิด'}</span><span class="chev">${I.chev}</span>`;
  const inner = h('div', 'inner', text);
  d.append(s, inner); d.open = live;
  return d;
}
function seekEl(queries, live) {
  const d = h('details', 'think' + (live ? ' live' : ''));
  const s = h('summary');
  s.innerHTML = (live ? '<span class="dotp"></span>' : '') + `<span>${live ? 'กำลังค้นเว็บ' : 'ค้นจากเว็บ'}</span><span class="chev">${I.chev}</span>`;
  const inner = h('div', 'inner', (queries || []).filter(Boolean).join('\n'));
  d.append(s, inner); d.open = live;
  return d;
}
const escapeHTML = s => (s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
function jump(force) {
  const s = $('#scroller');
  if (force || s.scrollHeight - s.scrollTop - s.clientHeight < 260) s.scrollTop = s.scrollHeight;
}

/* ─────────── attachments ───────────
   1 ZIP = 1 ไฟล์แนบ (เก็บรายการไฟล์ไว้ข้างใน) — ไม่แตกออกมาเป็นชิปหลายสิบอันแบบเดิม */
const MAX_ATT = 30;                          // จำนวนชิ้นในช่องพิมพ์ (ZIP นับเป็น 1)
const TEXT_BUDGET = 300000;                  // ตัวอักษรรวมต่อข้อความ — กันบริบทล้น และกัน localStorage เต็ม
const FILE_CAP = 100000;                     // ตัวอักษรสูงสุดต่อไฟล์
const ZIP_MAX_BYTES = 25 * 1024 * 1024, ZIP_MAX_ENTRIES = 500;
const IMG_MAX_SIDE = 1600, IMG_KEEP_BYTES = 900000;
const OFFICE_EXTS = /\.(docx|pptx|xlsx)$/i;
const BINARY_EXTS = /\.(png|jpe?g|gif|webp|heic|heif|bmp|ico|tiff?|pdf|zip|rar|7z|gz|tgz|tar|woff2?|ttf|otf|eot|mp[34]|m4a|aac|wav|mov|avi|mkv|exe|dll|so|dylib|bin|psd|ai|sketch|fig|key|pages|numbers|sqlite|db|jar|class|wasm)$/i;
const ZIP_JUNK = /(^|\/)(__MACOSX|node_modules|__pycache__|\.git|\.next|\.nuxt|\.venv|venv|\.idea|\.vscode)(\/|$)|(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$|(^|\/)\._/i;
const ZIP_SECRET = /(^|\/)(\.env(\.(?!example$|sample$)[^/]*)?|id_rsa|id_ed25519|[^/]*\.pem)$/i;
const extOf = name => ((String(name).split('/').pop().match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
const attChars = a => a.type === 'text' ? (a.text || '').length
  : a.type === 'zip' ? (a.files || []).reduce((n, f) => n + (f.text || '').length, 0) : 0;
const pendingChars = () => pending.reduce((n, a) => n + attChars(a), 0);
const thaiMsg = (err, fallback) => (err && /[\u0E00-\u0E7F]/.test(err.message || '')) ? err.message : fallback;

$('#btnAtt').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = async e => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    if (pending.length >= MAX_ATT) { toast('แนบได้สูงสุด ' + MAX_ATT + ' ชิ้น'); break; }
    try {
      const att = await readAttachment(f);
      if (att) pending.push(att);
    } catch (err) { toast(thaiMsg(err, 'เปิดไฟล์ไม่ได้: ' + f.name)); }
    drawAtt();
  }
  syncSend();
};
async function readAttachment(f) {
  const name = f.name || 'file';
  if (/\.zip$/i.test(name) || /^application\/(x-)?zip(-compressed)?$/i.test(f.type)) return readZip(f, name);
  if (/^image\//i.test(f.type) && !/svg/i.test(f.type)) return readImage(f);      // SVG = ข้อความ (API vision ไม่รับ SVG)
  if (OFFICE_EXTS.test(name)) return withText({ type:'text', name, office:true }, await officeText(f, name));
  if (BINARY_EXTS.test(name) || f.size > 5 * 1024 * 1024) return binaryNote(f);
  const text = await f.text();
  if (text.slice(0, 8000).includes('\u0000')) return binaryNote(f);
  return withText({ type:'text', name }, text);
}
function withText(att, text) {
  const room = Math.min(FILE_CAP, TEXT_BUDGET - pendingChars());
  if (room <= 0) { toast('ไฟล์แนบรวมยาวเกินที่ส่งได้ — ข้าม ' + att.name); return null; }
  if (text.length > room) { att.cut = true; toast('ไฟล์ยาว ส่งเฉพาะช่วงแรก: ' + att.name); }
  att.text = text.slice(0, room);
  att.size = text.length;
  return att;
}
function binaryNote(f) {
  toast('แนบได้เฉพาะชื่อไฟล์: ' + f.name);
  return { type:'text', name:f.name, meta:true,
    text:`[ไฟล์ ${f.name} · ${byteSize(f.size)} · ${f.type || 'ไม่ทราบชนิด'}]\nแอปยังอ่านเนื้อหาไฟล์ชนิดนี้ไม่ได้ จึงส่งให้ AI เฉพาะชื่อและขนาด` };
}
const asDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const loadImage = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('เปิดรูปไม่ได้')); im.src = src; });
/* รูปจาก iPhone ใหญ่หลาย MB — ย่อเหลือด้านยาว 1600px ก่อนเก็บ ไม่งั้น localStorage เต็มแล้วแชทไม่ถูกบันทึก */
async function readImage(f) {
  const raw = await asDataURL(f);
  const direct = /^image\/(png|jpe?g|gif|webp)$/i.test(f.type);
  let im = null;
  try { im = await loadImage(raw); } catch {}
  if (!im) { if (direct) return { type:'image', name:f.name, mime:f.type, dataUrl:raw }; throw new Error('เปิดรูปนี้ไม่ได้: ' + f.name); }
  const scale = Math.min(1, IMG_MAX_SIDE / Math.max(im.naturalWidth || 1, im.naturalHeight || 1));
  if (direct && scale === 1 && f.size <= IMG_KEEP_BYTES) return { type:'image', name:f.name, mime:f.type, dataUrl:raw };
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(im.naturalWidth * scale));
  cv.height = Math.max(1, Math.round(im.naturalHeight * scale));
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('ย่อรูปไม่ได้: ' + f.name);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(im, 0, 0, cv.width, cv.height);
  return { type:'image', name:f.name.replace(/\.[^.]+$/, '') + '.jpg', mime:'image/jpeg', dataUrl:cv.toDataURL('image/jpeg', .86), resized:true };
}
async function readZip(file, name = file.name || 'archive.zip') {
  if (!window.JSZip) throw new Error('ยังโหลดตัวเปิด ZIP ไม่ได้ — ต่อเน็ตแล้วลองใหม่');
  if (file.size > ZIP_MAX_BYTES) throw new Error(`ZIP ใหญ่เกิน ${ZIP_MAX_BYTES / 1048576} MB`);
  toast('กำลังเปิด ' + name + '…');
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter(e => !e.dir).sort((a, b) => a.name.localeCompare(b.name));
  const z = { type:'zip', name, size:file.size, total:0, ignored:0, more:0, files:[], skipped:[] };
  let room = TEXT_BUDGET - pendingChars();
  const skip = (path, reason) => z.skipped.push({ name:path, reason });
  const take = (path, text, extra) => {
    if (room <= 0) return skip(path, 'เกินขนาดรวมที่ส่งได้');
    const cap = Math.min(FILE_CAP, room), cut = text.length > cap;
    const body = cut ? text.slice(0, cap) : text;
    room -= body.length;
    if (cut) z.truncated = true;
    z.files.push(Object.assign({ name:path, text:body, size:text.length, cut }, extra));
  };
  for (const e of entries) {
    const path = safePath(e.name);
    if (ZIP_JUNK.test(path)) { z.ignored++; continue; }          // __MACOSX, node_modules, .git ฯลฯ
    if (++z.total > ZIP_MAX_ENTRIES) { z.more++; continue; }
    if (ZIP_SECRET.test(path)) { skip(path, 'ไฟล์ลับ — ไม่ส่งเพื่อความปลอดภัย'); continue; }
    try {
      if (OFFICE_EXTS.test(path)) take(path, await officeText(await e.async('arraybuffer'), path), { office:true });
      else if (BINARY_EXTS.test(path)) skip(path, 'ไฟล์ไบนารี/รูปภาพ');
      else if ((e._data && e._data.uncompressedSize) > 3 * 1024 * 1024) skip(path, 'ไฟล์ใหญ่เกิน');
      else {
        const text = await e.async('string');
        if (text.slice(0, 8000).includes('\u0000')) skip(path, 'ไฟล์ไบนารี');
        else take(path, text);
      }
    } catch { skip(path, 'อ่านไม่ได้'); }
  }
  if (!z.total) throw new Error('ZIP นี้ว่าง หรือมีแต่ไฟล์ระบบ');
  toast(`${name}: อ่านได้ ${z.files.length}/${z.total} ไฟล์${z.skipped.length ? ` · ข้าม ${z.skipped.length}` : ''}`);
  return z;
}

/* ดึงข้อความจาก Word / PowerPoint / Excel (ข้างในเป็น ZIP ของ XML) */
const xmlText = s => s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (m, k) => {
  const key = k.toLowerCase();
  const named = { lt:'<', gt:'>', amp:'&', quot:'"', apos:"'" }[key];
  if (named) return named;
  try { return String.fromCodePoint(key[1] === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10)); } catch { return m; }
});
const xmlRuns = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, 'g'))].map(m => xmlText(m[1])).join('');
const xmlParagraphs = (xml, p, t) => xml.split(`</${p}>`).map(chunk => xmlRuns(chunk, t)).filter(s => s.trim());
async function officeText(data, name) {
  if (!window.JSZip) throw new Error('ยังโหลดตัวอ่านไฟล์ Office ไม่ได้');
  const zip = await JSZip.loadAsync(data);
  const read = path => zip.file(path) ? zip.file(path).async('string') : Promise.resolve('');
  const num = p => Number((p.match(/(\d+)\.xml$/) || [0, 0])[1]);
  const listed = re => Object.keys(zip.files).filter(n => re.test(n)).sort((a, b) => num(a) - num(b));
  const ext = extOf(name);
  let out = '';
  if (ext === 'docx') {
    const xml = (await read('word/document.xml')).replace(/<w:tab\/>/g, '<w:t>\t</w:t>').replace(/<w:(br|cr)\/>/g, '<w:t>\n</w:t>');
    out = xmlParagraphs(xml, 'w:p', 'w:t').join('\n');
  } else if (ext === 'pptx') {
    const slides = listed(/^ppt\/slides\/slide\d+\.xml$/), parts = [];
    for (let i = 0; i < slides.length; i++) parts.push(`--- สไลด์ ${i + 1} ---\n` + xmlParagraphs(await read(slides[i]), 'a:p', 'a:t').join('\n'));
    out = parts.join('\n\n');
  } else if (ext === 'xlsx') {
    const shared = [...(await read('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => xmlRuns(m[1], 't'));
    const sheets = listed(/^xl\/worksheets\/sheet\d+\.xml$/), parts = [];
    for (let i = 0; i < sheets.length; i++) {
      const rows = [...(await read(sheets[i])).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].slice(0, 1000).map(r =>
        [...r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(c => {
          const type = (c[1].match(/\bt="([^"]+)"/) || [])[1], inner = c[2] || '';
          if (type === 'inlineStr') return xmlRuns(inner, 't');
          const v = (inner.match(/<v>([^<]*)<\/v>/) || [])[1] || '';
          if (type === 's') return shared[Number(v)] ?? '';
          if (type === 'b') return v === '1' ? 'TRUE' : 'FALSE';
          return xmlText(v);
        }).join('\t'));
      parts.push(`--- ชีต ${i + 1} ---\n` + rows.join('\n'));
    }
    out = parts.join('\n\n');
  } else throw new Error('ไม่รองรับไฟล์ชนิดนี้');
  return out.trim() || '(ไม่พบข้อความในไฟล์นี้)';
}

/* ─────────── attachment display ─────────── */
const attLabel = a => a.type === 'zip' ? `${a.name} · ${a.total} ไฟล์` : a.name;
const attKind = a => a.type === 'zip' ? 'ZIP' : (extOf(a.name) || 'file').slice(0, 4);
/* ข้อความเก่า (ก่อนแก้บั๊ก) ที่แตก ZIP เป็นหลายไฟล์ — รวมกลับเป็นป้ายเดียวตอนแสดง */
function displayAttachments(list) {
  const out = [], legacy = new Map();
  for (const a of list || []) {
    if (a.type === 'text' && a.fromZip) {
      let z = legacy.get(a.fromZip);
      if (!z) { z = { type:'zip', name:a.fromZip, total:0, files:[], skipped:[] }; legacy.set(a.fromZip, z); out.push(z); }
      z.files.push({ name:a.name, text:a.text || '', size:(a.text || '').length }); z.total++;
    } else out.push(a);
  }
  return out;
}
function drawAtt() {
  const row = $('#attRow'); row.innerHTML = '';
  pending.forEach((a, i) => {
    const c = h('div', 'chip' + (a.type === 'zip' ? ' zip' : ''));
    if (a.type === 'image') { const im = h('img'); im.src = a.dataUrl; im.alt = ''; c.append(im); }
    else c.append(h('span', 'kind', attKind(a)));
    c.append(h('span', 'n', attLabel(a)));
    if (a.type === 'zip') {
      c.setAttribute('role', 'button'); c.tabIndex = 0; c.title = 'ดูไฟล์ใน ZIP';
      c.onclick = () => openZipSheet(a);
      c.onkeydown = ev => { if (ev.target === c && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openZipSheet(a); } };
    }
    const x = h('button', 'x'); x.innerHTML = I.x; x.setAttribute('aria-label', 'เอาออก ' + a.name);
    x.onclick = ev => { ev.stopPropagation(); pending.splice(i, 1); drawAtt(); syncSend(); };
    c.append(x); row.append(c);
  });
  if (pending.some(a => a.type === 'image') && !M().vision) {
    row.append(h('span', 'note', 'โมเดลนี้ไม่รับรูปภาพ — ลองเปลี่ยนโมเดล'));
  }
}
function openZipSheet(z) {
  $('#zipTitle').textContent = z.name;
  const bits = [`${z.total} ไฟล์`, `ส่งเนื้อหาให้ AI ${z.files.length} ไฟล์`];
  if (z.skipped?.length) bits.push(`ข้าม ${z.skipped.length}`);
  if (z.more) bits.push(`ไม่ได้อ่านอีก ${z.more}`);
  if (z.ignored) bits.push(`ซ่อนไฟล์ระบบ ${z.ignored}`);
  $('#zipSummary').textContent = bits.join(' · ') + (z.truncated ? ' — บางไฟล์ยาวเกิน จึงส่งเฉพาะช่วงแรก' : '');
  const list = $('#zipList'); list.innerHTML = '';
  const all = z.files.map(f => {
    const lang = f.office ? 'text' : langFromName(f.name);
    return { name:f.name, content:f.text || '', lang, runnable:!f.office && isHtmlish(lang, f.text, f.name) };
  });
  z.files.forEach((f, i) => {
    const o = h('button', 'opt zrow'), t = h('div', 't');
    t.append(h('b', null, f.name), h('span', null,
      `${f.office ? 'ข้อความจาก Office' : all[i].lang} · ${byteSize(f.size ?? (f.text || '').length)}${f.cut ? ' · ส่งช่วงแรก' : ''}${all[i].runnable ? ' · รันได้' : ''}`));
    const go = h('span', 'tick'); go.style.cssText = 'opacity:1;color:var(--ink-4)'; go.innerHTML = I.chev;
    o.append(t, go);
    o.onclick = () => openFilePreview(all[i], all, all[i].runnable ? 'run' : 'code');
    list.append(o);
  });
  (z.skipped || []).forEach(s => {
    const o = h('div', 'opt zrow skip'), t = h('div', 't');
    t.append(h('b', null, s.name), h('span', null, s.reason));
    o.append(t); list.append(o);
  });
  if (!z.files.length && !(z.skipped || []).length) list.append(h('p', 'note', 'ไม่มีไฟล์ที่แสดงได้'));
  open$('#shZip');
}

/* ─────────── payload builders (pure, testable) ─────────── */
/* ถ้าในไฟล์มี ``` อยู่แล้ว ใช้ fence ที่ยาวกว่า ไม่งั้นบล็อกโค้ดใน prompt จะขาดกลางทาง */
function fenceFor(text) {
  const longest = (String(text).match(/`{3,}/g) || []).reduce((n, run) => Math.max(n, run.length), 0);
  return '`'.repeat(Math.max(3, longest + 1));
}
function fileBlock(name, text, note = '', lang = langFromName(name)) {
  const f = fenceFor(text);
  return `### file: ${name}${note}\n${f}${lang && lang !== 'text' ? lang : ''}\n${text}\n${f}`;
}
function flatten(m) {
  let t = m.content || '';
  const atts = m.attachments || [];
  const texts = atts.filter(a => a.type === 'text'), zips = atts.filter(a => a.type === 'zip');
  const noteOf = f => (f.fromZip ? ` (from ${f.fromZip})` : '') + (f.office ? ' (ข้อความที่ดึงจากไฟล์ Office)' : '') + (f.cut ? ' (ส่งเฉพาะช่วงแรก)' : '');
  const langOf = f => (f.office || f.meta) ? 'text' : langFromName(f.name);
  const parts = [];
  if (texts.length) parts.push(`## ไฟล์ที่แนบมา (${texts.length})\n` + texts.map(a => fileBlock(a.name, a.text || '', noteOf(a), langOf(a))).join('\n\n'));
  zips.forEach(z => {
    const tree = z.files.map(f => '- ' + f.name + (f.cut ? '  (ตัดบางส่วน)' : ''))
      .concat((z.skipped || []).map(s => `- ${s.name}  [ไม่ได้แนบ: ${s.reason}]`));
    if (z.more) tree.push(`- …และอีก ${z.more} ไฟล์ที่ไม่ได้อ่าน`);
    parts.push(`## ZIP: ${z.name} — ${z.total} ไฟล์ (แนบเนื้อหา ${z.files.length} ไฟล์)\nโครงสร้าง:\n${tree.join('\n')}` +
      (z.files.length ? '\n\n' + z.files.map(f => fileBlock(f.name, f.text || '', noteOf(f), langOf(f))).join('\n\n') : ''));
  });
  if (parts.length) t += '\n\n' + parts.join('\n\n');
  return t.trim() || '(ไฟล์แนบ)';
}
function buildOpenAI(msgs, vision, sys, wire) {
  const out = [];
  if (sys) out.push({ role:'system', content: sys });
  for (const m of msgs) {
    if (m.error) continue;
    if (m.role === 'user') {
      const imgs = (m.attachments || []).filter(a => a.type === 'image');
      if (imgs.length && vision) out.push({ role:'user', content: [{ type:'text', text: flatten(m) }, ...imgs.map(a => ({ type:'image_url', image_url:{ url:a.dataUrl } }))] });
      else out.push({ role:'user', content: flatten(m) });
    } else {
      const a = { role:'assistant', content: m.content || '' };
      /* DeepSeek V4 โหมดคิดบังคับให้ส่ง reasoning_content กลับทุกครั้ง ไม่งั้นตอบ 400
         (แม้จะเป็นสตริงว่าง) — อ้างอิง api-docs.deepseek.com/guides/thinking_mode */
      if (wire === 'deepseek') a.reasoning_content = m.reasoning || '';
      out.push(a);
    }
  }
  return out;
}
function buildAnthropic(msgs, vision) {
  return msgs.filter(m => !m.error).map(m => {
    if (m.role === 'user') {
      const parts = [];
      if (vision) (m.attachments || []).filter(a => a.type === 'image')
        .forEach(a => parts.push({ type:'image', source:{ type:'base64', media_type: a.mime || 'image/jpeg', data: String(a.dataUrl).split(',')[1] } }));
      parts.push({ type:'text', text: flatten(m) });
      return { role:'user', content: parts };
    }
    return { role:'assistant', content: [{ type:'text', text: m.content || ' ' }] };
  });
}
function buildGemini(msgs, vision) {
  return msgs.filter(m => !m.error).map(m => {
    if (m.role === 'user') {
      const parts = [];
      if (vision) (m.attachments || []).filter(a => a.type === 'image')
        .forEach(a => parts.push({ inlineData:{ mimeType: a.mime || 'image/jpeg', data: String(a.dataUrl).split(',')[1] } }));
      parts.push({ text: flatten(m) });
      return { role:'user', parts };
    }
    return { role:'model', parts:[{ text: m.content || ' ' }] };
  });
}
/* reasoning → per-provider params (pure, testable) */
function reasonParams(wire, model, level) {
  const supported = model.think === 'opt';
  if (!supported) return {};
  if (level === 'off' && !model.off) level = 'auto';
  switch (wire) {
    case 'openai':
      if (level === 'auto') return {};
      return { reasoning_effort: level === 'off' ? 'none' : level };
    case 'openrouter':
      if (level === 'auto') return {};
      return level === 'off' ? { reasoning:{ enabled:false } } : { reasoning:{ effort: level } };
    case 'anthropic':
      if (level === 'auto' || level === 'off') return {};
      return { thinking:{ type:'enabled', budget_tokens: ANTHROPIC_BUDGET[level] } };
    case 'gemini': {
      /* Gemini 3 ใช้ thinkingLevel (low/high) แทน budget และปิดการคิดไม่ได้สนิท */
      if (model.tlevel) {
        if (level === 'auto') return {};
        if (level === 'off') return { thinkingConfig:{ thinkingLevel:'low' } };
        return { thinkingConfig:{ thinkingLevel: level === 'low' ? 'low' : 'high' } };
      }
      if (level === 'auto') return { thinkingConfig:{ includeThoughts:true, thinkingBudget:-1 } };
      if (level === 'off') return { thinkingConfig:{ includeThoughts:false, thinkingBudget:0 } };
      return { thinkingConfig:{ includeThoughts:true, thinkingBudget: GEMINI_BUDGET[level] } };
    }
    case 'deepseek':
      if (level === 'auto') return {};
      if (level === 'off') return { thinking:{ type:'disabled' } };
      return { thinking:{ type:'enabled' }, reasoning_effort: DEEPSEEK_EFFORT[level] };
    default: return {};
  }
}

/* ─────────── SSE parser (pure, testable) ─────────── */
class SSE {
  constructor() { this.buf = ''; this.curEvent = ''; }
  push(chunk) {
    this.buf += chunk;
    const out = [];
    let i;
    while ((i = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, i).replace(/\r$/, '');
      this.buf = this.buf.slice(i + 1);
      if (!line) { this.curEvent = ''; continue; }
      if (line[0] === ':') continue;
      if (line.startsWith('event:')) { this.curEvent = line.slice(6).trim(); continue; }
      if (line.startsWith('data:')) {
        const d = line.slice(5).trim();
        if (d === '[DONE]') { out.push({ done:true }); continue; }
        try { out.push({ event: this.curEvent, data: JSON.parse(d) }); } catch { /* partial / non-json */ }
      }
    }
    return out;
  }
}
async function pump(res, onData) {
  const reader = res.body.getReader(), dec = new TextDecoder(), p = new SSE();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const ev of p.push(dec.decode(value, { stream:true }))) {
      if (ev.done) return;
      onData(ev.data, ev.event);
    }
  }
}

/* ─────────── web search (browser-side, no backend) ─────────── */
const SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the public web for current information, news, prices, docs, or facts after your knowledge cutoff. Call this before answering time-sensitive questions.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query. Use the language of the sources you want.' } },
      required: ['query']
    }
  }
};
function formatSearchResults(blocks) {
  if (!blocks?.length) return 'No search results.';
  return blocks.map((b, i) => `${i + 1}. ${b.title || 'untitled'}\n   ${b.url || ''}\n   ${b.snippet || ''}`).join('\n\n');
}
function withTimeout(parent, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  if (parent) {
    if (parent.aborted) { clearTimeout(t); c.abort(); }
    else parent.addEventListener('abort', () => { clearTimeout(t); c.abort(); }, { once:true });
  }
  return c.signal;
}
async function wikiSearch(lang, q, signal) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=1&format=json&origin=*&srlimit=4`;
  const r = await apiFetch(url, { signal });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.query?.search || []).map(s => ({
    title: s.title,
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(s.title).replace(/ /g, '_'))}`,
    snippet: String(s.snippet || '').replace(/<[^>]+>/g, '')
  }));
}
async function ddgSearch(q, signal) {
  const r = await apiFetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, { signal });
  if (!r.ok) return [];
  const j = await r.json();
  const out = [];
  if (j.AbstractText) out.push({ title: j.Heading || q, url: j.AbstractURL, snippet: j.AbstractText });
  const walk = items => (items || []).forEach(t => {
    if (t.Text && t.FirstURL) out.push({ title: t.Text.split(' - ')[0], url: t.FirstURL, snippet: t.Text });
    if (t.Topics) walk(t.Topics);
  });
  walk(j.RelatedTopics);
  return out.slice(0, 6);
}
async function jinaSearch(q, signal) {
  const headers = { Accept: 'application/json' };
  if (keys.jina) headers.Authorization = 'Bearer ' + keys.jina;
  const r = await apiFetch('https://s.jina.ai/?q=' + encodeURIComponent(q), { headers, signal });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j.data || j.results || (Array.isArray(j) ? j : []);
  return arr.slice(0, 6).map(x => ({ title: x.title, url: x.url, snippet: x.description || x.content || '' }));
}
async function tavilySearch(q, signal) {
  const r = await apiFetch('https://api.tavily.com/search', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: keys.tavily, query: q, max_results: 5, include_answer: true })
  });
  if (!r.ok) return [];
  const j = await r.json();
  const out = (j.results || []).map(x => ({ title: x.title, url: x.url, snippet: x.content }));
  if (j.answer) out.unshift({ title: 'Tavily', url: '', snippet: j.answer });
  return out;
}
async function readPage(url, signal) {
  const r = await apiFetch('https://r.jina.ai/' + url, { signal, headers: { Accept: 'text/plain' } });
  if (!r.ok) return '';
  return (await r.text()).slice(0, 4500);
}
async function doSearch(query, signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const q = String(query || '').trim().slice(0, 200);
  if (!q) return { text: 'Empty query', sources: [] };
  const tsig = withTimeout(signal, 14000);
  const blocks = [];
  const seen = new Set();
  const add = arr => (arr || []).forEach(b => {
    if (!b) return;
    const k = b.url || b.title;
    if (!k || seen.has(k)) return;
    seen.add(k); blocks.push(b);
  });
  const jobs = [wikiSearch('th', q, tsig), wikiSearch('en', q, tsig), ddgSearch(q, tsig)];
  if (keys.jina) jobs.push(jinaSearch(q, tsig));
  if (keys.tavily) jobs.push(tavilySearch(q, tsig));
  const settled = await Promise.allSettled(jobs);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  settled.forEach(s => { if (s.status === 'fulfilled') add(s.value); });
  const pages = [];
  for (const b of blocks.filter(x => x.url && /^https?:/i.test(x.url)).slice(0, 2)) {
    try {
      const body = await readPage(b.url, withTimeout(signal, 9000));
      if (body) pages.push({ ...b, body });
    } catch {}
  }
  const text = [formatSearchResults(blocks.slice(0, 8)), ...pages.map(p => `\n\n# ${p.title}\n${p.url}\n${p.body}`)].join('');
  return { text: text.slice(0, 16000) || `No results for: ${q}`, sources: blocks.slice(0, 8) };
}
function parseToolArgs(raw) {
  try { return JSON.parse(raw || '{}'); } catch { return { query: String(raw || '') }; }
}

function noop() {}
function pullSources(obj, onSource) {
  if (!obj || !onSource) return;
  const chunks = obj.groundingChunks || obj.grounding_chunks || [];
  chunks.forEach(c => { const w = c.web || c; if (w?.uri || w?.url) onSource({ title: w.title || w.uri || w.url, url: w.uri || w.url }); });
  const anns = obj.annotations || [];
  anns.forEach(a => { const u = a.url || a.url_citation?.url; if (u) onSource({ title: a.title || a.url_citation?.title || u, url: u }); });
}
function buildResponsesInput(msgs, vision) {
  const input = [];
  for (const m of msgs) {
    if (m.error) continue;
    if (m.role === 'user') {
      const imgs = (m.attachments || []).filter(a => a.type === 'image');
      const text = flatten(m);
      if (imgs.length && vision) input.push({ role:'user', content: [{ type:'input_text', text }, ...imgs.map(a => ({ type:'input_image', image_url: a.dataUrl }))] });
      else input.push({ role:'user', content: text });
    } else input.push({ role:'assistant', content: m.content || '' });
  }
  return input;
}

/* ─────────── callProvider — the single network seam ─────────── */
async function callProvider({ provider, model, messages, level, signal, search, onText, onThink, onSearch, onSource }) {
  const prov = provider === cfg.provider ? P() : PROVIDERS[provider];
  const mdef = prov.models.find(m => m.id === model) || { vision:false, think:false };
  const key = keys[provider];
  if (!key) throw new Error(`ยังไม่ได้ใส่กุญแจของ ${prov.name} — เปิดหน้าตั้งค่าก่อน`);
  if (prov.wire === 'compat' && !prov.base) throw new Error('ยังไม่ได้ใส่ API Base URL ของค่ายนี้ — เปิดหน้าตั้งค่า');
  if (prov.wire === 'compat' && !model) throw new Error('ยังไม่ได้ใส่ Model ID ของค่ายนี้ — เปิดหน้าตั้งค่า');
  const extra = reasonParams(prov.wire, mdef, level);
  onText = onText || noop; onThink = onThink || noop; onSearch = onSearch || noop; onSource = onSource || noop;
  // บอกโมเดลให้ส่งหลายไฟล์เป็น fence แยก พร้อมชื่อไฟล์ — แอปจะแปลงเป็นการ์ด + ZIP
  const fileHint = 'When delivering multiple files or a small project, put EACH file in its own markdown fenced code block. Prefer a filename after the language tag, e.g. ```html index.html or ```css styles.css or ```javascript app.js. Never pack many files into one fence. Keep surrounding explanation short.';
  const sys = [cfg.sys, fileHint].filter(Boolean).join('\n\n');

  /* ── OpenAI hosted web_search via Responses API ── */
  if (search && prov.wire === 'openai') {
    try {
      await callOpenAIResponses({ key, model, messages, extra, vision: mdef.vision, signal, onText, onThink, onSearch, onSource, sys });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      /* โมเดลบางตัวยังไม่รับ Responses — ตกลงไปใช้ function calling */
    }
  }

  /* ── OpenAI-compatible wire: openai / deepseek / openrouter ── */
  if (prov.wire === 'openai' || prov.wire === 'deepseek' || prov.wire === 'openrouter' || prov.wire === 'compat') {
    const headers = { 'Content-Type':'application/json', Authorization: 'Bearer ' + key };
    if (prov.wire === 'openrouter') {
      headers['HTTP-Referer'] = location.origin && location.origin !== 'null' ? location.origin : 'https://kiln.local';
      headers['X-Title'] = 'Kiln';
    }
    /* DeepSeek ไม่มีค้นเว็บในตัว — ค้นในเบราว์เซอร์แล้วแนบผลให้โมเดล
       OpenAI (ถ้า Responses ใช้ไม่ได้) ใช้ function calling แล้วค่อย fallback แบบเดียวกัน */
    if (search && prov.wire === 'deepseek') {
      await searchThenStream({ url: prov.base + '/chat/completions', headers, model, messages, extra, vision: mdef.vision, wire: prov.wire, signal, onText, onThink, onSearch, onSource });
      return;
    }
    if (search && prov.wire === 'compat') {
      await searchThenStream({ url: prov.base + '/chat/completions', headers, model, messages, extra, vision: mdef.vision, wire: prov.wire, signal, onText, onThink, onSearch, onSource });
      return;
    }
    if (search && prov.wire === 'openai') {
      try {
        await callCompatToolLoop({ url: prov.base + '/chat/completions', headers, model, messages, extra, vision: mdef.vision, wire: prov.wire, signal, onText, onThink, onSearch, onSource });
      } catch (e) {
        if (e?.name === 'AbortError') throw e;
        await searchThenStream({ url: prov.base + '/chat/completions', headers, model, messages, extra, vision: mdef.vision, wire: prov.wire, signal, onText, onThink, onSearch, onSource });
      }
      return;
    }
    const body = { model, messages: buildOpenAI(messages, mdef.vision, sys, prov.wire), stream:true, ...extra };
    if (!(prov.wire === 'openai' && mdef.think === 'opt')) body.temperature = cfg.temp;
    if (search && prov.wire === 'openrouter') {
      body.tools = [{ type:'openrouter:web_search' }, { type:'openrouter:web_fetch' }];
    }
    let res = await apiFetch(prov.base + '/chat/completions', { method:'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok && search && prov.wire === 'openrouter') {
      delete body.tools;
      body.plugins = [{ id:'web', max_results: 5 }];
      res = await apiFetch(prov.base + '/chat/completions', { method:'POST', headers, body: JSON.stringify(body), signal });
    }
    if (!res.ok) throw new Error(await apiError(res));
    let stop = null;
    await pump(res, j => {
      if (j.error) { stop = j.error.message || 'stream error'; return; }
      const d = j.choices?.[0]?.delta; if (!d) return;
      const r = d.reasoning_content ?? d.reasoning;
      if (typeof r === 'string' && r) onThink(r);
      if (d.content) onText(d.content);
      pullSources(d, onSource);
      pullSources(j.choices?.[0]?.message, onSource);
      if (d.annotations) pullSources(d, onSource);
    });
    if (stop) throw new Error(stop);
    return;
  }

  /* ── Anthropic ── */
  if (prov.wire === 'anthropic') {
    const body = { model, stream:true, max_tokens: 8192, messages: buildAnthropic(messages, mdef.vision), ...extra };
    if (sys) body.system = sys;
    if (extra.thinking) body.max_tokens = extra.thinking.budget_tokens + 6000;
    else body.temperature = Math.min(cfg.temp, 1);
    if (search) body.tools = [{ type:'web_search_20250305', name:'web_search', max_uses: 5 }];
    const res = await apiFetch(prov.base + '/messages', { method:'POST', signal, body: JSON.stringify(body), headers:{
      'Content-Type':'application/json', 'x-api-key': key,
      'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true'
    }});
    if (!res.ok) throw new Error(await apiError(res));
    let stop = null, jsonBuf = '';
    await pump(res, j => {
      if (j.type === 'error') { stop = j.error?.message || 'stream error'; return; }
      if (j.type === 'content_block_start') {
        const b = j.content_block || {};
        if (b.type === 'server_tool_use' && (b.name === 'web_search' || b.name === 'web_search_tool')) onSearch({ query:'', status:'searching' });
        if (b.type === 'web_search_tool_result') onSearch({ status:'done' });
      }
      if (j.type !== 'content_block_delta') return;
      const d = j.delta || {};
      if (d.type === 'thinking_delta' && d.thinking) onThink(d.thinking);
      else if (d.type === 'text_delta' && d.text) onText(d.text);
      else if (d.type === 'input_json_delta' && d.partial_json) {
        jsonBuf += d.partial_json;
        try { const o = JSON.parse(jsonBuf); if (o.query) onSearch({ query: o.query, status:'searching' }); } catch {}
      }
      else if (d.type === 'citations_delta' && d.citation) {
        const c = d.citation;
        if (c.url) onSource({ title: c.title || c.url, url: c.url });
      }
    });
    if (stop) throw new Error(stop);
    return;
  }

  /* ── Gemini ── */
  if (prov.wire === 'gemini') {
    /* Gemini 3: เอกสารแนะนำให้คง temperature ไว้ที่ 1.0 — ค่าต่ำกว่านั้นทำให้คิดวนลูป/คุณภาพตก */
    const gen = mdef.tlevel ? {} : { temperature: cfg.temp };
    if (extra.thinkingConfig) gen.thinkingConfig = extra.thinkingConfig;
    const body = { contents: buildGemini(messages, mdef.vision), generationConfig: gen };
    if (sys) body.systemInstruction = { parts:[{ text: sys }] };
    if (search) body.tools = [{ googleSearch: {} }];
    const url = `${prov.base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    let res = await apiFetch(url, { method:'POST', signal, body: JSON.stringify(body),
      headers:{ 'Content-Type':'application/json', 'x-goog-api-key': key } });
    if (!res.ok && search) {
      body.tools = [{ google_search: {} }];
      res = await apiFetch(url, { method:'POST', signal, body: JSON.stringify(body),
        headers:{ 'Content-Type':'application/json', 'x-goog-api-key': key } });
    }
    if (!res.ok) throw new Error(await apiError(res));
    let stop = null;
    await pump(res, j => {
      if (j.error) { stop = j.error.message; return; }
      const cand = j.candidates?.[0] || {};
      const parts = cand.content?.parts || [];
      for (const p of parts) if (typeof p.text === 'string' && p.text) (p.thought ? onThink : onText)(p.text);
      const gm = cand.groundingMetadata || cand.grounding_metadata;
      if (gm) {
        (gm.webSearchQueries || gm.web_search_queries || []).forEach(q => onSearch({ query: q, status:'done' }));
        pullSources(gm, onSource);
      }
    });
    if (stop) throw new Error(stop);
    return;
  }
  throw new Error('ไม่รู้จักผู้ให้บริการนี้');
}
async function callOpenAIResponses({ key, model, messages, extra, vision, signal, onText, onThink, onSearch, onSource, sys }) {
  const body = { model, stream:true, tools:[{ type:'web_search' }], input: buildResponsesInput(messages, vision) };
  if (sys) body.instructions = sys;
  if (extra.reasoning_effort && extra.reasoning_effort !== 'none') body.reasoning = { effort: extra.reasoning_effort };
  const res = await apiFetch('https://api.openai.com/v1/responses', {
    method:'POST', signal, body: JSON.stringify(body),
    headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + key }
  });
  if (!res.ok) throw new Error(await apiError(res));
  await pump(res, (j, ev) => {
    const type = ev || j?.type || '';
    const delta = typeof j?.delta === 'string' ? j.delta : (typeof j?.text === 'string' ? j.text : '');
    if (type.includes('output_text') && delta) onText(delta);
    if (type.includes('reasoning') && delta) onThink(delta);
    if (type.includes('web_search_call')) {
      const q = j?.action?.query || j?.query || (Array.isArray(j?.action?.queries) ? j.action.queries[0] : '');
      onSearch({ query: q || 'ค้นเว็บ', status: type.includes('completed') ? 'done' : 'searching' });
    }
    pullSources(j, onSource);
    const item = j?.item || j;
    if (item?.type === 'message') (item.content || []).forEach(c => pullSources(c, onSource));
  });
}
async function streamChat({ url, headers, body, signal, onText, onThink, onSource }) {
  const res = await apiFetch(url, { method:'POST', headers, body: JSON.stringify(body), signal });
  if (!res.ok) throw new Error(await apiError(res));
  let stop = null;
  await pump(res, j => {
    if (j.error) { stop = j.error.message || 'stream error'; return; }
    const d = j.choices?.[0]?.delta; if (!d) return;
    const r = d.reasoning_content ?? d.reasoning;
    if (typeof r === 'string' && r) onThink(r);
    if (d.content) onText(d.content);
    pullSources(d, onSource);
  });
  if (stop) throw new Error(stop);
}
async function searchThenStream({ url, headers, model, messages, extra, vision, wire, signal, onText, onThink, onSearch, onSource }) {
  const last = [...messages].reverse().find(m => m.role === 'user');
  const q = flatten(last || { content:'' }).slice(0, 280);
  onSearch({ query: q, status:'searching' });
  const result = await doSearch(q, signal);
  (result.sources || []).forEach(onSource);
  onSearch({ query: q, status:'done' });
  const copy = messages.map(m => ({ ...m, content: m.content, attachments: m.attachments }));
  const u = [...copy].reverse().find(m => m.role === 'user');
  if (u) u.content = (u.content || '') + '\n\n<search_results>\n' + result.text + '\n</search_results>\nอ้างอิงแหล่งที่มาเป็นลิงก์ markdown เมื่อใช้ข้อมูลจากผลการค้น';
  const body = { model, messages: buildOpenAI(copy, vision, [cfg.sys, 'When delivering multiple files, put EACH file in its own markdown fence with a filename.'].filter(Boolean).join('\n\n'), wire), stream:true, ...extra };
  if (!(wire === 'openai' && extra.reasoning_effort)) body.temperature = cfg.temp;
  await streamChat({ url, headers, body, signal, onText, onThink, onSource });
}
async function callCompatToolLoop({ url, headers, model, messages, extra, vision, wire, signal, onText, onThink, onSearch, onSource }) {
  let msgs = buildOpenAI(messages, vision, (cfg.sys || '') + '\n\nYou have a web_search tool. Use it for current events, prices, news, or anything that may have changed after your knowledge cutoff. Cite sources with markdown links.', wire);
  for (let round = 0; round < 4; round++) {
    const body = { model, messages: msgs, stream:true, tools:[SEARCH_TOOL], tool_choice: round === 0 ? 'auto' : 'auto', ...extra };
    if (!(wire === 'openai' && extra.reasoning_effort)) body.temperature = cfg.temp;
    const res = await apiFetch(url, { method:'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error(await apiError(res));
    const tools = [];
    let finish = null, stop = null;
    await pump(res, j => {
      if (j.error) { stop = j.error.message || 'stream error'; return; }
      const ch = j.choices?.[0]; if (!ch) return;
      if (ch.finish_reason) finish = ch.finish_reason;
      const d = ch.delta; if (!d) return;
      const r = d.reasoning_content ?? d.reasoning;
      if (typeof r === 'string' && r) onThink(r);
      if (d.content) onText(d.content);
      if (d.tool_calls) {
        for (const tc of d.tool_calls) {
          const i = tc.index ?? 0;
          if (!tools[i]) tools[i] = { id:'', name:'', arguments:'' };
          if (tc.id) tools[i].id = tc.id;
          if (tc.function?.name) tools[i].name += tc.function.name;
          if (tc.function?.arguments) tools[i].arguments += tc.function.arguments;
        }
      }
    });
    if (stop) throw new Error(stop);
    const calls = tools.filter(t => t && t.name);
    if (!calls.length || (finish && finish !== 'tool_calls')) return;
    const packed = calls.map(t => ({
      id: t.id || ('call_' + Math.random().toString(36).slice(2, 10)),
      type: 'function',
      function: { name: t.name, arguments: t.arguments || '{}' }
    }));
    const asst = { role:'assistant', content: null, tool_calls: packed };
    if (wire === 'deepseek') asst.reasoning_content = '';   // V4 บังคับให้มีฟิลด์นี้ในลูป tool
    msgs.push(asst);
    for (let i = 0; i < packed.length; i++) {
      const args = parseToolArgs(packed[i].function.arguments);
      const q = args.query || args.q || Object.values(args)[0] || '';
      onSearch({ query: q, status:'searching' });
      const result = await doSearch(q, signal);
      (result.sources || []).forEach(onSource);
      onSearch({ query: q, status:'done' });
      msgs.push({ role:'tool', tool_call_id: packed[i].id, content: result.text });
    }
  }
}
async function apiError(res) {
  let msg = '';
  try { const j = await res.json(); msg = j.error?.message || j.message || j.error || JSON.stringify(j).slice(0, 240); }
  catch { try { msg = (await res.text()).slice(0, 240); } catch {} }
  if (typeof msg !== 'string') msg = JSON.stringify(msg).slice(0, 240);
  const pre = { 401:'กุญแจไม่ถูกต้อง', 403:'กุญแจไม่มีสิทธิ์เข้าถึงโมเดลนี้', 404:'ไม่พบโมเดลนี้',
    429:'เรียกถี่เกินไปหรือเครดิตหมด', 400:'คำขอไม่ถูกต้อง', 500:'เซิร์ฟเวอร์ผู้ให้บริการขัดข้อง', 529:'ผู้ให้บริการรับงานไม่ไหว' }[res.status];
  return `${pre ? pre + ' ' : ''}(${res.status}) ${msg}`;
}

/* ─────────── send / stream ─────────── */
function syncSend() { $('#btnSend').disabled = busy || (!$('#ta').value.trim() && !pending.length); }
async function send() {
  if (busy) return;
  const text = $('#ta').value.trim();
  if (!text && !pending.length) return;
  if (cfg.provider !== 'demo' && !keys[cfg.provider]) { openSettings(); toast('ใส่กุญแจของ ' + P().name + ' ก่อน'); return; }
  if (!chat()) newChat();
  const c = chat();
  c.messages.push({ role:'user', content:text, attachments: pending.slice(), ts: Date.now() });
  c.ts = Date.now();
  if (!c.title || c.title === 'บทสนทนาใหม่') c.title = (text || pending[0]?.name || 'บทสนทนาใหม่').slice(0, 52);
  pending = []; drawAtt();
  $('#ta').value = ''; grow(); syncSend();
  saveChats(); drawRail(); drawThread(); jump(true);
  await run();
}
async function regen(idx) {
  if (busy) return;
  const c = chat(); if (!c) return;
  c.messages = c.messages.slice(0, idx);
  saveChats(); drawThread(); await run();
}
async function run() {
  const c = chat(); if (!c) return;
  if (cfg.provider === 'demo') {
    const last = [...c.messages].reverse().find(m => m.role === 'user');
    const demo = buildDemoReply(last?.content || '', last?.attachments || []);
    c.messages.push({ role:'assistant', model:'Kiln · Test Lab', ts:Date.now(), ...demo });
    c.ts = Date.now(); saveChats(); drawRail(); drawThread(); jump(true);
    return;
  }
  busy = true; setBusy(true);
  const out = { role:'assistant', content:'', reasoning:'', queries:[], sources:[], model: `${P().name} ${M().label}`, ts: Date.now() };

  const live = h('div', 'turn a');
  const who = h('div', 'who');
  who.innerHTML = `<span class="nm">คำตอบ · <b>${escapeHTML(out.model)}</b></span><span class="line"></span>`;
  const sb = seekEl([], true); sb.style.display = cfg.search ? '' : 'none';
  const tb = thinkEl('', true); tb.style.display = 'none';
  const prose = h('div', 'prose');
  const caret = h('span', 'caret');
  live.append(who, sb, tb, prose); prose.appendChild(caret);
  $('#msgs').append(live); jump(true);

  let last = 0, raf = 0;
  const paint = () => {
    raf = 0;
    const now = performance.now();
    if (now - last < 55) { raf = requestAnimationFrame(paint); return; }   // เว้นจังหวะ แต่ไม่ทิ้งเฟรมสุดท้าย
    last = now;
    prose.innerHTML = md(out.content);
    (prose.lastElementChild || prose).appendChild(caret);                   // เคอร์เซอร์ต่อท้ายบรรทัดจริง
    jump();
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

  ctrl = new AbortController();
  try {
    await callProvider({
      provider: cfg.provider, model: mId(), messages: c.messages, level: cfg.level, signal: ctrl.signal, search: !!cfg.search,
      onText: t => { out.content += t; schedule(); },
      onThink: t => { out.reasoning += t; tb.style.display = ''; tb.querySelector('.inner').textContent = out.reasoning; tb.querySelector('.inner').scrollTop = 1e6; jump(); },
      onSearch: ({ query }) => {
        if (query && !out.queries.includes(query)) out.queries.push(query);
        sb.style.display = '';
        sb.querySelector('.inner').textContent = out.queries.join('\n') || 'กำลังค้น…';
        jump();
      },
      onSource: s => {
        if (!s?.url) return;
        if (!out.sources.some(x => x.url === s.url)) out.sources.push({ title: s.title || s.url, url: s.url });
      }
    });
    if (!out.content.trim() && !out.reasoning.trim()) out.content = '_(ไม่มีข้อความตอบกลับ)_';
  } catch (err) {
    if (err?.name === 'AbortError') out.content += (out.content ? '\n\n' : '') + '_— หยุดกลางคัน —_';
    else { out.error = true; out.content = String(err?.message || err); }
  }
  if (raf) cancelAnimationFrame(raf);
  ctrl = null; busy = false; setBusy(false);
  live.remove();
  if (!out.queries.length) delete out.queries;
  if (!out.sources.length) delete out.sources;
  c.messages.push(out); c.ts = Date.now(); saveChats(); drawRail(); drawThread(); jump(true);
}
function setBusy(on) {
  $('#btnSend').style.display = on ? 'none' : 'grid';
  $('#btnStop').style.display = on ? 'grid' : 'none';
  syncSend();
}
$('#btnSend').onclick = send;
$('#btnStop').onclick = () => ctrl?.abort();
$('#btnNew').onclick = newChat;

/* ─────────── composer ─────────── */
const ta = $('#ta');
function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, window.innerHeight * 0.34) + 'px'; }
ta.addEventListener('input', () => { grow(); syncSend(); });
ta.addEventListener('focus', () => { $('#editor').classList.add('focus'); setTimeout(() => jump(true), 320); });
ta.addEventListener('blur',  () => $('#editor').classList.remove('focus'));
ta.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  const desktop = !matchMedia('(pointer: coarse)').matches;
  if (cfg.enter || desktop) { e.preventDefault(); send(); }
});
if (window.visualViewport) visualViewport.addEventListener('resize', () => jump(false));

/* ─────────── model sheet ─────────── */
$('#modelBtn').onclick = () => { drawModelSheet(); open$('#shModel'); };
function drawModelSheet() {
  const tabs = $('#pvTabs'); tabs.innerHTML = '';
  Object.entries(PROVIDERS).forEach(([id, p]) => {
    const t = h('button', 'pv-tab' + (id === cfg.provider ? ' on' : ''));
    t.innerHTML = `<span class="k${id === 'demo' || keys[id] ? ' has' : ''}"></span>${p.name}`;
    t.onclick = () => { cfg.provider = id; saveCfg(); drawModelSheet(); head(); drawThread(); };
    tabs.append(t);
  });
  const list = $('#modelList'); list.innerHTML = '';
  P().models.forEach(m => {
    const o = h('button', 'opt' + (m.id === mId() ? ' on' : ''));
    const t = h('div', 't');
    t.append(h('b', null, m.label), h('span', null, m.id));
    const tags = h('div', 'tags');
    if (m.vision) tags.append(h('span', 'tag', 'ภาพ'));
    if (m.think === 'opt') tags.append(h('span', 'tag', 'คิด'));
    if (m.note) tags.append(h('span', 'tag', m.note));
    const tick = h('span', 'tick'); tick.innerHTML = I.check;
    o.append(t, tags, tick);
    if (m.custom) {
      const rm = h('span', 'tag'); rm.textContent = 'ลบ'; rm.style.color = 'var(--accent)'; rm.style.borderColor = 'var(--accent)';
      rm.onclick = e => { e.stopPropagation(); removeCustomModel(cfg.provider, m.id); drawModelSheet(); head(); };
      tags.append(rm);
    }
    o.onclick = () => { cfg.model[cfg.provider] = m.id; saveCfg(); drawModelSheet(); head(); close$('#shModel'); toast(m.label); };
    list.append(o);
  });
  const add = h('button', 'opt');
  const at = h('div', 't');
  add.append(at);
  if (cfg.provider === 'compatible') {
    at.append(h('b', null, 'กำหนด Model ID ในตั้งค่า'), h('span', null, 'ใส่ชื่อค่าย, Base URL และ Model ID ของคุณเอง'));
    add.onclick = () => { close$('#shModel'); openSettings(); setTimeout(() => $('#setCompatModel').focus(), 250); };
  } else {
    at.append(h('b', null, '+  เพิ่มโมเดลเอง'), h('span', null, 'พิมพ์ model id ตรงจากเอกสารผู้ให้บริการ'));
    add.onclick = () => {
      const id = prompt(`Model ID ของ ${P().name}\nตัวอย่าง: ${P().models[0].id}`, '');
      if (id && id.trim()) { addCustomModel(cfg.provider, id.trim()); drawModelSheet(); head(); }
    };
  }
  if (cfg.provider !== 'demo') list.append(add);
  $('#noKeyNote').textContent = cfg.provider === 'demo'
    ? 'ทำงานในเบราว์เซอร์ ไม่เรียก AI API และไม่ต้องใช้ Key · PPTX โหลดไลบรารีจาก CDN ครั้งแรก'
    : keys[cfg.provider]
    ? `กุญแจ ${P().name} พร้อมใช้งานแล้ว`
    : `ยังไม่มีกุญแจของ ${P().name} — ${P().help}`;
}

/* โมเดลที่ผู้ใช้เพิ่มเอง — กันรายชื่อ hardcode ล้าสมัย */
function addCustomModel(pid, id) {
  cfg.custom = cfg.custom || {};
  cfg.custom[pid] = cfg.custom[pid] || [];
  if (PROVIDERS[pid].models.some(m => m.id === id)) { toast('มีโมเดลนี้อยู่แล้ว'); return; }
  const m = { id, label: id.split('/').pop(), note:'เพิ่มเอง', vision:true, think:'opt', off:true, custom:true };
  cfg.custom[pid].push(m);
  PROVIDERS[pid].models.push(m);
  cfg.model[pid] = id; saveCfg(); toast('เพิ่ม ' + m.label + ' แล้ว');
}
function removeCustomModel(pid, id) {
  cfg.custom = cfg.custom || {};
  cfg.custom[pid] = (cfg.custom[pid] || []).filter(m => m.id !== id);
  PROVIDERS[pid].models = PROVIDERS[pid].models.filter(m => m.id !== id);
  if (cfg.model[pid] === id) delete cfg.model[pid];
  saveCfg();
}
function injectCustom() {
  for (const [pid, arr] of Object.entries(cfg.custom || {})) {
    const p = PROVIDERS[pid];
    if (!p || !Array.isArray(arr)) continue;
    arr.forEach(m => { if (m?.id && !p.models.some(x => x.id === m.id)) p.models.push({ ...m, custom:true }); });
  }
}

/* ─────────── reasoning sheet ─────────── */
$('#btnReason').onclick = () => { drawReasonSheet(); open$('#shReason'); };
function drawReasonSheet() {
  const m = M(), list = $('#reasonList'); list.innerHTML = '';
  LEVELS.filter(l => l.v !== 'off' || m.off).forEach(l => {
    const o = h('button', 'opt' + (l.v === cfg.level ? ' on' : ''));
    const t = h('div', 't'); t.append(h('b', null, l.th), h('span', null, l.d));
    const tick = h('span', 'tick'); tick.innerHTML = I.check;
    o.append(t, tick);
    o.onclick = () => { cfg.level = l.v; saveCfg(); head(); close$('#shReason'); };
    list.append(o);
  });
  const p = reasonParams(P().wire, m, cfg.level);
  $('#reasonNote').textContent = Object.keys(p).length
    ? 'ส่งไปยัง API เป็น: ' + JSON.stringify(p)
    : 'ไม่ส่งพารามิเตอร์เพิ่ม — ใช้ค่าเริ่มต้นของโมเดล';
}

/* ─────────── settings ─────────── */
function openSettings() { drawSettings(); open$('#shSet'); railClose(); }
$('#btnSettings').onclick = openSettings;
$('#btnSettings2').onclick = openSettings;
function selectProvider(id) {
  cfg.provider = id;
  saveCfg(); drawSettings(); head(); drawThread();
}
function drawSettings() {
  const picker = $('#providerPicker'); picker.innerHTML = '';
  Object.entries(PROVIDERS).forEach(([id, p]) => {
    const o = h('option'); o.value = id; o.textContent = p.name;
    picker.append(o);
  });
  picker.value = cfg.provider;
  const p = P();
  $('#curModelName').textContent = p.name + ' · ' + M().label;
  $('#curModelId').textContent = (mId() || 'ยังไม่ได้ระบุ Model ID') + (cfg.search && cfg.provider !== 'demo' ? ' · ค้นเว็บเปิด' : '');
  $('#providerHint').textContent = p.help;
  $('#providerSectionTitle').textContent = cfg.provider === 'demo' ? 'ทดลองโดยไม่ใช้ API' : 'กุญแจของผู้ให้บริการ';
  $('#providerSectionNote').textContent = cfg.provider === 'demo'
    ? 'พิมพ์อะไรก็ได้ในแชทเพื่อดูคำสั่ง หรือพิมพ์ 1, 1.1, 2 โดยตรง ไม่ส่งข้อมูลไปหาโมเดล · การสร้าง PPTX ครั้งแรกต้องต่อเน็ตเพื่อโหลดไลบรารี'
    : 'เลือกเจ้าที่ต้องการด้านล่าง แล้วกรอกกุญแจเฉพาะเจ้านั้นได้เลย ระบบจำแยกให้ทุกเจ้า จึงสลับกลับมาใช้ภายหลังได้โดยไม่ต้องวางใหม่';
  $('#providerKeyField').hidden = cfg.provider === 'demo';
  $('#compatFields').hidden = cfg.provider !== 'compatible';
  $('#setCompatName').value = cfg.compatible.name || '';
  $('#setCompatBase').value = cfg.compatible.base || '';
  $('#setCompatModel').value = cfg.compatible.model || '';
  $('#setKey').value = keys[cfg.provider] || '';
  $('#setKey').placeholder = p.prefix;
  $('#setKey').type = 'password'; $('#btnEye').textContent = 'แสดง';
  $('#keyState').textContent = keys[cfg.provider] ? 'บันทึกแล้ว' : 'ว่าง';
  $('#keyState').style.color = keys[cfg.provider] ? 'var(--accent)' : '';
  $('#testOut').textContent = ''; $('#testOut').className = 'status';
  $('#setSys').value = cfg.sys || '';
  $('#setTemp').value = cfg.temp; $('#tempVal').textContent = Number(cfg.temp).toFixed(1);
  $('#tempNote').textContent = M().tlevel
    ? 'Gemini 3 แนะนำให้คงไว้ที่ 1.0 (ค่าต่ำกว่าทำให้คิดวนลูป) — จึงข้ามค่านี้ให้อัตโนมัติ'
    : (cfg.provider === 'openai' && M().think === 'opt' ? 'โมเดลตระกูล GPT-5/o-series ใช้ค่าเริ่มต้นของตัวเอง — จึงข้ามค่านี้ให้อัตโนมัติ' : '');
  $('#swEnter').classList.toggle('on', !!cfg.enter);
  $('#swSearch').classList.toggle('on', !!cfg.search);
  $('#swTheme').classList.toggle('on', document.documentElement.dataset.theme === 'dark');
  $('#setProxy').value = cfg.proxy || '';
  $('#swProxyAll').classList.toggle('on', !!cfg.proxyAll);
  $('#proxyOut').textContent = ''; $('#proxyOut').className = 'status';
  $('#setJina').value = keys.jina || '';
  $('#setTavily').value = keys.tavily || '';
  const bytes = new Blob([JSON.stringify(chats)]).size;
  $('#usageNote').textContent = `บทสนทนา ${chats.length} รายการ · ใช้พื้นที่ราว ${(bytes / 1024).toFixed(0)} KB`;
}
$('#providerPicker').onchange = e => selectProvider(e.target.value);
$('#btnPickModel').onclick = () => { close$('#shSet'); drawModelSheet(); open$('#shModel'); };
$('#btnEye').onclick = () => { const i = $('#setKey'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; $('#btnEye').textContent = show ? 'ซ่อน' : 'แสดง'; };
$('#btnPaste').onclick = async () => {
  try { $('#setKey').value = (await navigator.clipboard.readText()).trim(); toast('วางแล้ว'); }
  catch { toast('แตะค้างในช่องแล้วเลือก Paste'); }
};
$('#btnSaveKey').onclick = () => {
  const v = $('#setKey').value.trim();
  if (!v) { toast('ยังไม่ได้ใส่กุญแจ'); return; }
  keys[cfg.provider] = v; jset(K.keys, keys); drawSettings(); head(); drawThread(); toast('บันทึกกุญแจ ' + P().name + ' แล้ว');
};
$('#btnDelKey').onclick = () => {
  if (!keys[cfg.provider] || !confirm('ลบกุญแจของ ' + P().name + ' ?')) return;
  delete keys[cfg.provider]; jset(K.keys, keys); drawSettings(); head(); drawThread(); toast('ลบแล้ว');
};
function saveCompatibleFields() {
  cfg.compatible.name = $('#setCompatName').value.trim();
  cfg.compatible.base = compatBase($('#setCompatBase').value);
  cfg.compatible.model = $('#setCompatModel').value.trim();
  cfg.model.compatible = cfg.compatible.model;
  saveCfg(); head();
}
['#setCompatName', '#setCompatBase', '#setCompatModel'].forEach(s => $(s).addEventListener('input', saveCompatibleFields));
$('#btnWipeKeys').onclick = () => {
  if (!confirm('ลบกุญแจของทุกผู้ให้บริการ (รวม Jina / Tavily) ?')) return;
  keys = {}; jset(K.keys, keys); drawSettings(); head(); drawThread(); toast('ล้างกุญแจทั้งหมดแล้ว');
};
$('#btnWipeAll').onclick = () => {
  if (!confirm('ลบบทสนทนาและกุญแจทั้งหมดในเครื่องนี้ ? ย้อนกลับไม่ได้')) return;
  [K.keys, K.cfg, K.chats].forEach(k => localStorage.removeItem(k)); location.reload();
};
$('#setSys').oninput  = e => { cfg.sys = e.target.value; saveCfg(); };
$('#setTemp').oninput = e => { cfg.temp = parseFloat(e.target.value); $('#tempVal').textContent = cfg.temp.toFixed(1); saveCfg(); };
$('#swEnter').onclick = () => { cfg.enter = !cfg.enter; saveCfg(); $('#swEnter').classList.toggle('on', cfg.enter); head(); };
$('#swSearch').onclick = () => { cfg.search = !cfg.search; saveCfg(); $('#swSearch').classList.toggle('on', cfg.search); head(); };
$('#swTheme').onclick = flipTheme;
$('#setJina').oninput = e => { const v = e.target.value.trim(); if (v) keys.jina = v; else delete keys.jina; jset(K.keys, keys); };
$('#setTavily').oninput = e => { const v = e.target.value.trim(); if (v) keys.tavily = v; else delete keys.tavily; jset(K.keys, keys); };
$('#btnSearch').onclick = () => { cfg.search = !cfg.search; saveCfg(); head(); };
$('#setProxy').oninput = e => { cfg.proxy = e.target.value.trim(); proxyHosts.clear(); saveCfg(); };
$('#swProxyAll').onclick = () => { cfg.proxyAll = !cfg.proxyAll; saveCfg(); $('#swProxyAll').classList.toggle('on', cfg.proxyAll); };
$('#btnProxyTest').onclick = async () => {
  const out = $('#proxyOut'), url = String(cfg.proxy || '').trim().replace(/\/+$/, '');
  if (!/^https:\/\//i.test(url)) { out.className = 'status bad'; out.textContent = 'ใส่ Proxy URL ที่ขึ้นต้นด้วย https:// ก่อน'; return; }
  out.className = 'status'; out.textContent = 'กำลังทดสอบ…';
  try {
    const r = await fetch(url + '/health');
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) { out.className = 'status ok'; out.textContent = 'พร็อกซีพร้อมใช้งาน'; }
    else { out.className = 'status bad'; out.textContent = r.status === 403 ? 'พร็อกซีปฏิเสธโดเมนนี้ — เพิ่มเข้า ALLOWED_ORIGINS' : 'ตอบกลับผิดรูปแบบ (' + r.status + ')'; }
  } catch (e) { out.className = 'status bad'; out.textContent = 'ติดต่อพร็อกซีไม่ได้ — ตรวจ URL และว่า Worker deploy แล้ว'; }
};

/* ทดสอบกุญแจ — ยิง endpoint ที่ไม่สร้างโทเคนก่อน ถ้า custom ไม่รองรับจึงยิง chat สั้นที่สุด */
async function probeKey(pid, key) {
  const p = pid === 'compatible' ? P() : PROVIDERS[pid];
  if (!p?.base) return { ok:false, msg:'กรอก API Base URL ก่อนทดสอบ' };
  let res;
  if (pid === 'openai')          res = await apiFetch(p.base + '/models', { headers:{ Authorization:'Bearer ' + key } });
  else if (pid === 'openrouter') res = await apiFetch(p.base + '/key',    { headers:{ Authorization:'Bearer ' + key } });
  else if (pid === 'google')     res = await apiFetch(p.base + '/models', { headers:{ 'x-goog-api-key': key } });
  else if (pid === 'deepseek')   res = await apiFetch(p.base + '/models', { headers:{ Authorization:'Bearer ' + key } });
  else if (pid === 'compatible') {
    res = await apiFetch(p.base + '/models', { headers:{ Authorization:'Bearer ' + key } });
    if ((res.status === 404 || res.status === 405) && mId()) {
      res = await apiFetch(p.base + '/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + key },
        body:JSON.stringify({ model:mId(), max_tokens:1, messages:[{ role:'user', content:'ping' }] }) });
    }
  }
  else res = await apiFetch(p.base + '/messages', { method:'POST', headers:{
      'Content-Type':'application/json', 'x-api-key': key, 'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model: p.models[0].id, max_tokens: 1, messages:[{ role:'user', content:'hi' }] }) });
  return res.ok ? { ok:true } : { ok:false, msg: await apiError(res) };
}
async function runKeyTest(pid, key) {
  const st = $('#testOut');
  if (!key) { st.className = 'status bad'; st.textContent = 'ยังไม่ได้ใส่กุญแจ'; return false; }
  st.className = 'status'; st.textContent = 'กำลังทดสอบ…';
  try {
    const r = await probeKey(pid, key);
    if (r.ok) { keys[pid] = key; jset(K.keys, keys); head(); }
    st.textContent = r.ok ? 'กุญแจใช้งานได้ — พร้อมคุยได้เลย' : r.msg;
    st.className = 'status ' + (r.ok ? 'ok' : 'bad');
    return r.ok;
  } catch (err) {
    st.textContent = err.message || String(err); st.className = 'status bad';
    return false;
  }
}
$('#btnTest').onclick = () => runKeyTest(cfg.provider, $('#setKey').value.trim() || keys[cfg.provider]);

/* backup / restore */
$('#btnExport').onclick = () => save(JSON.stringify({ app:'kiln', v:2, at:new Date().toISOString(), keys, cfg, chats }, null, 2),
  `kiln-backup-${stamp()}.json`, 'application/json');
$('#btnImport').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d.keys) keys = d.keys;
    if (d.cfg) cfg = Object.assign(cfg, d.cfg);
    cfg.model = cfg.model || {};
    cfg.compatible = Object.assign({ name:'', base:'', model:'' }, cfg.compatible || {});
    if (Array.isArray(d.chats)) chats = d.chats;
    curId = chats[0]?.id || null;
    jset(K.keys, keys); saveCfg(); saveChats();
    initTheme(); drawRail(); drawThread(); drawSettings(); toast('กู้คืนข้อมูลแล้ว');
  } catch { toast('ไฟล์สำรองไม่ถูกต้อง'); }
  e.target.value = '';
};

/* ═════════ self-test / diagnostics ═════════ */
function runTests() {
  const T = [];
  const t = (name, fn) => { try { const d = fn(); T.push({ name, ok:true, detail: d || '' }); } catch (e) { T.push({ name, ok:false, detail: String(e.message || e) }); } };
  const eq = (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) throw new Error((m || '') + ' ได้ ' + A + ' ควรเป็น ' + B); };

  t('localStorage อ่าน/เขียนได้', () => { localStorage.setItem('kiln.probe', '1'); const v = localStorage.getItem('kiln.probe'); localStorage.removeItem('kiln.probe'); if (v !== '1') throw new Error('อ่านค่ากลับไม่ตรง'); return 'ok'; });
  t('marked โหลดสำเร็จ', () => { if (!window.marked) throw new Error('ไม่พบ marked (ออฟไลน์?)'); if (!/<strong>/.test(marked.parse('**a**'))) throw new Error('แปลง bold ไม่ได้'); return 'แปลง markdown ได้'; });
  t('DOMPurify กัน XSS', () => { if (!window.DOMPurify) throw new Error('ไม่พบ DOMPurify'); const o = md('<img src=x onerror=alert(1)>\n\n<script>bad()<\/script>'); if (/onerror|<script/i.test(o)) throw new Error('ยังหลุด: ' + o.slice(0, 60)); return 'สะอาด'; });
  t('highlight.js พร้อมใช้', () => { if (!window.hljs) throw new Error('ไม่พบ hljs'); const r = hljs.highlight('const a=1', { language:'javascript' }); if (!/hljs-/.test(r.value)) throw new Error('ไม่ทำงาน'); return 'ok'; });
  t('ตาราง Markdown เรนเดอร์ได้', () => { const o = md('| a | b |\n|---|---|\n| 1 | 2 |'); if (!/<table/.test(o)) throw new Error('ไม่เป็นตาราง'); return 'ok'; });
  t('SSE: แยกอีเวนต์ข้ามก้อนข้อมูล', () => {
    const p = new SSE();
    let got = [];
    got = got.concat(p.push('data: {"n":1}\n\ndata: {"n'));
    got = got.concat(p.push('":2}\n\n: comment\ndata: [DONE]\n\n'));
    eq(got.map(g => g.done ? 'D' : g.data.n), [1, 2, 'D']);
    return 'สามอีเวนต์ถูกต้อง';
  });
  t('SSE: ทน CRLF และบรรทัดว่าง', () => { const p = new SSE(); const g = p.push('\r\ndata: {"x":true}\r\n\r\n'); eq(g.length, 1); eq(g[0].data.x, true); return 'ok'; });
  t('SSE: อ่าน event: ของ Responses API', () => {
    const p = new SSE();
    const g = p.push('event: response.output_text.delta\ndata: {"delta":"Hi"}\n\n');
    eq(g[0].event, 'response.output_text.delta'); eq(g[0].data.delta, 'Hi'); return 'ok';
  });
  t('จัดรูปแบบผลค้นเว็บ', () => {
    const s = formatSearchResults([{ title:'A', url:'https://a.test', snippet:'hello' }]);
    if (!s.includes('https://a.test') || !s.includes('hello')) throw new Error(s); return 'ok';
  });
  t('parse arguments ของ tool', () => { eq(parseToolArgs('{"query":"บิตคอยน์"}').query, 'บิตคอยน์'); eq(parseToolArgs('not-json').query, 'not-json'); return 'ok'; });
  t('Responses input แปลงข้อความ', () => {
    const o = buildResponsesInput([{ role:'user', content:'hi' }, { role:'assistant', content:'yo' }], false);
    eq(o[0].role, 'user'); eq(o[1].role, 'assistant'); eq(o[0].content, 'hi'); return 'ok';
  });
  t('นิยาม web_search tool', () => { eq(SEARCH_TOOL.function.name, 'web_search'); if (!SEARCH_TOOL.function.parameters.properties.query) throw new Error('ขาด query'); return 'ok'; });
  t('นามสกุลไฟล์จากภาษา', () => { eq([extFor('python'), extFor('JavaScript'), extFor('rust'), extFor('nope')], ['py', 'js', 'rs', 'txt']); return 'py / js / rs / txt'; });
  t('ดึงหลายไฟล์จาก code fence', () => {
    const src = 'นี่โปรเจกต์\n```html index.html\n<h1>Hi</h1>\n```\n```css styles.css\nbody{}\n```\n```js app.js\nconsole.log(1)\n```';
    const f = extractArtifacts(src);
    eq(f.length, 3); eq(f[0].name, 'index.html'); eq(f[1].name, 'styles.css'); eq(f[2].name, 'app.js');
    eq(f[0].runnable, true);
    const stripped = stripCodeFences(src, f);
    if (stripped.includes('<h1>Hi</h1>')) throw new Error('ยังเหลือโค้ดยาว');
    if (!stripped.includes('«file:index.html»')) throw new Error('ไม่แทนที่ด้วยการ์ด');
    return '3 ไฟล์ + ซ่อนโค้ดยาว';
  });
  t('safePath กัน path traversal', () => { eq(safePath('../etc/passwd'), 'etc/passwd'); eq(safePath('/a/b.txt'), 'a/b.txt'); return 'ok'; });
  t('JSZip พร้อมสร้าง/แตก ZIP', () => { if (!window.JSZip) throw new Error('ไม่พบ JSZip'); return 'ok'; });
  t('Test Lab ไม่ต้องใช้ API Key', () => {
    if (PROVIDERS.demo.wire !== 'demo' || !PROVIDERS.demo.models[0].id) throw new Error('ไม่พบโมเดลทดสอบ');
    const reply = buildDemoReply('1');
    eq(reply.demoFiles, ['pdf']);
    return 'เลือกแล้วรับ PDF ได้';
  });
  t('รหัส 1.1 และ 2 ส่งไฟล์ที่ถูกต้อง', () => {
    eq(buildDemoReply('1.1').demoFiles, ['pptx']);
    const all = buildDemoReply('2');
    eq(all.demoFiles.length, DEMO_SPECS.length);
    eq(all.demoZip, true);
    return `${all.demoFiles.length} นามสกุล`;
  });
  t('พิมพ์อะไรก็ได้แสดงคู่มือ', () => {
    const r = buildDemoReply('สวัสดี');
    if (!r.content.includes('`1.1`') || !r.content.includes('`2`') || r.demoFiles) throw new Error('คู่มือไม่ครบ');
    return 'เมนูพร้อม';
  });
  t('ชื่อไฟล์ทดสอบไม่ซ้ำ', () => {
    const names = DEMO_SPECS.map(s => s.name), cmds = DEMO_SPECS.map(s => s.cmd);
    if (new Set(names).size !== names.length || new Set(cmds).size !== cmds.length) throw new Error('ชื่อ/คำสั่งซ้ำ');
    return `${names.length} ชนิด`;
  });
  t('ZIP = ไฟล์แนบชิ้นเดียว (บั๊กชิปซ้ำ)', () => {
    const z = { type:'zip', name:'site.zip', total:3, files:[{ name:'index.html', text:'<h1>x</h1>' }, { name:'app.js', text:'let a = 1' }],
      skipped:[{ name:'logo.png', reason:'ไฟล์ไบนารี/รูปภาพ' }] };
    const keep = pending;
    try { pending = [z]; drawAtt(); eq(document.querySelectorAll('#attRow .chip').length, 1); }
    finally { pending = keep; drawAtt(); }
    const s = flatten({ content:'ดูโปรเจกต์', attachments:[z] });
    if (!s.includes('ZIP: site.zip') || !s.includes('- logo.png') || !s.includes('### file: app.js')) throw new Error('prompt ไม่ครบ');
    return '1 ชิป · prompt มีโครงสร้าง + เนื้อหาไฟล์';
  });
  t('ข้อความเก่าที่แตก ZIP รวมกลับเป็นป้ายเดียว', () => {
    const d = displayAttachments([{ type:'text', name:'a.js', text:'1', fromZip:'p.zip' },
      { type:'text', name:'b.js', text:'2', fromZip:'p.zip' }, { type:'text', name:'c.md', text:'3' }]);
    eq(d.length, 2); eq(d[0].type, 'zip'); eq(d[0].total, 2);
    return '3 ไฟล์ → 2 ป้าย';
  });
  t('code fence ไม่ขาดเมื่อไฟล์มี ``` ข้างใน', () => { eq(fenceFor('a\n```js\nx\n```'), '````'); eq(fenceFor('plain'), '```'); return 'ok'; });
  t('ZIP: ข้าม .env และโฟลเดอร์ระบบ', () => {
    if (!ZIP_SECRET.test('app/.env') || !ZIP_SECRET.test('.env.local') || ZIP_SECRET.test('.env.example')) throw new Error('.env');
    if (!ZIP_JUNK.test('__MACOSX/a/._x') || !ZIP_JUNK.test('web/node_modules/x/index.js') || ZIP_JUNK.test('src/index.js')) throw new Error('junk');
    return 'ไม่ส่งไฟล์ลับ / ไฟล์ระบบ';
  });
  t('แนบไฟล์ข้อความเข้า prompt', () => { const s = flatten({ content:'ดูไฟล์นี้', attachments:[{ type:'text', name:'a.py', text:'print(1)' }] }); if (!s.includes('file: a.py') || !s.includes('print(1)')) throw new Error('ไม่พบเนื้อไฟล์'); return 'ok'; });
  t('payload OpenAI (มีรูป + system)', () => {
    const m = [{ role:'user', content:'ดูรูป', attachments:[{ type:'image', name:'i.png', mime:'image/png', dataUrl:'data:image/png;base64,AAA' }] }];
    const o = buildOpenAI(m, true, 'be nice');
    eq(o[0].role, 'system'); eq(o[1].content[1].type, 'image_url'); eq(o[1].content[1].image_url.url, 'data:image/png;base64,AAA'); return 'ok';
  });
  t('payload OpenAI (โมเดลไม่รับรูป)', () => { const o = buildOpenAI([{ role:'user', content:'hi', attachments:[{ type:'image', dataUrl:'data:image/png;base64,AAA' }] }], false, ''); eq(typeof o[0].content, 'string'); return 'ตัดรูปออกถูกต้อง'; });
  t('payload Anthropic (base64 แยกหัว)', () => { const o = buildAnthropic([{ role:'user', content:'hi', attachments:[{ type:'image', mime:'image/png', dataUrl:'data:image/png;base64,ZZZ' }] }], true); eq(o[0].content[0].source.data, 'ZZZ'); return 'ok'; });
  t('payload Gemini (role model)', () => { const o = buildGemini([{ role:'user', content:'a' }, { role:'assistant', content:'b' }], false); eq([o[0].role, o[1].role], ['user', 'model']); return 'ok'; });
  t('ข้าม message ที่ error', () => { const o = buildOpenAI([{ role:'assistant', content:'x', error:true }, { role:'user', content:'y' }], false, ''); eq(o.length, 1); return 'ok'; });
  t('reasoning → OpenAI', () => { eq(reasonParams('openai', { think:'opt', off:true }, 'high'), { reasoning_effort:'high' }); eq(reasonParams('openai', { think:'opt' }, 'auto'), {}); return 'ok'; });
  t('reasoning → Anthropic budget', () => { eq(reasonParams('anthropic', { think:'opt' }, 'medium'), { thinking:{ type:'enabled', budget_tokens:8000 } }); return '8000 tokens'; });
  t('reasoning → Gemini thinkingConfig', () => { eq(reasonParams('gemini', { think:'opt' }, 'low').thinkingConfig.thinkingBudget, 1024); eq(reasonParams('gemini', { think:'opt', off:true }, 'off').thinkingConfig.thinkingBudget, 0); return 'ok'; });
  t('reasoning → Gemini 3 ใช้ thinkingLevel', () => {
    eq(reasonParams('gemini', { think:'opt', tlevel:true }, 'high'), { thinkingConfig:{ thinkingLevel:'high' } });
    eq(reasonParams('gemini', { think:'opt', tlevel:true }, 'medium'), { thinkingConfig:{ thinkingLevel:'high' } });
    eq(reasonParams('gemini', { think:'opt', tlevel:true }, 'off'), { thinkingConfig:{ thinkingLevel:'low' } });
    eq(reasonParams('gemini', { think:'opt', tlevel:true }, 'auto'), {});
    return 'low/high (Gemini 3 ปิดคิดไม่ได้สนิท)';
  });
  t('DeepSeek V4 ส่ง reasoning_content กลับ', () => {
    const o = buildOpenAI([{ role:'assistant', content:'ตอบแล้ว', reasoning:'คิดอะไรมา' }], false, '', 'deepseek');
    eq(o[0].reasoning_content, 'คิดอะไรมา');
    const e = buildOpenAI([{ role:'assistant', content:'ไม่มีเหตุผล' }], false, '', 'deepseek');
    eq(e[0].reasoning_content, '');
    return 'มี/ไม่มี ต้องมีฟิลด์เสมอ';
  });
  t('เจ้าอื่นไม่ส่ง reasoning_content', () => {
    const o = buildOpenAI([{ role:'assistant', content:'x', reasoning:'y' }], false, '', 'openai');
    eq('reasoning_content' in o[0], false); return 'ok';
  });
  t('รายการผู้ให้บริการในตัวเลือก', () => {
    drawSettings();
    const values = [...document.querySelectorAll('#providerPicker option')].map(o => o.value);
    eq(values.length, Object.keys(PROVIDERS).length);
    if (!values.includes('compatible')) throw new Error('ไม่พบ OpenAI-compatible');
    return values.length + ' ตัวเลือก + custom endpoint';
  });
  t('สร้าง connection OpenAI-compatible', () => {
    const before = { ...cfg.compatible }, old = cfg.provider;
    cfg.provider = 'compatible'; cfg.compatible = { name:'Groq', base:'https://api.groq.com/openai/v1/', model:'llama-3.3-70b-versatile' };
    eq(P().name, 'Groq'); eq(P().base, 'https://api.groq.com/openai/v1'); eq(mId(), 'llama-3.3-70b-versatile');
    cfg.compatible = before; cfg.provider = old;
    return 'ชื่อ / URL / model แยกได้';
  });
  t('reasoning → DeepSeek V4', () => { eq(reasonParams('deepseek', { think:'opt', off:true }, 'high'), { thinking:{ type:'enabled' }, reasoning_effort:'max' }); eq(reasonParams('deepseek', { think:'opt', off:true }, 'off'), { thinking:{ type:'disabled' } }); return 'max / disabled'; });
  t('reasoning → โมเดลที่ไม่รองรับ', () => { eq(reasonParams('openai', { think:false }, 'high'), {}); return 'ไม่ส่งพารามิเตอร์'; });
  t('ปิดการคิดในโมเดลที่ปิดไม่ได้', () => { eq(reasonParams('gemini', { think:'opt' }, 'off').thinkingConfig.thinkingBudget, -1); return 'ถอยไปใช้ auto'; });
  t('รายการโมเดลครบถ้วน', () => {
    let n = 0;
    for (const [id, p] of Object.entries(PROVIDERS)) {
      if ((!p.base && id !== 'compatible') || !p.wire || !p.models.length) throw new Error(id + ' ข้อมูลไม่ครบ');
      p.models.forEach(m => { if ((!m.id && id !== 'compatible') || !m.label) throw new Error(id + ' มีโมเดลที่ข้อมูลไม่ครบ'); n++; });
    }
    return n + ' โมเดล / ' + Object.keys(PROVIDERS).length + ' ตัวเลือก (รวม custom endpoint)';
  });
  t('Blob + ดาวน์โหลดไฟล์ได้', () => { const u = URL.createObjectURL(new Blob(['x'])); URL.revokeObjectURL(u); if (!('download' in document.createElement('a'))) throw new Error('เบราว์เซอร์ไม่รองรับ download'); return 'ok'; });
  t('fetch + AbortController + stream', () => { if (!window.fetch || !window.AbortController || !window.ReadableStream) throw new Error('เบราว์เซอร์เก่าเกินไป'); return 'ok'; });
  t('บทสนทนา: สร้าง/แก้ชื่อ/ลบ', () => {
    const before = chats.length;
    const tmp = { id:'probe', title:'t', messages:[], ts:Date.now() };
    chats.unshift(tmp); tmp.title = 'renamed';
    chats = chats.filter(c => c.id !== 'probe');
    if (chats.length !== before) throw new Error('ลบไม่สะอาด');
    return 'สถานะคงเดิม';
  });
  t('ฟอนต์ถูกโหลด', () => { if (!document.fonts) return 'ตรวจไม่ได้'; const ok = document.fonts.check('16px "IBM Plex Sans Thai"'); return ok ? 'IBM Plex Sans Thai พร้อม' : 'ยังใช้ฟอนต์สำรอง (ออฟไลน์?)'; });
  return T;
}
function showDiag() {
  const box = $('#diagList'); box.innerHTML = '';
  const res = runTests();
  res.forEach(r => {
    const row = h('div', 'trow');
    row.append(h('span', 'st ' + (r.ok ? 'p' : 'f'), r.ok ? 'PASS' : 'FAIL'));
    const nm = h('div', 'nm'); nm.append(document.createTextNode(r.name));
    if (r.detail) nm.append(h('span', 'dt', r.detail));
    row.append(nm); box.append(row);
  });
  const pass = res.filter(r => r.ok).length;
  const sum = h('div', 'trow');
  sum.append(h('span', 'st ' + (pass === res.length ? 'p' : 'f'), pass + '/' + res.length));
  sum.append(h('div', 'nm', pass === res.length ? 'ผ่านทั้งหมด — ระบบพร้อมใช้งาน' : 'มีบางรายการไม่ผ่าน (ดูรายละเอียดด้านบน)'));
  box.prepend(sum);
}
$('#btnDiag').onclick = () => { showDiag(); open$('#shDiag'); };
$('#btnRerun').onclick = showDiag;

$('#btnVerifyFiles').onclick = async () => {
  const btn = $('#btnVerifyFiles'), box = $('#verifyFileResults');
  btn.disabled = true; btn.textContent = 'กำลังตรวจไฟล์…'; box.innerHTML = '';
  let passed = 0, total = 0;
  const check = async (label, fn) => {
    const row = h('div', 'trow');
    const status = h('span', 'st', '…'), body = h('div', 'nm', label);
    row.append(status, body); box.append(row);
    total++;
    try {
      const detail = await fn();
      passed++; status.className = 'st p'; status.textContent = 'PASS';
      if (detail) body.append(h('span', 'dt', detail));
    } catch(e) {
      status.className = 'st f'; status.textContent = 'FAIL';
      body.append(h('span', 'dt', e.message || String(e)));
    }
  };
  const requireParts = async (id, parts) => {
    if (!window.JSZip) throw new Error('JSZip ไม่พร้อม');
    const { blob } = await getDemoArtifact(id);
    const zip = await JSZip.loadAsync(blob);
    for (const path of parts) {
      const part = zip.file(path);
      if (!part) throw new Error('ขาด ' + path);
      if (/\.xml$/.test(path)) {
        const doc = new DOMParser().parseFromString(await part.async('string'), 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML ผิดรูปแบบ: ' + path);
      }
    }
    return `${parts.length} ส่วน · ${byteSize(blob.size)}`;
  };
  try {
    await check('PDF พร้อม xref', async () => {
      const pdf = await (await getDemoArtifact('pdf')).blob.text();
      const match = pdf.match(/startxref\n(\d+)\n%%EOF/);
      if (!pdf.startsWith('%PDF-') || !match || pdf.slice(Number(match[1]), Number(match[1])+4) !== 'xref') throw new Error('ส่วนหัว/xref ไม่ถูกต้อง');
      return byteSize(pdf.length);
    });
    await check('PowerPoint (.pptx)', () => requireParts('pptx', ['[Content_Types].xml','ppt/presentation.xml','ppt/slides/slide1.xml','ppt/slideMasters/slideMaster1.xml','ppt/theme/theme1.xml']));
    await check('Word (.docx)', () => requireParts('docx', ['[Content_Types].xml','_rels/.rels','word/document.xml']));
    await check('Excel (.xlsx)', () => requireParts('xlsx', ['[Content_Types].xml','xl/workbook.xml','xl/worksheets/sheet1.xml']));
    await check('PNG + JPG', async () => {
      const png = new Uint8Array(await (await getDemoArtifact('png')).blob.arrayBuffer());
      const jpg = new Uint8Array(await (await getDemoArtifact('jpg')).blob.arrayBuffer());
      if (png[0] !== 137 || png[1] !== 80 || png[2] !== 78 || png[3] !== 71 || jpg[0] !== 255 || jpg[1] !== 216) throw new Error('ลายเซ็นไฟล์ภาพไม่ถูกต้อง');
      return 'PNG + JPEG ที่เปิดได้';
    });
    await check('ZIP รวมทุกไฟล์', async () => {
      if (!window.JSZip) throw new Error('JSZip ไม่พร้อม');
      const zip = await JSZip.loadAsync(await getDemoZip(DEMO_SPECS.map(s => s.id)));
      const missing = DEMO_SPECS.filter(s => !zip.file(s.name));
      if (missing.length) throw new Error('ขาด ' + missing.map(s => s.name).join(', '));
      return `${DEMO_SPECS.length} ไฟล์ครบ`;
    });
    await check('อ่านข้อความจาก DOCX / PPTX / XLSX', async () => {
      const got = [];
      for (const id of ['docx', 'pptx', 'xlsx']) {
        const { spec, blob } = await getDemoArtifact(id);
        const text = await officeText(blob, spec.name);
        if (!/kiln|hello|name/i.test(text)) throw new Error('อ่าน ' + spec.name + ' ไม่เจอข้อความ');
        got.push(spec.name);
      }
      return got.join(' · ');
    });
    await check('แนบ ZIP กลับเข้ามา = ไฟล์แนบ 1 ชิ้น', async () => {
      const z = await readZip(await getDemoZip(DEMO_SPECS.map(s => s.id)), 'kiln-test-all.zip');
      if (z.type !== 'zip') throw new Error('ไม่ได้รวมเป็นก้อนเดียว');
      if (z.total !== DEMO_SPECS.length) throw new Error(`นับได้ ${z.total} ไฟล์ ควรเป็น ${DEMO_SPECS.length}`);
      return `1 ชิ้น · อ่านได้ ${z.files.length} · ข้าม ${z.skipped.length}`;
    });
  } finally {
    const summary = h('div', 'status ' + (passed === total ? 'ok' : 'bad'), `ตรวจได้ ${passed}/${total} รายการ`);
    box.prepend(summary); btn.disabled = false; btn.textContent = 'ตรวจอีกครั้ง';
  }
};

/* ─────────── boot ─────────── */
(function boot() {
  initTheme(); injectCustom();
  if (!chats.length) newChat(); else curId = chats[0].id;
  drawRail(); drawThread(); drawAtt(); setBusy(false); grow(); syncSend();
  window.addEventListener('beforeunload', () => ctrl?.abort());
  window.addEventListener('beforeunload', () => {
    [...demoUrls.values(), ...demoZipUrls.values()].forEach(url => URL.revokeObjectURL(url));
    demoUrls.clear(); demoZipUrls.clear();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $$('.sheet-wrap.on').forEach(s => s.classList.remove('on')); railClose(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); newChat(); ta.focus(); }
  });
  // เรนเดอร์ใหม่เมื่อฟอนต์มาถึง เพื่อไม่ให้ความสูงกระตุก
  document.fonts?.ready.then(() => grow());
})();
