import { readFileSync, writeFileSync } from 'fs';

const jobs = readFileSync('data/full-scan-detailed.tsv', 'utf8').split('\n').slice(1);
const filtered = [];

// US states to block in remote locations
const usStates = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'];
const emeaKeywords = ['emea', 'europe', 'uk', 'united kingdom', 'ireland', 'germany', 'france', 'spain', 'italy', 'poland', 'london', 'berlin', 'dublin'];

// Additional title keywords to exclude
const excludeKeywords = [
  'security', 'grc', 'developer relations', 'devrel', 'advocate',
  'machine learning', 'ml engineer', 'ai engineer', 'artificial intelligence', 'ai',
  'analytics', 'data', 'data engineer', 'manager',
  'test', 'sdet', 'quality', 'qa',
  'smart contract', 'blockchain', 'crypto', 'web3',
  'gtm', 'customer reliability',
  'chief of staff', 'it engineer', 'solutions engineer'
];

jobs.forEach(line => {
  if (!line.trim()) return;
  const [company, title, location, seniority, roleType, techStack, remote, portal, url] = line.split('\t');

  const t = title.toLowerCase();
  const loc = location.toLowerCase();

  // === Seniority Filter ===
  // No seniority filter - include all levels for manual review

  // === Role Type Filter ===
  const validRoleTypes = ['Engineering', 'Frontend', 'Fullstack'];
  if (!validRoleTypes.includes(roleType)) return;

  // === Title Filter - Exclude unwanted keywords ===
  const hasExcludedKeyword = excludeKeywords.some(kw => t.includes(kw));
  if (hasExcludedKeyword) return;

  // === Location Filter ===
  // Keep: Remote (any casing), N/A, Brazil, AMER/Americas, LATAM/Remote LATAM
  // Drop: Anything with "friendly", US-only remote (including state-specific), EMEA/UK/Europe-only
  const hasFriendly = loc.includes('friendly');
  const hasEmea = emeaKeywords.some(kw => loc.includes(kw));
  const isStateSpecificRemote = loc.includes('remote -') && usStates.some(state => loc.includes(state));
  const isUsOnlyRemote = (loc.includes('remote') || loc.includes('remote in')) && (loc.includes('us') || loc.includes('united states') || loc.includes('usa')) && !loc.includes('worldwide') && !loc.includes('global') && !loc.includes('america') && !loc.includes('latam') && !loc.includes('amer');
  const isOnsiteUs = usStates.some(state => loc.includes(state)) && !loc.includes('remote');
  const hasToronto = loc.includes('toronto') && !loc.includes('argentina'); // Canada-only, not combined
  const isNorthAmericaOnly = loc === 'north america' || loc === 'namer';
  const isBritishColumbia = loc.includes('british columbia') && !loc.includes('brazil') && !loc.includes('argentina');
  const isSanFranciscoBayArea = loc.includes('san francisco bay area');

  const keepLocation =
    loc === 'n/a' ||
    loc === 'remote' ||
    loc === 'remote (buenos aires, argentina)' ||
    loc === 'argentina remote' ||
    (loc.includes('remote') && !isStateSpecificRemote && !isUsOnlyRemote && !hasEmea && !hasToronto) ||
    loc.includes('brazil') ||
    loc.includes('amer') ||
    loc.includes('latam');

  if (hasFriendly) return;
  if (hasEmea) return;
  if (isStateSpecificRemote) return;
  if (isUsOnlyRemote) return;
  if (isOnsiteUs) return;
  if (hasToronto) return;
  if (isNorthAmericaOnly) return;
  if (isBritishColumbia) return;
  if (isSanFranciscoBayArea) return;
  if (!keepLocation && loc !== 'n/a') return;

  filtered.push({ company, title, location, seniority, roleType, techStack, remote, portal, url });
});

// Write filtered CSV
const header = ['Company', 'Title', 'Location', 'Seniority', 'Role Type', 'Tech Stack', 'Remote', 'Portal', 'URL'];
const csv = [header.join('\t'), ...filtered.map(j => [
  j.company, j.title, j.location, j.seniority, j.roleType, j.techStack, j.remote, j.portal, j.url
].join('\t'))];

writeFileSync('data/filtered-scan-detailed.tsv', csv.join('\n'));

// Generate report
let md = '# Filtered Scan Results\n\n';
md += '## Stats\n\n';
md += `- Total jobs: ${jobs.length}\n`;
md += `- Filtered down to: ${filtered.length} jobs (${((filtered.length/jobs.length)*100).toFixed(1)}%)\n\n`;

// Group by location
const byLocation = {};
filtered.forEach(j => {
  if (!byLocation[j.location]) byLocation[j.location] = [];
  byLocation[j.location].push(j);
});

md += '## Locations\n\n';
md += '| Count | Location |\n';
md += '|------|----------|\n';
Object.entries(byLocation).sort((a, b) => b[1].length - a[1].length).forEach(([loc, jobs]) => {
  md += `| ${jobs.length} | ${loc} |\n`;
});

// Group by company
const byCompany = {};
filtered.forEach(j => {
  if (!byCompany[j.company]) byCompany[j.company] = [];
  byCompany[j.company].push(j);
});

md += '\n## Companies\n\n';
md += '| Count | Company |\n';
md += '|------|---------|\n';
Object.entries(byCompany).sort((a, b) => b[1].length - a[1].length).forEach(([company, jobs]) => {
  md += `| ${jobs.length} | ${company} |\n`;
});

// Group by role type
const byRoleType = {};
filtered.forEach(j => {
  if (!byRoleType[j.roleType]) byRoleType[j.roleType] = [];
  byRoleType[j.roleType].push(j);
});

md += '\n## Role Types\n\n';
md += '| Count | Role Type |\n';
md += '|------|----------|\n';
Object.entries(byRoleType).sort((a, b) => b[1].length - a[1].length).forEach(([rt, jobs]) => {
  md += `| ${jobs.length} | ${rt} |\n`;
});

// Group by seniority
const bySeniority = {};
filtered.forEach(j => {
  if (!bySeniority[j.seniority]) bySeniority[j.seniority] = [];
  bySeniority[j.seniority].push(j);
});

md += '\n## Seniority\n\n';
md += '| Count | Seniority |\n';
md += '|------|----------|\n';
Object.entries(bySeniority).sort((a, b) => b[1].length - a[1].length).forEach(([s, jobs]) => {
  md += `| ${jobs.length} | ${s} |\n`;
});

// All filtered jobs
md += '\n## All Filtered Jobs\n\n';
md += '| # | Company | Title | Location | Seniority | Role Type |\n';
md += '|---|---------|-------|----------|-----------|----------|\n';
filtered.forEach((j, i) => {
  md += `| ${i+1} | [${j.company}](${j.url}) | ${j.title} | ${j.location} | ${j.seniority} | ${j.roleType} |\n`;
});

writeFileSync('data/filtered-scan-report.md', md);

console.log(`Filtered ${jobs.length} jobs down to ${filtered.length} jobs`);
console.log('Created:');
console.log('  - data/filtered-scan-detailed.tsv (filtered jobs with attributes)');
console.log('  - data/filtered-scan-report.md (filtered report)');

// Show unique locations for manual review
console.log('\n=== Unique Locations in Filtered Results ===');
Object.keys(byLocation).sort().forEach(loc => {
  console.log(`  - ${loc}`);
});