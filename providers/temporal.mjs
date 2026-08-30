// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

const JOB_PATTERN = /\{id:"([0-9a-f-]{36})",title:"((?:\\.|[^"\\])*)",location:"((?:\\.|[^"\\])*)"\}/g;

export function parseTemporalJobs(html, company = 'Temporal') {
  return [...html.matchAll(JOB_PATTERN)].map(([, id, title, location]) => ({
    title: JSON.parse(`"${title}"`),
    url: `https://temporal.io/careers/${id}`,
    company,
    location: JSON.parse(`"${location}"`),
  }));
}

/** @type {Provider} */
export default {
  id: 'temporal',

  detect(entry) {
    const url = entry.careers_url || '';
    return /^https:\/\/(?:www\.)?temporal\.io\/careers(?:[/?#]|$)/.test(url) ? { url } : null;
  },

  async fetch(entry, ctx) {
    const jobs = parseTemporalJobs(await ctx.fetchText(entry.careers_url), entry.name);
    if (jobs.length === 0) throw new Error('temporal: no jobs found in careers page');
    return jobs;
  },
};
