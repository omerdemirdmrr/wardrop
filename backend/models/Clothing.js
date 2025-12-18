import mongoose from "mongoose";

const clothingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String }, // e.g. "Top", "Bottom", "Shoes"
  subCategory: { type: String }, // e.g. "T-shirt", "Jeans"
  color: { type: String },
  season: { type: String },
  material: { type: String },
  size: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Clothing", clothingSchema);
