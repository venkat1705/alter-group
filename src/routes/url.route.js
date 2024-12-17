const express = require("express");
const requiredAuth = require("../middleware/auth.middleware");
const { generateShortURL } = require("../controllers/url.controller");
const { URLAnalytics } = require("../controllers/analytics.controller");

const URLRouter = express.Router();

URLRouter.post("/shorten", requiredAuth, generateShortURL);
URLRouter.get("/shorten/:alias", URLAnalytics);

module.exports = URLRouter;
