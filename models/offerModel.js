const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offerType: {
      type: String,
      enum: ["product", "category"],
      required: true,
    },
    offerName: {
      type: String,
      required: true,
    },
    discount: {
      type: Number, // Discount percentage or flat amount
      required: true,
    },
    productId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.offerType === "product";
      },
    }],
    categoryId:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return this.offerType === "category";
      },
    }],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;