const Analytics = require("../models/analytics.model");
const URL = require("../models/url.model");
const { getClientIP, getGeoLocation } = require("../utils/utils");
const UAParser = require("ua-parser-js");

const Redis = require("ioredis");

const redis = new Redis();

const generateURLAnalytics = async (req, res) => {
  try {
    const { alias } = req.params;

    const cacheKey = `alter:analytics:generate:${alias}:${req.user._id}`;

    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      // If cached result exists, return it
      // console.log("Returning data from cache");

      return res.json(JSON.parse(cachedResult));
    }

    const urlDoc = await URL.findOne({ custom_alias: alias });
    if (!urlDoc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const data = getClientIP(req);
    const userAgent = req.headers["user-agent"];

    const parsedUA = new UAParser(userAgent);

    const analyticsDoc = {
      ip: data.ip,
      osName: parsedUA.getOS().name || "Unknown",
      deviceName: parsedUA.getDevice().type || "desktop",
      date: new Date().toISOString().slice(0, 10),
    };

    await recordClick(
      urlDoc?.short_url,
      analyticsDoc,
      alias,
      urlDoc?.topic,
      urlDoc?.createdBy
    );

    await redis.set(
      cacheKey,
      JSON.stringify({
        url: urlDoc.long_url,
      }),
      "EX",
      3600
    );

    return res.json({
      url: urlDoc.long_url,
    });
  } catch (error) {
    console.error("Error in URL analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const recordClick = async (shortUrl, analyticsData, alias, topic, user_id) => {
  const { ip, osName, deviceName, date } = analyticsData;

  const geoData = await getGeoLocation(ip);

  try {
    let analyticsDoc = await Analytics.findOne({ short_url: shortUrl });

    if (!analyticsDoc) {
      // Create a new analytics record if it doesn't exist
      analyticsDoc = await Analytics.create({
        short_url: shortUrl,
        totalClicks: 1,
        uniqueClicks: 1,
        uniqueIps: [ip],
        clicksByDate: [{ date, count: 1 }],
        osType: [{ osName, uniqueClicks: 1, uniqueUsers: 1 }],
        deviceType: [{ deviceName, uniqueClicks: 1, uniqueUsers: 1 }],
        alias: alias,
        topic: topic,
        createdBy: user_id,
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

// retrieve analytics by alias

const retrieveAnalytics = async (req, res) => {
  const { alias } = req.params;

  const cacheKey = `alter:analytics:alias:${alias}:${req.user._id}`;

  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) {
    // If cached result exists, return it
    // console.log("Returning data from cache");

    return res.json(JSON.parse(cachedResult));
  }

  try {
    const analyticsDoc = await Analytics.findOne({ alias });
    if (!analyticsDoc) {
      return res
        .status(404)
        .json({ error: "Analytics not found for this alias" });
    }

    await redis.set(
      cacheKey,
      JSON.stringify({
        totalClicks: analyticsDoc.totalClicks,
        uniqueClicks: analyticsDoc.uniqueClicks,
        clicksByDate: analyticsDoc.clicksByDate.slice(0, 7), // recent 7 days
        osType: analyticsDoc.osType,
        deviceType: analyticsDoc.deviceType,
      }),
      "EX",
      3600
    );

    return res.json({
      totalClicks: analyticsDoc.totalClicks,
      uniqueClicks: analyticsDoc.uniqueClicks,
      clicksByDate: analyticsDoc.clicksByDate.slice(0, 7), // recent 7 days
      osType: analyticsDoc.osType,
      deviceType: analyticsDoc.deviceType,
    });
  } catch (error) {
    console.error("Error retrieving analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// retrieve analytics by topic

const retrieveAnalyticsTopic = async (req, res) => {
  const { topic } = req.params;

  const cacheKey = `alter:analytics:topic:${topic}:${req.user._id}`;

  const cachedResult = await redis.get(cacheKey);

  if (cachedResult) {
    // If cached result exists, return it
    // console.log("Returning data from cache");

    return res.json(JSON.parse(cachedResult));
  }

  try {
    const analyticsDoc = await Analytics.find({ topic });
    if (!analyticsDoc) {
      return res
        .status(404)
        .json({ error: "Analytics not found for this alias" });
    }

    await redis.set(cacheKey, JSON.stringify(analyticsDoc), "EX", 3600);

    return res.json(analyticsDoc);
  } catch (error) {
    console.error("Error retrieving analytics:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// retrieve overall analytics for user

const retrieveOverallAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const userUrls = await URL.find({ createdBy: userId });

    const cacheKey = `alter:analytics:${userId}`;

    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      // If cached result exists, return it
      // console.log("Returning data from cache");

      return res.json(JSON.parse(cachedResult));
    }

    // Step 2: Initialize the aggregate analytics object
    let totalUrls = userUrls.length;
    let totalClicks = 0;
    let uniqueClicks = 0;
    let clicksByDate = [];
    let osType = [];
    let deviceType = [];

    // Step 3: Iterate over each URL to aggregate analytics
    for (const url of userUrls) {
      const analytics = await Analytics.findOne({ alias: url.custom_alias });

      // Aggregate total URLs
      if (analytics) {
        // Aggregate total clicks and unique clicks
        totalClicks += analytics.totalClicks;
        uniqueClicks += analytics.uniqueClicks;

        // Aggregate clicks by date
        analytics.clicksByDate.forEach((entry) => {
          const existingDateEntry = clicksByDate.find(
            (d) => d.date === entry.date
          );
          if (existingDateEntry) {
            existingDateEntry.clickCount += entry.clickCount;
          } else {
            clicksByDate.push(entry);
          }
        });

        // Aggregate OS type and device type data
        analytics.osType.forEach((os) => {
          const existingOs = osType.find((o) => o.osName === os.osName);
          if (existingOs) {
            existingOs.uniqueClicks += os.uniqueClicks;
            existingOs.uniqueUsers += os.uniqueUsers;
          } else {
            osType.push(os);
          }
        });

        analytics.deviceType.forEach((device) => {
          const existingDevice = deviceType.find(
            (d) => d.deviceName === device.deviceName
          );
          if (existingDevice) {
            existingDevice.uniqueClicks += device.uniqueClicks;
            existingDevice.uniqueUsers += device.uniqueUsers;
          } else {
            deviceType.push(device);
          }
        });
      }
    }

    await redis.set(
      cacheKey,
      JSON.stringify({
        totalUrls,
        totalClicks,
        uniqueClicks,
        clicksByDate: clicksByDate, // Limit to recent 7 days
        osType,
        deviceType,
      }),
      "EX",
      3600
    );

    // Step 4: Return the aggregated data
    return res.json({
      totalUrls,
      totalClicks,
      uniqueClicks,
      clicksByDate: clicksByDate, // Limit to recent 7 days
      osType,
      deviceType,
    });
  } catch (error) {
    console.error("Error fetching overall analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  generateURLAnalytics,
  retrieveAnalytics,
  retrieveAnalyticsTopic,
  retrieveOverallAnalytics,
};
