const express = require("express");
const {
  googleAuth,
  googleAuthCallback,
  getCurrentUser,
} = require("../controllers/auth.controller");
const requiredAuth = require("../middleware/auth.middleware");

const authRouter = express.Router();

authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleAuthCallback);
authRouter.get("/user", requiredAuth, getCurrentUser);

module.exports = authRouter;
