const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const requiredAuth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(202).json({ error: "Authorization token is required" });
  }
  const token = authorization.replace("Bearer ", "");

  jwt.verify(token, process.env.SESSION_SECRET, (err, payload) => {
    if (err) {
      return res.status(202).json({ error: "Invalid or expired token" });
    }

    const { userId } = payload;

    User.findById(userId).then((userdata) => {
      req.user = userdata;

      next();
    });
  });
};

module.exports = requiredAuth;
