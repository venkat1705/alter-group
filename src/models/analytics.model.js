const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    alias: { type: String, required: true },
    long_url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    user_agent: String,
    ip_address: String,
    geolocation: {
      city: String,
      region: String,
      country: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdURL: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "URL",
      required: true,
    },
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
