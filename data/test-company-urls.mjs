import { readFileSync } from 'fs';

const companies = [
  { name: 'Prisma', api: 'https://boards-api.greenhouse.io/v1/boards/prisma6/jobs' },
  { name: 'Shopify', api: 'https://boards-api.greenhouse.io/v1/boards/shopify/jobs' },
  { name: 'BigCommerce', api: 'https://boards-api.greenhouse.io/v1/boards/bigcommerce/jobs' },
  { name: 'Optimizely', api: 'https://boards-api.greenhouse.io/v1/boards/optimizely/jobs' },
  { name: 'Unleash', api: 'https://boards-api.greenhouse.io/v1/boards/unleash/jobs' },
  { name: 'Factorial', api: 'https://boards-api.greenhouse.io/v1/boards/factorial/jobs' },
  { name: 'Personio', api: 'https://boards-api.greenhouse.io/v1/boards/personio/jobs' },
  { name: 'Wise', api: 'https://boards-api.greenhouse.io/v1/boards/wise/jobs' },
  { name: 'Revolut', api: 'https://boards-api.greenhouse.io/v1/boards/revolut/jobs' },
  { name: 'Payward (Kraken)', api: 'https://boards-api.greenhouse.io/v1/boards/kraken/jobs' },
  { name: 'Hims & hers', careers: 'https://jobs.ashbyhq.com/hims-andhers' },
];

async function testCompany(company) {
  try {
    let url = company.api || company.careers;
    const response = await fetch(url, { method: 'HEAD' });
    const status = response.status;
    return { name: company.name, status, ok: response.ok };
  } catch (err) {
    return { name: company.name, status: 'ERROR', ok: false, error: err.message };
  }
}

async function main() {
  console.log('Testing company careers URLs...\n');
  const results = [];
  for (const company of companies) {
    const result = await testCompany(company);
    results.push(result);
    const icon = result.ok ? '✅' : (result.status === 404 ? '❌' : '⚠️');
    console.log(`${icon} ${result.name}: ${result.status}`);
  }
  console.log('\n404 companies need URL fixes');
}

main();