const rateLimit = require("express-rate-limit");

const combinedRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each key (IP or user) to 5 requests per window
  message: { error: "Too many requests. Please try again later." },
  keyGenerator: (req) => {
    return req.user ? req.user._id : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = combinedRateLimiter;
