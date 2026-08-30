import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';

import { buildCompanyRoleKey, buildLocationFilter } from './scan.mjs';
import { parseTemporalJobs } from './providers/temporal.mjs';

test('explicit Brazil or LATAM eligibility overrides companion blocked locations', () => {
  const config = yaml.load(readFileSync(new URL('./portals.yml', import.meta.url), 'utf8'));
  const allows = buildLocationFilter(config.location_filter);

  assert.equal(allows('North America + LATAM + Europe'), true);
  assert.equal(allows('US/Canada/Brazil'), true);
  assert.equal(allows('Remote - US'), false);
});

test('company-role dedup ignores punctuation differences', () => {
  assert.equal(
    buildCompanyRoleKey('Clever, Inc.', 'Senior Front-End Engineer'),
    buildCompanyRoleKey('Clever Inc', 'Senior Front End Engineer'),
  );
});

test('Temporal careers page jobs are normalized', () => {
  const html = '<script>{id:"a759e035-fc73-4a16-8acc-9e85f1c1ac56",title:"Senior Engineer",location:"Remote, Brazil"}</script>';

  assert.deepEqual(parseTemporalJobs(html), [{
    title: 'Senior Engineer',
    url: 'https://temporal.io/careers/a759e035-fc73-4a16-8acc-9e85f1c1ac56',
    company: 'Temporal',
    location: 'Remote, Brazil',
  }]);
});
