const User = require("../models/User");
const Bug = require("../models/Bug");
const jwt = require("jsonwebtoken");

// @desc Create new bug
// @route POST /api/v1/bugs
// @access Private
exports.createBug = async ctx => {
  const token = ctx.cookies.get("token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const fixer = await User.findOne({ email: ctx.request.body.fixer });

  const bugData = {
    user: decoded.id,
    project: decoded.projectId,
    name: ctx.request.body.name,
    reporter: ctx.request.body.reporter,
    fixer: fixer._id,
    status: ctx.request.body.status,
    severity: ctx.request.body.severity,
    reproduceability: ctx.request.body.reproduceability
  };

  const bug = await Bug.create(bugData);

  ctx.status = 200;
  ctx.response.body = {
    success: true,
    data: bug
  };
};

// @desc Update a bugs information
// @route PUT /api/v1/bugs/update
// @access Private
exports.updateBug = async ctx => {
  const token = ctx.cookies.get("token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const bug = await Bug.findById(ctx.params.id);

  if (String(bug.project) !== decoded.projectId) {
    ctx.throw(401, "You must be working on that bugs project to edit it");
  }

  const newBug = await Bug.findByIdAndUpdate(ctx.params.id, ctx.request.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  ctx.status = 200;
  ctx.response.body = {
    success: true,
    data: newBug
  };
};

// @desc Get bugs by project
// @route PUT /api/v1/bugs/project
// @access Private
exports.bugsByProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const bugs = await Bug.find({ project: decoded.projectId });

  ctx.status = 200;
  ctx.response.body = {
    success: true,
    data: bugs
  };
};

// @desc Delete bug
// @route Delete /api/v1/bugs/:id
// @access Private
exports.deleteBug = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);
  console.log("fire");

  const isDeleted = await Bug.deleteOne({
    $and: [{ project: decoded.projectId }, { _id: ctx.params.id }]
  });

  if (isDeleted.deletedCount === 0) ctx.throw(401, "Cannot find that bug");

  ctx.status = 200;
  ctx.response.body = {
    success: true
  };
};
