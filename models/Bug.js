const mongoose = require("mongoose");

const BugSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name for this bug"],
      trim: true,
      maxlength: [100, "Name can not be longer than 100 characters"]
    },
    description: {
      type: String,
      required: [true, "Please enter a description for this bug"],
      maxlength: [500, "Description can not be longer than 500 characters"]
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: "Project",
      required: true
    },
    reporter: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false
    },
    fixer: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "To Be Tested", "Closed"],
      default: "Open",
      required: true
    },
    severity: {
      type: String,
      enum: ["Minor", "Major"],
      required: true
    },
    reproduceability: {
      type: String,
      enum: ["Always", "Intermitent"],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bug", BugSchema);
