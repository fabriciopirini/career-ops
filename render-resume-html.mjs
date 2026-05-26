#!/usr/bin/env node

/**
 * render-resume-html.mjs — Generate resume HTML from portfolio TypeScript data
 *
 * Writes a temp script, runs via tsx to import actual TypeScript, renders HTML.
 * No Next.js caching issues. No fragile regex.
 *
 * Usage: node render-resume-html.mjs <output.html> [--variant default|growth|product]
 */

import { writeFile, mkdir } from 'fs/promises';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO_DIR = resolve(__dirname, '../portfolio');

function log(l, m) {
  const t = new Date().toISOString().split('T')[1].split('.')[0];
  const p = { i: '📋', s: '✅', w: '⚠️', e: '❌' };
  console.log(`${p[l]||'ℹ️'} [${t}] ${m}`);
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function importData(v) {
  const tmp = resolve(PORTFOLIO_DIR, '.tmp-extract.cjs');
  const vs = JSON.stringify(v);
  const script = 'const{CAREER}=require(\'./lib/career-data.ts\');\n' +
    `const d={subtitle:CAREER.subtitle[${vs}],summary:typeof CAREER.summary[${vs}]==='function'?CAREER.summary[${vs}](9):CAREER.summary[${vs}],` +
    `skills:CAREER.skills[${vs}],` +
    `jobs:CAREER.jobs.filter(j=>CAREER.jobOrder[${vs}]&&CAREER.jobOrder[${vs}].includes(j.id))` +
    `.sort((a,b)=>CAREER.jobOrder[${vs}].indexOf(a.id)-CAREER.jobOrder[${vs}].indexOf(b.id))` +
    `.map(j=>({id:j.id,company:j.company,location:j.location,` +
    `periods:j.periods.map(p=>({role:p.role,start:p.start,end:p.end,` +
    `bullets:p.bullets[${vs}]||p.bullets['default']||[]}))}))};\n` +
    'console.log(JSON.stringify(d));';
  writeFileSync(tmp, script, 'utf-8');
  const out = execSync(`npx tsx ${tmp}`, {encoding:'utf-8',maxBuffer:10*1024*1024,cwd:PORTFOLIO_DIR});
  try { unlinkSync(tmp); } catch {}
  return JSON.parse(out.trim());
}

function render(d) {
  const {subtitle,summary,skills,jobs}=d;
  const sv={mail:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    globe:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    li:`<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>`,
    gh:`<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`};

  const sh=(skills||[]).map(s=>`<div class="si"><b>${esc(s.label)}:</b> ${esc(s.value)}</div>`).join('\n');

  const jh=(jobs||[]).flatMap(j=>(j.periods||[]).map((p,i)=>`
<div class="job">
  <div class="jh"><div${i===0?' class="jc"':''}>${i===0?esc(j.company):''}</div><div class="jp">${esc(p.start)} &ndash; ${esc(p.end)}</div></div>
  <div class="jr">${esc(p.role)}</div>
  ${i===0?`<div class="jl">${esc(j.location)}</div>`:''}
  <ul>${(p.bullets||[]).map(b=>`<li>${esc(b)}</li>`).join('\n')}</ul>
</div>`)).join('\n');

  return`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
  @font-face{font-family:'Roboto';src:url('file://${PORTFOLIO_DIR}/public/fonts/roboto-latin.woff2')format('woff2');font-weight:100 900;}
  @font-face{font-family:'Source Sans 3';src:url('file://${PORTFOLIO_DIR}/public/fonts/source-sans-3-latin.woff2')format('woff2');font-weight:100 900;}
  @font-face{font-family:'Source Sans 3';src:url('file://${PORTFOLIO_DIR}/public/fonts/source-sans-3-latin-italic.woff2')format('woff2');font-weight:100 900;font-style:italic;}
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:'Source Sans 3',sans-serif;font-size:11px;line-height:1.5;color:#374151;background:#fff;-webkit-font-smoothing:antialiased}
  .p{width:100%;padding:2cm;display:flex;flex-direction:column;align-items:center}
  .d{max-width:210mm;width:100%}
  .h{display:flex;flex-direction:column;align-items:center;margin-bottom:22px}
  .h h1{font-family:Roboto,sans-serif;font-size:28px;font-weight:700;color:#111827;margin-bottom:2px}
  .h .sub{font-size:11px;font-weight:600;font-variant-caps:small-caps;letter-spacing:0.5px;color:#0395de}
  .h .loc{font-size:11px;font-weight:500;font-style:italic;color:#9ca3af;margin-top:2px}
  .cr{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 20px;margin-top:10px;font-size:11px;color:#374151}
  .cr a{color:#374151;text-decoration:none}
  .cr svg{vertical-align:middle;margin-right:3px;color:#6b7280}
  .cr .s{color:#d1d5db}
  .se{margin-bottom:18px}
  .st{font-family:Roboto,sans-serif;font-size:16px;font-weight:700;color:#111827;margin-bottom:8px}
  .st .ac{color:#0395de}
  .su{font-size:11px;line-height:1.6;color:#374151}
  .tag{display:inline-block;font-size:10px;font-weight:500;color:#0395de;background:#f0f9ff;padding:3px 8px;border-radius:3px;border:1px solid #bae6fd;margin:0 3px 4px 0}
  .job{margin-bottom:14px}
  .jh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:2px}
  .jc{font-family:Roboto,sans-serif;font-size:14px;font-weight:700;color:#0395de}
  .jp{font-size:11px;color:#6b7280;white-space:nowrap}
  .jr{font-size:11px;font-weight:600;color:#374151;margin-bottom:3px;font-variant-caps:small-caps;letter-spacing:0.3px}
  .jl{font-size:10px;color:#9ca3af;margin-bottom:4px}
  .job ul{padding-left:20px;margin-top:3px}
  .job li{font-size:10.5px;line-height:1.55;color:#374151;margin-bottom:3px}
  .sg{display:flex;flex-wrap:wrap;gap:4px 16px}
  .si{font-size:10.5px;color:#374151}
  .si b{font-weight:600;color:#111827}
  .edu{margin-bottom:10px}
  .eh{display:flex;justify-content:space-between;align-items:baseline}
  .et{font-weight:600;font-size:11px;color:#111827}
  .ey{font-size:10px;color:#6b7280;white-space:nowrap}
  .eo{color:#0395de;font-size:10.5px;font-weight:500}
  @media print{html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{-webkit-font-smoothing:auto;box-shadow:none}.p{padding:2cm}}
  .job,.edu{break-inside:avoid}
</style></head><body><div class="p"><div class="d">
<div class="h"><h1>Fabricio Tramontano Pirini</h1><div class="sub">${esc(subtitle)}</div>
<div class="loc">Brazil (UTC -3)</div>
<div class="cr">${sv.mail} fabricio@fabriciopirini.com<span class="s">|</span>
${sv.li} <a href="https://linkedin.com/in/fabriciopirini">fabriciopirini</a><span class="s">|</span>
${sv.gh} <a href="https://github.com/fabriciopirini">fabriciopirini</a><span class="s">|</span>
${sv.globe} <a href="https://fabriciopirini.com">fabriciopirini.com</a></div></div>

<div class="se"><div class="st"><span class="ac">Pro</span>fessional Summary</div><div class="su">${esc(summary)}</div></div>

<div class="se"><div class="st"><span class="ac">Cor</span>e Competencies</div>
<span class="tag">React &amp; TypeScript</span><span class="tag">Node.js</span><span class="tag">Full Stack</span>
<span class="tag">Design Systems</span><span class="tag">Testing &amp; CI/CD</span><span class="tag">Customer-facing</span></div>

<div class="se"><div class="st"><span class="ac">Tec</span>hnical Skills</div><div class="sg">${sh}</div></div>

<div class="se"><div class="st"><span class="ac">Pro</span>fessional Experience</div>${jh}</div>

<div class="se"><div class="st"><span class="ac">Edu</span>cation</div>
<div class="edu"><div class="eh"><div class="et">Bachelor of Computer Engineering</div><div class="ey">2012 &ndash; 2018</div></div><div class="eo">UNIFEI &ndash; Universidade Federal de Itajuba, Brazil</div></div>
<div class="edu"><div class="eh"><div class="et">Exchange &ndash; Electrical &amp; Computer Engineering</div><div class="ey">2013 &ndash; 2014</div></div><div class="eo">University of Toronto, Canada</div></div></div>

</div></body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  let output = null, variant = 'default';
  for (const a of args) {
    if (a.startsWith('--variant=')) { variant = a.split('=')[1]; continue; }
    if (!a.startsWith('--') && !output) { output = resolve(__dirname, a); }
  }
  if (!output) { console.error('Usage: node render-resume-html.mjs <output.html> [--variant=default|growth|product]'); process.exit(1); }

  log('i', `Importing variant '${variant}'...`);
  const d = importData(variant);

  log('i', `Summary: ${(d.summary||'').substring(0,80)}...`);
  log('i', `Skills: ${(d.skills||[]).length} jobs: ${(d.jobs||[]).length}`);
  if(d.jobs?.[0]?.periods?.[0]?.bullets?.length>0)
    log('i', `Bullet 0: ${d.jobs[0].periods[0].bullets[0].substring(0,60)}...`);

  const html = render(d);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html, 'utf-8');
  log('s', `Rendered: ${output} (${(html.length/1024).toFixed(1)} KB)`);
  process.stdout.write(output);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });