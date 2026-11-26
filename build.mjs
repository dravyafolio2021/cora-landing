// Builds the static site into dist/: fills the tile/logo/strip slots, self-hosts fonts, renders og-image.png.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as si from 'simple-icons';

const require = createRequire(import.meta.url);
const OUT = 'dist';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });

const prodHost = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''));
const SITE = prodHost.replace(/\/$/, '');

// ---------- icons (official marks from simple-icons) ----------
const ICON = { whatsapp: 'siWhatsapp', gmail: 'siGmail', razorpay: 'siRazorpay', gcal: 'siGooglecalendar', gmeet: 'siGooglemeet', wordpress: 'siWordpress', claude: 'siClaude', gemini: 'siGooglegemini' };
const svg = (k, hidden) => { const i = si[ICON[k]]; return `<svg viewBox="0 0 24 24" ${hidden ? 'aria-hidden="true"' : `role="img" aria-label="${i.title}"`}><path fill="#${i.hex}" d="${i.path}"/></svg>`; };

// ---------- hero ring tiles ----------
const tiles = [
  ['dark', 'Dashboard', 'Overview', `<div class="big-num">₹4.8L</div><div class="bars"><span style="height:40%"></span><span style="height:55%"></span><span style="height:48%"></span><span style="height:70%"></span><span class="on" style="height:92%"></span></div>`],
  ['', 'CRM', 'Pipeline', `<div class="cols"><div><small>New</small><i></i><i></i><i></i></div><div><small>Call</small><i class="g"></i><i></i></div><div><small>Won</small><i class="g"></i></div></div>`],
  ['green', 'Portal', 'Client portal', `<div class="row"><span class="dot" style="background:#fff"></span>Approve logo<span class="end">✓</span></div><div class="row"><span class="dot" style="background:#fff"></span>Upload brief<span class="end">1</span></div><div class="row"><span class="dot" style="background:#fff"></span>Pay invoice<span class="end">₹</span></div>`],
  ['cream', 'Finance', 'GST invoice', `<div class="row">Retainer · Nov<span class="end">45,000</span></div><div class="row">GST 18%<span class="end">8,100</span></div><div class="row" style="background:var(--ink);color:#fff">Total<span class="end">₹53,100</span></div>`],
  ['', 'Tasks', 'This week', `<div class="check ok"><i></i><span>Kickoff call</span></div><div class="check ok"><i></i><span>Moodboard</span></div><div class="check"><i></i><span>Homepage v2</span></div><div class="check"><i></i><span>Ad creatives</span></div>`],
  ['dark', 'Canvas', 'Your website', `<div class="browser"><div class="bar"><i></i><i></i><i></i></div><div class="pg"><div class="ln k"></div><div class="ln w80"></div><div class="ln w60"></div><span class="pill-s k" style="justify-self:start">Book a call</span></div></div>`],
  ['', 'Bookings', 'Calendar', `<div class="cal"><span></span><span class="b"></span><span></span><span class="g"></span><span></span><span class="b"></span><span></span><span class="g"></span><span></span><span class="b"></span><span class="b"></span><span></span><span></span><span></span></div>`],
  ['dark', 'AI', 'Co-founder', `<div class="bubble me">Who owes us?</div><div class="bubble ai">2 clients, ₹71k. Remind them?</div>`],
  ['cream', 'Inbox', 'One inbox', `<div class="brandrow">${svg('whatsapp')}Mehta &amp; Co.<span class="end">2</span></div><div class="brandrow">${svg('gmail')}Urban Nest<span class="end">1</span></div><div class="brandrow">${svg('gcal')}Kickoff, 4 pm</div>`],
  ['green', 'Team', 'Attendance', `<div class="pin"></div><div class="row" style="justify-content:center">Checked in · 9:42</div>`],
  ['', 'Import', 'Any CSV', `<div class="tbl"><div class="h"><span>Name</span><span>Phone</span><span>Tag</span></div><div><span>Aarav M.</span><span>98…21</span><span>Hot</span></div><div><span>Riya S.</span><span>99…07</span><span>New</span></div><div><span>Kabir J.</span><span>97…54</span><span>New</span></div></div>`],
  ['cream', 'Reports', 'Growth', `<div class="big-num" style="font-size:28px">+18%</div><div class="bars"><span style="height:30%"></span><span style="height:45%"></span><span class="on" style="height:60%"></span><span class="on" style="height:78%"></span><span class="on" style="height:95%"></span></div>`],
];
const tileHtml = tiles.map(([cls, tag, title, body], i) => `<div class="tile" style="--i:${i}"><a href="#product" aria-label="${title}, see Cora modules"></a><div class="face front ${cls}"><div class="t-top"><span>${tag}</span><span>${String(i + 1).padStart(2, '0')}</span></div><div class="t-title">${title}</div><div class="t-body">${body}</div></div><div class="face back"><span class="logo">cora<b></b></span></div></div>`).join('\n');

const logos = [['whatsapp', 'WhatsApp'], ['gmail', 'Gmail'], ['razorpay', 'Razorpay'], ['gcal', 'Google Calendar'], ['gmeet', 'Google Meet'], ['wordpress', 'WordPress'], ['claude', 'Claude'], ['gemini', 'Gemini']]
  .map(([k, n]) => `<li>${svg(k, true)}${n}</li>`).join('');

