const mongoose = require("mongoose");

const CropSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: { type: String, required: true },
    plantingDate: Date,
    stage: { type: String, default: "seedling" },
    areaHectares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Crop", CropSchema);
