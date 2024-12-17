const URL = require("../models/url.model");
const { getGeoLocation, getClientIP } = require("../utils/utils");

const URLAnalytics = async (req, res) => {
  try {
    const { alias } = req.params;

    const urlDocument = await URL.findOne({ custom_alias: alias });
    if (!urlDocument) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const userAgent = req.headers["user-agent"];
    const ipAddress = getClientIP(req);

    console.log(ipAddress);

    const geoData = await getGeoLocation(ipAddress);

    console.log(geoData);
  } catch (error) {
    console.error("Error in URL analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { URLAnalytics };
