const express = require("express");
const requiredAuth = require("../middleware/auth.middleware");
const { generateShortURL } = require("../controllers/url.controller");
const { retriveAnalytics } = require("../controllers/analytics.controller");

const URLRouter = express.Router();

URLRouter.post("/shorten", requiredAuth, generateShortURL);
URLRouter.get("/shorten/:alias", retriveAnalytics);

module.exports = URLRouter;
