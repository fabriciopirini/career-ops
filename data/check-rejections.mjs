import { readFileSync, writeFileSync } from 'fs';

const jobs = readFileSync('data/full-scan-detailed.tsv', 'utf8').split('\n').slice(1);

const locationRejects = {};
const roleTypeRejects = {};
const seniorityRejects = {};

jobs.forEach(line => {
  if (!line.trim()) return;
  const [company, title, location, seniority, roleType, techStack, remote, portal, url] = line.split('\t');

  const t = title.toLowerCase();
  const loc = location.toLowerCase();

  // === Seniority Filter ===
  const isSenior = seniority === 'Senior';

  // === Role Type Filter ===
  const validRoleTypes = ['Engineering', 'Frontend', 'Fullstack'];
  const validRole = validRoleTypes.includes(roleType);

  // === Location Filter ===
  const hasFriendly = loc.includes('friendly');
  const isUsOnlyRemote = loc.includes('remote') && (loc.includes('us') || loc.includes('united states') || loc.includes('usa')) && !loc.includes('worldwide') && !loc.includes('global') && !loc.includes('america');
  const keepLocation = loc === 'n/a' || loc === 'remote' || loc.includes('remote') && !isUsOnlyRemote || loc.includes('brazil') || loc.includes('amer') || loc.includes('latam');

  if (!isSenior) {
    seniorityRejects[seniority] = (seniorityRejects[seniority] || 0) + 1;
  }
  if (!validRole && isSenior) {
    roleTypeRejects[roleType] = (roleTypeRejects[roleType] || 0) + 1;
  }
  if (!keepLocation && isSenior && validRole) {
    locationRejects[location] = (locationRejects[location] || 0) + 1;
  }
});

console.log('=== Rejected by Seniority ===');
Object.entries(seniorityRejects).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

console.log('\n=== Rejected by Role Type (but Senior) ===');
Object.entries(roleTypeRejects).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

console.log('\n=== Rejected by Location (but Senior + Valid Role) ===');
Object.entries(locationRejects).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
  console.log(`  ${v}: ${k}`);
});
console.log(`  ... and ${Object.keys(locationRejects).length - 20} more`);