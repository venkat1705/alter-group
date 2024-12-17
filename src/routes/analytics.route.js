const express = require("express");
const {
  retrieveAnalytics,
  retrieveAnalyticsTopic,
  retrieveOverallAnalytics,
} = require("../controllers/analytics.controller");
const requiredAuth = require("../middleware/auth.middleware");
const combinedRateLimiter = require("../middleware/ratelimit.middleware");

const analyticsRouter = express.Router();

analyticsRouter.get(
  "/analytics/overall",
  requiredAuth,
  combinedRateLimiter,
  retrieveOverallAnalytics
);
analyticsRouter.get(
  "/analytics/:alias",
  requiredAuth,
  combinedRateLimiter,
  retrieveAnalytics
);
analyticsRouter.get(
  "/analytics/topic/:topic",
  requiredAuth,
  combinedRateLimiter,
  retrieveAnalyticsTopic
);

module.exports = analyticsRouter;
