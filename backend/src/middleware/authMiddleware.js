const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Try HttpOnly cookie first
  let token = req.cookies?.access_token;

  // 2. Fall back to Authorization Bearer header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '7f3c9a21e8b64d0f5a72c1e9b83d6a4f2c8e1d9a6b5f0c3e7a2d8f4b9c1e6a5');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

module.exports = authMiddleware;
