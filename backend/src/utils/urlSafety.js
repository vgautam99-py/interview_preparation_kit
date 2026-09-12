const { URL } = require('url');

/**
 * Validates a URL to prevent SSRF (Server-Side Request Forgery).
 * Automatically prepends https:// if user omits protocol (e.g. "stripe.com" -> "https://stripe.com").
 * Rejects private/loopback/metadata destinations unless running in non-production local mode.
 */
function validateUrl(inputUrl, allowLocalhost = true) {
  if (!inputUrl || typeof inputUrl !== 'string' || inputUrl.trim() === '') {
    return { valid: false, error: 'URL is required' };
  }
  
  let formattedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const parsed = new URL(formattedUrl);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for explicit local or internal IP patterns
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isPrivateIp = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/.test(hostname);

    if (isLocalhost) {
      if (allowLocalhost) {
        return { valid: true, url: parsed.toString() };
      }
      return { valid: false, error: 'Localhost destinations are not allowed in production' };
    }

    if (isPrivateIp) {
      return { valid: false, error: 'Access to private network IP ranges is blocked' };
    }

    return { valid: true, url: parsed.toString() };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format: ' + err.message };
  }
}

module.exports = { validateUrl };

