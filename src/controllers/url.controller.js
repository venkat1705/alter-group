const URL = require("../models/url.model");
const { generateShortId } = require("../utils/utils");

const generateShortURL = async (req, res) => {
  const { long_url, custom_alias, topic } = req.body;

  const short_id = custom_alias || generateShortId();
  const short_url = `${process.env.BASE_URL}/${short_id}`;

  if (!long_url) {
    return res.status(400).json({ message: "Please provide a long URL." });
  }

  const exisitedAlias = await URL.findOne({ custom_alias: short_id });

  if (exisitedAlias) {
    return res.status(400).json({
      message: "Alias already exists. Please choose a different one.",
    });
  }

  try {
    const newURL = await URL.create({
      long_url,
      short_url: short_url,
      custom_alias: short_id,
      topic: topic || "default",
      createdBy: req.user._id,
    });

    if (newURL) {
      res.json({
        short_url: newURL.short_url,
        created_at: newURL.createdAt,
      });
    } else {
      res.status(500).json({ message: "Failed to generate short URL." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate short URL." });
  }
};

module.exports = { generateShortURL };
