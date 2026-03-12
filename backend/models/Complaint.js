import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED"],
      default: "OPEN",
    },
    customerDetails: {
      unit: String,
      location: String,
      userName: String,
      contactNo: String,
    },
    systemDetails: {
      systemSerialNo: String,
    },
    items: [
      {
        itemName: String,
        remark: String,
      },
    ],
    diagnosisAndComments: {
      type: String,
    },
    spares: [
      {
        replaced: String,
        replacedQty: Number,
        required: String,
        requiredQty: Number,
      },
    ],
    charges: {
      warranty: Boolean,
      amc: Boolean,
      charges: Number,
      gst: Number,
      customerAcceptance: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Complaint", complaintSchema);
