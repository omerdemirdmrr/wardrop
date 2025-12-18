import mongoose from "mongoose";

const outfitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clothing"
  }],
  status: {
    type: String,
    enum: ['new', 'worn', 'disliked', 'favorite'],
    default: 'new'
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Outfit", outfitSchema);
