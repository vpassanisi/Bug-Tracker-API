const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name for this project"],
      trim: true,
      maxlength: [100, "Name can only contain 100 characters"],
      unique: true
    },
    description: {
      type: String,
      required: [true, "Please add a description for this project"],
      trim: true,
      maxlength: [200, "Description can only contain 200 characters"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
