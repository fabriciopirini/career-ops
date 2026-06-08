#!/usr/bin/env node

/**
 * application-form.mjs — Extract application form questions + generate draft answers
 *
 * Opens a JD URL with Playwright, finds the Apply link, extracts form fields,
 * reads the evaluation report + career data, and generates tailored answers.
 *
 * Usage:
 *   node application-form.mjs <jd-url> --report <report-path> --output <output.md>
 *   node application-form.mjs <jd-url> --company "Company" --role "Role" --output <output.md>
 *
 * Output: output/{###}-{company}-form-answers.md (questions + generated answers)
 *
 * NOTE: Generated answers are for the user to review and copy into the form.
 * NEVER submit the application — the user makes the final call.
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAREER_OPS_DIR = resolve(__dirname);
const PORTFOLIO_DIR = resolve(__dirname, '../portfolio');

function log(level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = { i: '📋', s: '✅', w: '⚠️', e: '❌' };
  process.stderr.write(`${prefix[level] || 'ℹ️'} [${timestamp}] ${message}\n`);
}

// ============================================================
// CAREER DATA IMPORT (same pattern as render-resume-html.mjs)
// ============================================================

function importCareerData(variant = 'default') {
  const tmp = resolve(PORTFOLIO_DIR, '.tmp-extract.cjs');
  const vs = JSON.stringify(variant);
  const script = `const{CAREER}=require('./lib/career-data.ts');
const d={subtitle:CAREER.subtitle[${vs}],summary:typeof CAREER.summary[${vs}]==='function'?CAREER.summary[${vs}](9):CAREER.summary[${vs}],
skills:CAREER.skills[${vs}],
jobs:CAREER.jobs.filter(j=>CAREER.jobOrder[${vs}]&&CAREER.jobOrder[${vs}].includes(j.id))
.sort((a,b)=>CAREER.jobOrder[${vs}].indexOf(a.id)-CAREER.jobOrder[${vs}].indexOf(b.id))
.map(j=>({id:j.id,company:j.company,location:j.location,
periods:j.periods.map(p=>({role:p.role,start:p.start,end:p.end,bullets:p.bullets['default']||[]}))}))};
console.log(JSON.stringify(d));`;
  writeFileSync(tmp, script, 'utf-8');
  const out = execSync(`npx tsx ${tmp}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: PORTFOLIO_DIR });
  try { unlinkSync(tmp); } catch {}
  return JSON.parse(out.trim());
}

// ============================================================
// FORM EXTRACTION VIA PLAYWRIGHT
// ============================================================

async function extractFormFields(page, jdUrl) {
  log('i', `Opening JD: ${jdUrl}`);
  await page.goto(jdUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const pageTitle = await page.title();
  const pageUrl = page.url();
  log('i', `Page title: ${pageTitle}`);

  // Look for Apply button/link — common patterns
  const applySelectors = [
    'a[href*="apply"]', 'button:has-text("Apply")', 'a:has-text("Apply")',
    'button:has-text("apply")', 'a:has-text("apply")',
    '[data-automation-id*="apply"]', '[class*="apply"]',
    'a[href*="/applications/new"]', 'a[href*="job-board"]',
  ];

  let applyClicked = false;
  for (const sel of applySelectors) {
    const el = await page.$(sel);
    if (el) {
      const text = await el.textContent().catch(() => '');
      const href = await el.getAttribute('href').catch(() => '');
      log('i', `Found Apply element: "${(text||'').trim()}" href="${href||''}"`);

      // If it's an external link, navigate
      if (href && (href.startsWith('http') || href.startsWith('//'))) {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        applyClicked = true;
        break;
      }

      // If it's a relative link, navigate
      if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
        const absUrl = new URL(href, pageUrl).href;
        await page.goto(absUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        applyClicked = true;
        break;
      }

      // Click the button
      try {
        await el.click({ timeout: 5000 });
        await page.waitForTimeout(3000);
        applyClicked = true;
        break;
      } catch {
        continue;
      }
    }
  }

  if (!applyClicked) {
    log('w', 'Could not find Apply button — will use JD content as-is');
  } else {
    log('s', 'Navigated to application form');
  }

  // Extract form fields from the current page
  const formFields = await extractFormFieldsViaDom(page);
  return { pageTitle, pageUrl, formFields, applyClicked };
}

async function extractFormFieldsViaDom(page) {
  return await page.evaluate(() => {
    const result = [];

    // Helper: resolve label for an element
    function getInputLabel(el) {
      const id = el.getAttribute('id');
      if (id) {
        const lbl = document.querySelector(`label[for="${id}"]`);
        if (lbl && lbl.textContent) return lbl.textContent.trim();
      }
      const aria = el.getAttribute('aria-label');
      if (aria) return aria.trim();
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();
      return '';
    }

    // Helper: check if element is inside any fieldset
    function closestFieldset(el) {
      let p = el.parentElement;
      while (p) {
        if (p.tagName === 'FIELDSET') return p;
        p = p.parentElement;
      }
      return null;
    }

    // --- Step 1: Process all fieldsets (Ashby, Lever, some custom) ---
    const fieldsets = document.querySelectorAll('fieldset');
    fieldsets.forEach(fs => {
      const legend = fs.querySelector('legend');
      let question = legend ? legend.textContent.trim() : '';
      if (!question) {
        // Some ATS (Ashby) put the question in the first label, not a legend
        const firstLabel = fs.querySelector('label:first-child, div:first-child label, p:first-child');
        if (firstLabel && firstLabel.textContent) question = firstLabel.textContent.trim();
      }
      // Try parent heading as fallback
      if (!question) {
        const prev = fs.previousElementSibling;
        if (prev && ['H1','H2','H3','H4','H5','H6'].includes(prev.tagName)) {
          question = prev.textContent.trim();
        }
      }

      const inputs = fs.querySelectorAll('input, textarea, select');
      const options = [];
      let seenLabels = new Set();

      inputs.forEach(inp => {
        const type = (inp.getAttribute('type') || '').toLowerCase();
        if (['hidden', 'submit', 'button', 'image', 'reset', 'file'].includes(type)) return;
        const label = getInputLabel(inp);
        if (!label || seenLabels.has(label)) return;
        seenLabels.add(label);
        options.push({
          label,
          type: inp.tagName === 'SELECT' ? 'dropdown' : type,
          required: inp.hasAttribute('required') || inp.getAttribute('aria-required') === 'true',
        });
      });

      if (options.length > 0) {
        result.push({
          type: 'group',
          question: question || '(grouped options)',
          inputType: options[0].type === 'radio' ? 'radio' : options[0].type === 'checkbox' ? 'checkbox' : 'mixed',
          options,
          required: options.some(o => o.required),
        });
      }
    });

    // --- Step 2: Check for iframes (Greenhouse embed, etc.) ---
    const iframes = document.querySelectorAll('iframe[src*="greenhouse"], iframe[src*="ashby"], iframe[src*="lever"], iframe[src*="apply"]');
    iframes.forEach(iframe => {
      result.push({
        type: 'iframe',
        src: iframe.src || '',
        note: 'Form is inside an iframe. May need to load iframe content separately.',
      });
    });

    // --- Step 3: Standalone fields (not in any fieldset) ---
    const standaloneSelectors = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]), textarea, select';
    document.querySelectorAll(standaloneSelectors).forEach(el => {
      if (closestFieldset(el)) return;
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'file') return;
      const label = getInputLabel(el);
      if (!label) return;
      if (result.some(r => r.type !== 'group' && r.type !== 'iframe' && r.label === label)) return;

      let fieldType = el.tagName.toLowerCase();
      if (fieldType === 'input') fieldType = type || 'text';
      if (fieldType === 'select') fieldType = 'dropdown';
      if (el.getAttribute('role') === 'textbox') fieldType = 'textarea';

      result.push({
        type: 'field',
        label,
        inputType: fieldType,
        required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
      });
    });

    // --- Step 4: File uploads ---
    document.querySelectorAll('input[type="file"]').forEach(el => {
      const label = getInputLabel(el) || 'Resume/CV upload';
      result.push({ type: 'file', label, required: el.hasAttribute('required') });
    });

    return result;
  });
}

// ============================================================
// QUESTION CLASSIFICATION
// ============================================================

function classifyQuestions(fields) {
  const questions = [];

  for (const f of fields) {
    if (f.type === 'group') {
      // Grouped radio/checkbox options under a fieldset
      const lbl = f.question.toLowerCase();
      let category = 'general';
      let guidance = 'Select options that match your experience. Be honest.';

      if (/primary expertise|engineer|role.*apply/i.test(lbl)) {
        category = 'role_selection';
        guidance = 'Select the option that best matches your primary expertise.';
      } else if (/programming languages|technologies|proficient|tech stack/i.test(lbl)) {
        category = 'tech_stack';
        guidance = 'Select all that apply. Focus on what you use professionally.';
      } else if (/factors.*important|what matters|culture|value/i.test(lbl)) {
        category = 'culture_fit';
        guidance = 'Select top factors. Be genuine.';
      } else if (/how did you discover|hear about|found us/i.test(lbl)) {
        category = 'source';
        guidance = 'True answer. If LinkedIn, say that.';
      }

      questions.push({
        type: 'group',
        question: f.question,
        inputType: f.inputType,
        options: f.options.map(o => o.label),
        required: f.required,
        category,
        guidance,
      });
    } else if (f.type === 'file') {
      const lbl = f.label.toLowerCase();
      let category = 'file_upload';
      let guidance = 'Upload the generated PDF.';
      if (/cover letter/i.test(lbl)) {
        category = 'cover_letter_upload';
        guidance = 'Upload the generated cover letter PDF.';
      }
      questions.push({
        type: 'file',
        label: f.label,
        required: f.required,
        category,
        guidance,
      });
    } else {
      // Standalone text/textarea/email field
      const lbl = f.label.toLowerCase();
      let category = 'general';
      let guidance = 'Answer concisely. Reference specific proof points where relevant.';

      if (/name/i.test(lbl) && f.inputType === 'text') {
        category = 'name';
        guidance = 'Full name from profile.yml.';
      } else if (/email/i.test(lbl)) {
        category = 'email';
        guidance = 'Email from profile.yml.';
      } else if (/linkedin/i.test(lbl)) {
        category = 'link';
        guidance = 'LinkedIn URL from profile.yml.';
      } else if (/github|gitlab/i.test(lbl)) {
        category = 'link';
        guidance = 'GitHub URL from profile.yml.';
      } else if (/cover letter|coverletter/i.test(lbl)) {
        category = 'cover_letter';
        guidance = 'Write a brief, tailored cover letter. 1 paragraph max.';
      } else if (/why.*(this|our).*(company|role)|why.*interested|what.*excite.*about/i.test(lbl)) {
        category = 'why_company';
        guidance = 'Specific reasons tied to the company product/stack + CV proof point.';
      } else if (/experience|background|tell me about yourself|describe your/i.test(lbl)) {
        category = 'experience';
        guidance = 'Current role + one standout achievement matching the JD. 2-3 sentences.';
      } else if (/bullets|exceptional ability|achievements/i.test(lbl)) {
        category = 'achievements';
        guidance = '3 bullets showing measurable impact. Use CV proof points.';
      } else if (/salary|compensation|pay|expect/i.test(lbl)) {
        category = 'salary';
        guidance = 'Target range from profile.yml. Add flexibility note.';
      } else if (/visa|work authorization|sponsorship|legally.*work/i.test(lbl)) {
        category = 'visa';
        guidance = 'Brazilian citizen, remote contractor. No sponsorship needed.';
      } else if (/start date|availability|notice period|when can you/i.test(lbl)) {
        category = 'availability';
        guidance = 'Current situation be honest about notice period.';
      } else if (/relocation|relocate|move/i.test(lbl)) {
        category = 'relocation';
        guidance = 'Fully remote. Available for occasional travel if needed.';
      } else if (/website|portfolio|url|link/i.test(lbl)) {
        category = 'link';
        guidance = 'Portfolio URL from profile.yml.';
      } else if (/loom|video/i.test(lbl)) {
        category = 'optional_video';
        guidance = 'Optional. If skipping, mention you are happy to schedule a call instead.';
      }

      questions.push({
        type: 'field',
        label: f.label,
        inputType: f.inputType,
        required: f.required,
        category,
        guidance,
      });
    }
  }

  return questions;
}

// ============================================================
// DRAFT GENERATION (Stub — LLM fills this via prompt injection)
// ============================================================

function generateDraftAnswers(questions, company, role, reportData, careerData, jdUrl) {
  const slug = slugify(company);

  const lines = [
    `# Application Form Answers — ${company} — ${role}`,
    '',
    `**JD URL:** ${jdUrl}`,
    `**Score:** ${reportData.score || 'N/A'}`,
    `**Archetype:** ${reportData.archetype || 'N/A'}`,
    '',
    '_Generated for review. The user copies answers into the form. I never submit._',
    '',
    '---',
    '',
  ];

  for (const q of questions) {
    if (q.type === 'group') {
      // Fieldset group: radio or checkbox options
      lines.push(`## ${q.question} [${q.inputType}]${q.required ? ' *' : ''}`);
      lines.push('');
      lines.push(`**Category:** ${q.category}`);
      lines.push(`**Guidance:** ${q.guidance}`);
      lines.push('');
      lines.push('**Options:**');
      for (const opt of q.options) {
        lines.push(`- [ ] ${opt}`);
      }
      lines.push('');
      lines.push('**Selected:**');
      lines.push('> [Draft answer with selected options and reasoning]');
      lines.push('');
    } else if (q.type === 'file') {
      lines.push(`## ${q.label} (file upload)`);
      lines.push('');
      lines.push(`> Upload the generated PDF. Resume: \`Fabricio-Pirini-Resume.pdf\` (same folder as this file)`);
      if (q.category === 'cover_letter_upload') {
        lines.push(`> Cover letter: \`Fabricio-Pirini-Cover-Letter.pdf\` (same folder)`);
      }
      lines.push('');
    } else {
      // Standalone field
      lines.push(`## ${q.label} [${q.inputType}]${q.required ? ' *' : ''}`);
      lines.push('');
      lines.push(`**Category:** ${q.category}`);
      lines.push(`**Guidance:** ${q.guidance}`);
      lines.push('');
      lines.push('```');
      if (q.category === 'name') {
        lines.push('Fabricio Tramontano Pirini');
      } else if (q.category === 'email') {
        lines.push('fabricio@fabriciopirini.com');
      } else if (q.category === 'link') {
        if (/linkedin/i.test(q.label)) lines.push('https://linkedin.com/in/fabriciopirini');
        else if (/github|gitlab/i.test(q.label)) lines.push('https://github.com/fabriciopirini');
        else lines.push('https://fabriciopirini.com');
      } else {
        lines.push(`[Draft answer for "${q.label}" goes here]`);
      }
      lines.push('```');
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================================
// REPORT PARSER
// ============================================================

function parseReport(reportPath) {
  const content = readFileSync(reportPath, 'utf-8');
  const scoreMatch = content.match(/\*\*Score:\*\*\s*([\d.]+)\/5/);
  const archetypeMatch = content.match(/\*\*Archetype:\*\*\s*(.+)/);
  const companyMatch = content.match(/^# Evaluation:\s*(.+?)\s*—/);
  const roleMatch = content.match(/—\s*(.+?)$/m);

  return {
    content,
    score: scoreMatch ? scoreMatch[1] : '',
    archetype: archetypeMatch ? archetypeMatch[1].trim() : '',
    company: companyMatch ? companyMatch[1].trim() : '',
    role: roleMatch ? roleMatch[1].trim() : '',
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  let jdUrl = '', reportPath = '', outputPath = '', company = '', role = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report' && args[i + 1]) reportPath = resolve(__dirname, args[++i]);
    else if (args[i] === '--output' && args[i + 1]) outputPath = resolve(__dirname, args[++i]);
    else if (args[i] === '--company' && args[i + 1]) company = args[++i];
    else if (args[i] === '--role' && args[i + 1]) role = args[++i];
    else if (!args[i].startsWith('--')) jdUrl = args[i];
  }

  if (!jdUrl) {
    console.error('Usage: node application-form.mjs <jd-url> --report <report-path> --output <output.md>');
    console.error('       node application-form.mjs <jd-url> --company "C" --role "R" --output <output.md>');
    process.exit(1);
  }

  // Load career data
  log('i', 'Loading career data from portfolio...');
  const careerData = importCareerData('default');

  // Load evaluation report if provided
  let reportData = { content: '', score: '', archetype: '', company, role };
  if (reportPath && existsSync(reportPath)) {
    reportData = parseReport(reportPath);
    company = company || reportData.company;
    role = role || reportData.role;
    log('s', `Loaded report: ${reportData.company} — ${reportData.role} (${reportData.score}/5)`);
  }

  if (!company) company = 'Company';
  if (!role) role = 'Role';

  // Extract form fields via Playwright
  log('i', 'Launching browser to extract form fields...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let formFields = [];
  let extracted = false;
  try {
    const result = await extractFormFields(page, jdUrl);
    formFields = result.formFields;

    log('i', `Form fields found: ${formFields.length}`);
    let hasIframe = false;
    if (formFields.length > 0) {
      formFields.forEach(f => {
        if (f.type === 'group') {
          log('i', `  ${f.required ? '*' : ' '} [fieldset:${f.inputType}] ${f.question} (${f.options.length} options)`);
        } else if (f.type === 'iframe') {
          log('w', `  [iframe] ${f.src} - form inside iframe, manual extraction may be needed`);
          hasIframe = true;
        } else if (f.type === 'file') {
          log('i', `  ${f.required ? '*' : ' '} [file] ${f.label}`);
        } else {
          log('i', `  ${f.required ? '*' : ' '} [${f.inputType}] ${f.label}`);
        }
      });
      if (hasIframe) {
        log('w', 'Some ATS platforms embed the form in an iframe. The script extracts what it can.');
      }
    } else {
      log('w', 'No form fields detected. The page may not be a standard ATS form.');
    }
    extracted = true;
  } catch (err) {
    log('e', `Playwright extraction failed: ${err.message}`);
  } finally {
    await browser.close();
  }

  // If no form fields found, generate generic question set
  let questions;
  if (formFields.length > 0) {
    questions = classifyQuestions(formFields);
  } else {
    log('i', 'Using generic question set (form extraction unavailable)');
    questions = [
      { originalLabel: 'Cover Letter or Why are you interested?', type: 'textarea', required: true, category: 'cover_letter', guidance: '' },
      { originalLabel: 'Relevant Experience', type: 'textarea', required: true, category: 'experience', guidance: '' },
      { originalLabel: 'Salary Expectations', type: 'text', required: false, category: 'salary', guidance: '' },
      { originalLabel: 'Work Authorization', type: 'text', required: true, category: 'visa', guidance: '' },
    ];
  }

  // Generate draft answer structure
  const answers = generateDraftAnswers(questions, company, role, reportData, careerData, jdUrl);

  // Write output
  if (!outputPath) {
    const companySlug = slugify(company);
    const today = new Date().toISOString().slice(0, 10);
    outputPath = resolve(__dirname, 'output', companySlug, `${today}-${slugify(role)}`, 'form-answers.md');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, answers, 'utf-8');
  log('s', `Form answers stub written: ${outputPath}`);
  log('w', 'The LLM agent must fill in the actual draft answers using the JD + career data + report.');

  // Output metadata for the agent
  const meta = {
    company,
    role,
    jdUrl,
    score: reportData.score,
    archetype: reportData.archetype,
    fieldGroups: formFields.filter(f => f.type === 'group').length,
    standaloneFields: formFields.filter(f => f.type === 'field').length,
    fileUploads: formFields.filter(f => f.type === 'file').length,
    total: formFields.length,
    questions: questions.map(q => ({
      type: q.type,
      label: q.label || q.question,
      category: q.category,
      required: q.required,
    })),
    outputPath,
    reportPath: reportPath || null,
  };
  console.log(JSON.stringify(meta));
}

main().catch(e => {
  process.stderr.write(`❌ ${e.message}\n`);
  process.exit(1);
});
