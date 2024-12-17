const express = require("express");
const connectDB = require("./config/database");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth.route");
const cookieSession = require("cookie-session");
const URLRouter = require("./routes/url.route");
const combinedRateLimiter = require("./middleware/ratelimit.middleware");

dotenv.config();

const app = express();
connectDB();

app.use(express.json());

app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(combinedRateLimiter);
app.set("trust proxy", true), app.use("/api/auth", authRouter);
app.use("/api", URLRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
