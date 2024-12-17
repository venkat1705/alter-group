const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    long_url: { type: String, required: true }, // Make long_url required
    custom_alias: { type: String, unique: true, sparse: true }, // Unique constraint for custom_alias
    short_url: { type: String, required: true }, // Make short_url required
    topic: { type: String },
    ip_addr: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User ",
      required: true, // Make createdBy required if you always want to track who created the URL
    },
  },
  { timestamps: true }
);

// Create an index on custom_alias for faster lookups
urlSchema.index({ custom_alias: 1 });

const URL = mongoose.model("URL", urlSchema);

module.exports = URL;
