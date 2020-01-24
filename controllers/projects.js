const User = require("../models/User");
const Project = require("../models/Project");
const Bug = require("../models/Bug");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// @desc Create new project
// @route POST /api/v1/projects/
// @access Private
exports.createProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  const project = await Project.create(ctx.request.body);

  console.log(project);

  const newToken = user.getSignedJwtToken(project._id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  ctx.cookies.set("token", newToken, options);

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: project
  };
};

// @desc Get project info
// @route GET /api/v1/projects/getProject
// @access Private
exports.getProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const project = await Project.findOne({ _id: decoded.projectId });

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: project
  };
};

// @desc Get all users projects
// @route Get /api/v1/projects/getProjects
// @access Private
exports.getProjects = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const bugs = await Bug.find({
    $or: [{ user: decoded.id }, { fixer: decoded.id }]
  });

  let projectIds = [];
  bugs.forEach(bug => projectIds.push(bug.project));

  const projects = await Project.find({ _id: { $in: projectIds } });

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: projects
  };
};

// @desc Set token cookie to include project id
// @route Get /api/v1/projects/:id
// @access Private
exports.setProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  const newToken = user.getSignedJwtToken(ctx.params.id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  ctx.cookies.set("token", newToken, options);

  ctx.status = 200;
  ctx.body = {
    success: true
  };
};

// @desc Update project
// @route PUT /api/v1/projects
// @access Private
exports.updateProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const project = await Project.findByIdAndUpdate(
    decoded.projectId,
    ctx.request.body,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false
    }
  );

  ctx.status = 200;
  ctx.response.body = {
    success: true,
    data: project
  };
};

// @desc Delete project
// @route Get /api/v1/projects
// @access Private
exports.deleteProject = async ctx => {
  const decoded = jwt.verify(ctx.cookies.get("token"), process.env.JWT_SECRET);

  const project = await Project.deleteOne({ _id: decoded.projectId });

  const bugs = await Bug.deleteMany({ project: decoded.projectId });

  ctx.status = 200;
  ctx.response.body = {
    success: true
  };
};
