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

  const newToken = user.getSignedJwtToken(project._id);

  let options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "Lax"
  };

  if (ctx.request.headers["user-agent"].includes("Windows")) {
    options.sameSite = "none";
  }

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

  let project = await Project.findOne({ _id: decoded.projectId });

  const count = await Bug.countDocuments({ project: project._id });

  project.bugsCount = count;

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

  const bugs = await Bug.find({ fixer: decoded.id });

  let projectIds = [];
  bugs.forEach(bug => projectIds.push(bug.project));

  let projects = await Project.find({ _id: { $in: projectIds } });

  for (let i = 0; i < projects.length; i++) {
    const count = await Bug.countDocuments({ project: projects[i]._id });
    projects[i].bugsCount = count;
  }

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
    httpOnly: true,
    sameSite: "Lax"
  };

  if (ctx.request.headers["user-agent"].includes("Windows")) {
    options.sameSite = "none";
  }

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
  const updated = {
    name: ctx.request.body.name,
    description: ctx.request.body.description
  };

  const project = await Project.findByIdAndUpdate(
    ctx.request.body._id,
    updated,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false
    }
  );

  const count = await Bug.countDocuments({ project: ctx.request.body._id });

  project.bugsCount = count;

  ctx.status = 200;
  ctx.response.body = {
    success: true,
    data: project
  };
};

// @desc Delete project
// @route DELETE /api/v1/projects
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
