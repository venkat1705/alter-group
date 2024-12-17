const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    short_url: { type: String, required: true, unique: true }, // Links to the short URL
    totalClicks: { type: Number, default: 0 }, // Total number of clicks
    uniqueClicks: { type: Number, default: 0 }, // Unique users who clicked
    alias: { type: String },
    topic: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    clicksByDate: [
      {
        date: { type: Date, required: true }, // Specific date
        count: { type: Number, default: 0 }, // Click count for that date
      },
    ],
    osType: [
      {
        osName: { type: String, required: true }, // OS name (e.g., Windows, macOS, Linux, etc.)
        uniqueClicks: { type: Number, default: 0 }, // Number of unique clicks
        uniqueUsers: { type: Number, default: 0 }, // Number of unique users
      },
    ],
    deviceType: [
      {
        deviceName: { type: String, required: true }, // Device type (e.g., mobile, desktop)
        uniqueClicks: { type: Number, default: 0 }, // Number of unique clicks
        uniqueUsers: { type: Number, default: 0 }, // Number of unique users
      },
    ],
    geoLocation: [
      {
        city: String,
        region: String,
        country: String,
      },
    ],
    uniqueIps: [], // To track unique IPs
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