const strip = [['CRM', 'Pipeline'], ['Portal', 'Client portal'], ['Finance', 'GST invoices'], ['Tasks', 'Boards'], ['Canvas', 'Website'], ['Bookings', 'Calendar'], ['AI', 'Co-founder'], ['Inbox', 'One inbox'], ['Team', 'Attendance'], ['Data', 'Custom fields'], ['Reports', 'Insights'], ['MCP', 'Connect AI']]
  .map(([a, b]) => `<div class="mini"><small>${a}</small><b>${b}</b></div>`).join('');

// ---------- fonts: self-hosted latin + latin-ext from @fontsource ----------
const FONTS = [['unbounded', [300, 400, 500, 600], true], ['inter', [400, 500, 600], true], ['jetbrains-mono', [500], false]];
let faces = '';
for (const [fam, weights, ext] of FONTS) for (const w of weights) {
  const dir = path.dirname(require.resolve(`@fontsource/${fam}/package.json`));
  const css = fs.readFileSync(path.join(dir, `${w}.css`), 'utf8');
  for (const block of css.split('/*').slice(1)) {
    const name = block.slice(0, block.indexOf('*/')).trim();
    if (!/-(latin|latin-ext)-\d+-normal$/.test(name)) continue;
    if (!ext && name.includes('latin-ext')) continue;
    const file = `${name}.woff2`;
    fs.copyFileSync(path.join(dir, 'files', file), path.join(OUT, 'fonts', file));
    const range = block.match(/unicode-range:([^;]+);/)[1].trim();
    const family = block.match(/font-family: '([^']+)'/)[1];
    faces += `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:${w};src:url(/fonts/${file}) format('woff2');unicode-range:${range}}\n`;
  }
}
const fontsHtml = `<link rel="preload" href="/fonts/unbounded-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n<style>\n${faces}</style>`;

// ---------- page ----------
let html = fs.readFileSync('index.src.html', 'utf8')
  .replace('<!--FONTS-->', fontsHtml)
  .replace('<!--TILES-->', tileHtml)
  .replace('<!--LOGOS-->', logos)
  .replace('<!--STRIP-->', strip + strip)
  .replaceAll('__SITE__', SITE);
for (const slot of ['<!--FONTS-->', '<!--TILES-->', '<!--LOGOS-->', '<!--STRIP-->']) if (html.includes(slot)) throw new Error('unfilled slot ' + slot);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// ---------- og-image.png (1200x630) ----------
const woff = (fam, w) => fs.readFileSync(path.join(path.dirname(require.resolve(`@fontsource/${fam}/package.json`)), 'files', `${fam}-latin-${w}-normal.woff`));
const h = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });
const card = (label, title, bg, fg) => h('div', { width: 210, height: 250, borderRadius: 22, background: bg, color: fg, padding: 20, flexDirection: 'column', border: '1px solid #E4E4E7', boxShadow: '0 30px 50px -30px rgba(9,9,11,.45)' }, [
  h('div', { fontFamily: 'Inter', fontSize: 13, letterSpacing: 1, opacity: 0.6 }, label.toUpperCase()),
  h('div', { fontFamily: 'Unbounded', fontSize: 22, marginTop: 10 }, title),
  h('div', { marginTop: 'auto', gap: 8, alignItems: 'flex-end', height: 80 }, [40, 62, 50, 78, 96].map((v, i) => h('div', { width: 26, height: `${v}%`, borderRadius: 6, background: i > 2 ? '#10B981' : (fg === '#fff' ? '#27272A' : '#E4E4E7') }, ''))),
]);
const tree = h('div', { width: 1200, height: 630, background: '#FBFAF7', padding: '64px 72px', alignItems: 'center', gap: 40, fontFamily: 'Inter', color: '#09090B' }, [
  h('div', { flexDirection: 'column', flex: 1, gap: 26 }, [
    h('div', { fontFamily: 'Unbounded', fontSize: 34, alignItems: 'center', gap: 6 }, ['cora', h('div', { width: 11, height: 11, borderRadius: 11, background: '#10B981', marginTop: 10 }, '')]),
    h('div', { fontFamily: 'Unbounded', fontSize: 58, lineHeight: 1.08, letterSpacing: -2, flexWrap: 'wrap' }, 'Run your whole agency from one calm workspace.'),
    h('div', { fontSize: 24, color: '#52525B' }, 'CRM, client portal, GST invoices and your website. Free to start.'),
  ]),
  h('div', { position: 'relative', width: 340, height: 420 }, [
    h('div', { position: 'absolute', left: 110, top: 0 }, [card('Portal', 'Client portal', '#10B981', '#052e1f')]),
    h('div', { position: 'absolute', left: 0, top: 150 }, [card('Dashboard', 'Overview', '#09090B', '#fff')]),
  ]),
]);
const ogSvg = await satori(tree, { width: 1200, height: 630, fonts: [
  { name: 'Unbounded', data: woff('unbounded', 500), weight: 500, style: 'normal' },
  { name: 'Inter', data: woff('inter', 400), weight: 400, style: 'normal' },
] });
fs.writeFileSync(path.join(OUT, 'og-image.png'), new Resvg(ogSvg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());

// ---------- extras ----------
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''}`);
if (SITE) fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url></urlset>\n`);
console.log('built', SITE || '(no site url)', fs.readdirSync(OUT));
