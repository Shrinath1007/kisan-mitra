const mongoose = require("mongoose");

const FarmSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    area: { type: Number, required: true },
    soilType: { type: String, default: "loamy" },

    // IMPORTANT: used by your farmerController.populate("crops")
    crops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Crop",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", FarmSchema);
