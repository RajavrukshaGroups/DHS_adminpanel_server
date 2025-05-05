import mongoose from "mongoose";

const dimensionSchema = new mongoose.Schema({
  length: {
    type: Number,
    required: true,
    min: [0.01, "Length must be greater than zero"],
  },
  breadth: {
    type: Number,
    required: true,
    min: [0.01, "Breadth must be greater than zero"],
  },
  pricePerSqft: {
    type: Number,
    default: 0,
  },
  propertyCost: {
    type: Number,
    default: 0,
  },
});

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["current", "completed"],
      required: true,
    },
    dimensions: {
      type: [dimensionSchema],
      validate: {
        validator: function (arr) {
          return (
            Array.isArray(arr) &&
            arr.length > 0 &&
            arr.every(
              (dim) =>
                typeof dim.length === "number" &&
                dim.length > 0 &&
                typeof dim.breadth === "number" &&
                dim.breadth > 0
            )
          );
        },
        message:
          "Each dimension must include a valid length and breadth greater than zero.",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
