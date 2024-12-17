const express = require("express");
const requiredAuth = require("../middleware/auth.middleware");
const { generateShortURL } = require("../controllers/url.controller");
const {
  retriveAnalytics,
  generateURLAnalytics,
} = require("../controllers/analytics.controller");
const combinedRateLimiter = require("../middleware/ratelimit.middleware");

const URLRouter = express.Router();

URLRouter.post("/shorten", requiredAuth, combinedRateLimiter, generateShortURL);
URLRouter.get(
  "/shorten/:alias",
  requiredAuth,
  combinedRateLimiter,
  generateURLAnalytics
);

module.exports = URLRouter;
