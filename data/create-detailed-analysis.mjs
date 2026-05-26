import { readFileSync, writeFileSync } from 'fs';

const lines = readFileSync('data/scan-history.tsv', 'utf8').split('\n').slice(1);
const jobs = [];

for (const line of lines) {
  if (!line.trim()) continue;
  const [url, first_seen, portal, title, company, status, location] = line.split('\t');

  const t = title.toLowerCase();

  // Extract seniority
  let seniority = 'Mid';
  if (t.includes('intern')) seniority = 'Intern';
  else if (t.includes('junior')) seniority = 'Junior';
  else if (t.includes('senior')) seniority = 'Senior';
  else if (t.includes('lead')) seniority = 'Lead';
  else if (t.includes('staff')) seniority = 'Staff';
  else if (t.includes('principal')) seniority = 'Principal';
  else if (t.includes('head')) seniority = 'Head';
  else if (t.includes('director')) seniority = 'Director';
  else if (t.includes('vp')) seniority = 'VP';
  else if (t.includes('manager')) seniority = 'Manager';
  else if (t.includes('executive')) seniority = 'Executive';

  // Extract tech stack
  const techStack = [];
  if (t.includes('react')) techStack.push('React');
  if (t.includes('next.js') || t.includes('next js')) techStack.push('Next.js');
  if (t.includes('typescript')) techStack.push('TypeScript');
  if (t.includes('javascript') || t.includes('js') && !t.includes('typescript')) techStack.push('JavaScript');
  if (t.includes('python')) techStack.push('Python');
  if (t.includes('go') || t.includes('golang')) techStack.push('Go');
  if (t.includes('java') && !t.includes('javascript')) techStack.push('Java');
  if (t.includes('kotlin')) techStack.push('Kotlin');
  if (t.includes('rust')) techStack.push('Rust');
  if (t.includes('ruby')) techStack.push('Ruby');
  if (t.includes('php')) techStack.push('PHP');
  if (t.includes('.net')) techStack.push('.NET');
  if (t.includes('c++') || t.includes('cpp')) techStack.push('C++');
  if (t.includes('c#') || t.includes('csharp')) techStack.push('C#');

  // Extract role type
  let roleType = 'Other';
  if (t.includes('frontend') || t.includes('front-end') || t.includes('front end')) roleType = 'Frontend';
  else if (t.includes('backend') || t.includes('back-end') || t.includes('back end')) roleType = 'Backend';
  else if (t.includes('fullstack') || t.includes('full stack')) roleType = 'Fullstack';
  else if (t.includes('mobile') || t.includes('ios') || t.includes('android')) roleType = 'Mobile';
  else if (t.includes('data') && !t.includes('software engineer')) roleType = 'Data';
  else if (t.includes('devops') || t.includes('site reliability') || t.includes('sre')) roleType = 'DevOps/SRE';
  else if (t.includes('design') && !t.includes('design engineer')) roleType = 'Design';
  else if (t.includes('product') && !t.includes('product engineer') && !t.includes('technical product')) roleType = 'Product (PM)';
  else if (t.includes('sales') || t.includes('account executive')) roleType = 'Sales';
  else if (t.includes('marketing')) roleType = 'Marketing';
  else if (t.includes('support') || t.includes('customer success')) roleType = 'Support';
  else if (t.includes('recruiter') || t.includes('talent acquisition')) roleType = 'Recruiting';
  else if (t.includes('finance') || t.includes('accounting')) roleType = 'Finance';
  else if (t.includes('legal') || t.includes('counsel')) roleType = 'Legal';
  else if (t.includes('operations') || t.includes('ops')) roleType = 'Operations';
  else if (t.includes('software engineer') || t.includes('engineer')) roleType = 'Engineering';

  // Remote detection
  const loc = location.toLowerCase();
  const isRemote = loc.includes('remote') || loc.includes('worldwide') || loc.includes('any location') || loc.includes('anywhere');

  jobs.push({
    company,
    title,
    location,
    seniority,
    roleType,
    techStack: techStack.join(', ') || 'N/A',
    isRemote,
    portal,
    url
  });
}

// Write CSV
const header = ['Company', 'Title', 'Location', 'Seniority', 'Role Type', 'Tech Stack', 'Remote', 'Portal', 'URL'];
const csv = [header.join('\t'), ...jobs.map(j => [
  j.company, j.title, j.location, j.seniority, j.roleType, j.techStack, j.isRemote ? 'Yes' : 'No', j.portal, j.url
].join('\t'))];

writeFileSync('data/full-scan-detailed.tsv', csv.join('\n'));
console.log('Created data/full-scan-detailed.tsv with ' + jobs.length + ' jobs');