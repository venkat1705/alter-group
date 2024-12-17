const { default: axios } = require("axios");
const { v4: uuidv4 } = require("uuid");

const generateShortId = () => {
  return Math.random().toString(36).substr(2, 8); // Generates an 8-character random string
};

const getGeoLocation = async (ipAddress) => {
  try {
    // Use a free geolocation API like ipapi or ipstack
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
    return {
      city: response.data.city,
      region: response.data.region,
      country: response.data.country_name,
    };
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return null;
  }
};

const getClientIP = (req) => {
  const ip = req.ip;

  // Normalize IPv6 localhost (::1) to IPv4 localhost (127.0.0.1)
  if (ip === "::1") {
    return "127.0.0.1";
  }

  // If behind a proxy like Nginx or Heroku, use the x-forwarded-for header
  return (
    req.headers["x-forwarded-for"] || // For proxies
    ip
  );
};

module.exports = { generateShortId, getGeoLocation, getClientIP };
