const { google } = require("googleapis");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const googleAuth = (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Google OAuth URL:", error);
    return res.status(500).json({ error: "Failed to generate OAuth URL" });
  }
};

const googleAuthCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    let user = await User.findOne({ googleId: userInfo.data.id });

    if (!user) {
      // Create a new user if not found
      user = new User({
        googleId: userInfo.data.id,
        name: userInfo.data.name,
        email: userInfo.data.email,
        picture: userInfo.data.picture,
        access_token: "123",
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.SESSION_SECRET, {
      expiresIn: "1h",
    });

    // Send the token in a response (you can store it in a cookie if needed)
    res.json({ token });

    console.log(userInfo);
  } catch (error) {
    // console.error("Error getting user info from Google:", error);
    return res.status(500).json({ error: "Failed to get user info" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ data: user });
  } catch (error) {
    // console.error("Error retrieving user:", error);
    return res.status(500).json({ error: "Failed to retrieve user" });
  }
};

module.exports = { googleAuth, googleAuthCallback, getCurrentUser };
