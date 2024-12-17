const Analytics = require("../models/analytics.model");
const URL = require("../models/url.model");
const { getClientIP, getGeoLocation } = require("../utils/utils");
const UAParser = require("ua-parser-js");

const retriveAnalytics = async (req, res) => {
  try {
    const { alias } = req.params;

    const urlDoc = await URL.findOne({ custom_alias: alias });
    if (!urlDoc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const data = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const parsedUA = new UAParser(userAgent);

    const analyticsDoc = {
      ip: data,
      osName: parsedUA.getOS().name || "Unknown",
      deviceName: parsedUA.getDevice().type || "desktop",
      date: new Date().toISOString().slice(0, 10),
    };

    await recordClick(urlDoc?.short_url, analyticsDoc, req, alias);

    return res.json({
      url: urlDoc.long_url,
    });
  } catch (error) {
    console.error("Error in URL analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const recordClick = async (shortUrl, analyticsData, req, alias) => {
  const { ip, osName, deviceName, date } = analyticsData;

  console.log(alias, ip);

  const geoData = await getGeoLocation(ip.ip);

  try {
    let analyticsDoc = await Analytics.findOne({ short_url: shortUrl });

    if (!analyticsDoc) {
      // Create a new analytics record if it doesn't exist
      analyticsDoc = await Analytics.create({
        short_url: shortUrl,
        totalClicks: 1,
        uniqueClicks: 1,
        uniqueIps: [ip.ip],
        clicksByDate: [{ date, count: 1 }],
        osType: [{ osName, uniqueClicks: 1, uniqueUsers: 1 }],
        deviceType: [{ deviceName, uniqueClicks: 1, uniqueUsers: 1 }],
        alias: alias,
        geoLocation: [
          {
            city: geoData?.city,
            region: geoData?.region,
            country: geoData?.country,
          },
        ],
      });
    } else {
      // Update existing analytics
      analyticsDoc.totalClicks += 1;

      // Check for unique click
      if (!analyticsDoc.uniqueIps.includes(ip)) {
        analyticsDoc.uniqueClicks += 1;
        analyticsDoc.uniqueIps.push(ip);
      }

      // Update clicksByDate
      const dateEntry = analyticsDoc.clicksByDate.find(
        (entry) => entry.date.toISOString() === date
      );
      if (dateEntry) {
        dateEntry.count += 1;
      } else {
        analyticsDoc.clicksByDate.push({ date, count: 1 });
      }

      // Update OS analytics
      const osEntry = analyticsDoc.osType.find(
        (entry) => entry.osName === osName
      );
      if (osEntry) {
        osEntry.uniqueClicks += 1;
        if (!analyticsDoc.uniqueIps.includes(ip)) osEntry.uniqueUsers += 1;
      } else {
        analyticsDoc.osType.push({ osName, uniqueClicks: 1, uniqueUsers: 1 });
      }

      // Update device analytics
      const deviceEntry = analyticsDoc.deviceType.find(
        (entry) => entry.deviceName === deviceName
      );
      if (deviceEntry) {
        deviceEntry.uniqueClicks += 1;
        if (!analyticsDoc.uniqueIps.includes(ip)) deviceEntry.uniqueUsers += 1;
      } else {
        analyticsDoc.deviceType.push({
          deviceName,
          uniqueClicks: 1,
          uniqueUsers: 1,
        });
      }

      await analyticsDoc.save();
    }
  } catch (error) {
    console.error("Error recording analytics:", error);
  }
};

module.exports = { retriveAnalytics };
