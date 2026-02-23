function isAuthenticated(req, res, next){
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  // if API request, respond with 401, else redirect to landing
  if (req.originalUrl && req.originalUrl.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/');
}

module.exports = { isAuthenticated };
