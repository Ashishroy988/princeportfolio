import mongoose from "mongoose";

const portfolioContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { minimize: false, timestamps: true }
);

export default mongoose.models.PortfolioContent ||
  mongoose.model("PortfolioContent", portfolioContentSchema);
