const axios = require('axios');
const cheerio = require('cheerio');
const { validateUrl } = require('../utils/urlSafety');
const logger = require('../utils/logger');

/**
 * Fetches and cleans textual content from a URL.
 * Implements SSRF protection, timeout, size limits, and basic link discovery.
 */
async function crawlCompanyWebsite(companyUrl) {
  if (!companyUrl || typeof companyUrl !== 'string' || companyUrl.trim() === '') {
    return {
      pagesContent: [],
      pagesUsed: [],
      error: 'No URL provided'
    };
  }

  const safeCheck = validateUrl(companyUrl, true);
  if (!safeCheck.valid) {
    logger.warn(`[Crawler] URL rejected: ${safeCheck.error}`);
    return {
      pagesContent: [],
      pagesUsed: [],
      error: safeCheck.error
    };
  }

  const targetUrl = safeCheck.url;
  const pagesContent = [];
  const pagesUsed = [];

  try {
    logger.info(`[Crawler] Fetching main page: ${targetUrl}`);
    const response = await axios.get(targetUrl, {
      timeout: 6000,
      headers: {
        'User-Agent': 'AI-Interview-PrepKit-Crawler/1.0 (+https://interviewkit.local)'
      },
      maxContentLength: 2 * 1024 * 1024 // 2MB max
    });

    if (typeof response.data !== 'string') {
      return { pagesContent, pagesUsed, error: 'Non-text response received' };
    }

    const $ = cheerio.load(response.data);
    
    // Strip non-content tags
    $('script, style, noscript, nav, footer, svg, iframe, header').remove();
    
    // Extract main text content
    const mainText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
    
    if (mainText.length > 50) {
      pagesContent.push({ url: targetUrl, text: mainText });
      pagesUsed.push(targetUrl);
    }

    // Discover internal links (e.g. /about, /careers)
    const discoveredLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('about') || href.includes('career') || href.includes('company') || href.includes('product'))) {
        try {
          const absoluteUrl = new URL(href, targetUrl).toString();
          if (!discoveredLinks.includes(absoluteUrl) && absoluteUrl !== targetUrl && discoveredLinks.length < 2) {
            discoveredLinks.push(absoluteUrl);
          }
        } catch (e) {
          // ignore relative URL parse failures
        }
      }
    });

    // Crawl subpages up to limit 2
    for (const subUrl of discoveredLinks) {
      try {
        const subCheck = validateUrl(subUrl, true);
        if (!subCheck.valid) continue;
        
        logger.info(`[Crawler] Fetching discovered page: ${subUrl}`);
        const subRes = await axios.get(subUrl, {
          timeout: 4000,
          headers: { 'User-Agent': 'AI-Interview-PrepKit-Crawler/1.0' },
          maxContentLength: 1 * 1024 * 1024
        });
        
        if (typeof subRes.data === 'string') {
          const $sub = cheerio.load(subRes.data);
          $sub('script, style, noscript, nav, footer, svg, iframe').remove();
          const subText = $sub('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
          if (subText.length > 50) {
            pagesContent.push({ url: subUrl, text: subText });
            pagesUsed.push(subUrl);
          }
        }
      } catch (subErr) {
        logger.warn(`[Crawler] Subpage crawl error on ${subUrl}: ${subErr.message}`);
      }
    }

    return {
      pagesContent,
      pagesUsed,
      error: null
    };

  } catch (err) {
    logger.warn(`[Crawler] Main page crawl failed for ${targetUrl}: ${err.message}`);
    return {
      pagesContent: [],
      pagesUsed: [],
      error: `Crawl failed: ${err.message}`
    };
  }
}

module.exports = { crawlCompanyWebsite };
