const { crawlCompanyWebsite } = require('./crawler.service');
const logger = require('../utils/logger');

/**
 * Executes research by crawling company web pages and aggregating context.
 * Provides honest gap reporting if website data is incomplete or unreachable.
 */
async function performResearch(companyUrl, jobDescription) {
  let crawlResult = { pagesContent: [], pagesUsed: [], error: null };
  
  if (companyUrl) {
    crawlResult = await crawlCompanyWebsite(companyUrl);
  }

  const hasCrawlData = crawlResult.pagesContent.length > 0;
  
  // Aggregate sanitized plain text
  const aggregatedWebText = crawlResult.pagesContent
    .map(p => `--- SOURCE: ${p.url} ---\n${p.text}`)
    .join('\n\n');

  return {
    pagesUsed: crawlResult.pagesUsed,
    aggregatedWebText: aggregatedWebText || 'No web data extracted.',
    hasCrawlData,
    researchStatus: hasCrawlData 
      ? 'complete' 
      : (companyUrl ? 'partial_or_failed' : 'skipped_no_url'),
    gapReport: crawlResult.error 
      ? `Web crawl notice: ${crawlResult.error}. Pipeline fell back to Job Description only.`
      : null
  };
}

module.exports = { performResearch };
