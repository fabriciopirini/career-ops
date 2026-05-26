import { readFileSync, writeFileSync } from 'fs';

const jobs = readFileSync('data/full-scan-detailed.tsv', 'utf8').split('\n').slice(1);

const uniqueTitles = {};
const uniqueLocations = {};
const titlesByRoleType = {};
const titlesBySeniority = {};

jobs.forEach(line => {
  if (!line.trim()) return;
  const [company, title, location, seniority, roleType, techStack, remote, portal, url] = line.split('\t');

  uniqueTitles[title] = (uniqueTitles[title] || 0) + 1;
  uniqueLocations[location] = (uniqueLocations[location] || 0) + 1;

  if (!titlesByRoleType[roleType]) titlesByRoleType[roleType] = {};
  titlesByRoleType[roleType][title] = (titlesByRoleType[roleType][title] || 0) + 1;

  if (!titlesBySeniority[seniority]) titlesBySeniority[seniority] = {};
  titlesBySeniority[seniority][title] = (titlesBySeniority[seniority][title] || 0) + 1;
});

// Write to files
const titleReport = Object.entries(uniqueTitles)
  .sort((a, b) => b[1] - a[1])
  .map(([title, count]) => `${count}\t${title}`)
  .join('\n');

const locReport = Object.entries(uniqueLocations)
  .sort((a, b) => b[1] - a[1])
  .map(([loc, count]) => `${count}\t${loc}`)
  .join('\n');

writeFileSync('data/unique-titles.tsv', 'Count\tTitle\n' + titleReport);
writeFileSync('data/unique-locations.tsv', 'Count\tLocation\n' + locReport);

// Generate markdown report
let md = '# Full Scan Dataset Analysis\n\n';
md += '## Stats\n\n';
md += `- Total jobs: ${jobs.length}\n`;
md += `- Unique titles: ${Object.keys(uniqueTitles).length}\n`;
md += `- Unique locations: ${Object.keys(uniqueLocations).length}\n\n`;

md += '## Top 100 Titles\n\n';
md += '| Count | Title |\n';
md += '|------|-------|\n';
Object.entries(uniqueTitles).sort((a, b) => b[1] - a[1]).slice(0, 100).forEach(([title, count]) => {
  md += `| ${count} | ${title} |\n`;
});

md += '\n## Titles by Role Type\n\n';
Object.entries(titlesByRoleType).sort((a, b) => b[1].titleCount - a[1].titleCount).forEach(([roleType, titles]) => {
  const titleCount = Object.keys(titles).length;
  const jobCount = Object.values(titles).reduce((a, b) => a + b, 0);
  md += `### ${roleType}\n`;
  md += `${titleCount} unique titles, ${jobCount} jobs\n\n`;
  md += '| Count | Title |\n';
  md += '|------|-------|\n';
  Object.entries(titles).sort((a, b) => b[1] - a[1]).forEach(([title, count]) => {
    md += `| ${count} | ${title} |\n`;
  });
  md += '\n';
});

writeFileSync('data/full-scan-report.md', md);

console.log('Created:');
console.log('  - data/full-scan-detailed.tsv (all jobs with parsed attributes)');
console.log('  - data/unique-titles.tsv (all unique titles sorted by count)');
console.log('  - data/unique-locations.tsv (all unique locations sorted by count)');
console.log('  - data/full-scan-report.md (markdown summary)');