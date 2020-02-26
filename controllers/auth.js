const User = require("../models/User");
const jwt = require("jsonwebtoken");

// @desc Log user in
// @route POST /api/v1/auth/register
// @access Public
exports.register = async ctx => {
  const { name, email, password } = ctx.request.body;

  const user = await User.create({
    name,
    email,
    password
  });

  user.password = undefined;

  sendCookieResponse(user, 200, ctx);
};

// @desc Create new user
// @route POST /api/v1/auth/login
// @access Public
exports.login = async ctx => {
  const { email, password } = ctx.request.body;

  if (!email || !password)
    ctx.throw(400, "Please enter your name and password");

  let user = await User.findOne({ email }).select("+password");

  if (!user) ctx.throw(401, "Invalid credentials");

  const isMatch = await user.matchPassword(password);

  if (!isMatch) ctx.throw(401, "Invalid credentials");

  user.password = undefined;

  sendCookieResponse(user, 200, ctx);
};

// @desc Get current logged in user
// @route GET /api/v1/auth/me
// @access Private
exports.getMe = async ctx => {
  const token = ctx.cookies.get("token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  const { name, email, createdAt, updatedAt, projects } = user;

  ctx.status = 200;
  ctx.body = {
    success: true,
    data: {
      name,
      email,
      projects,
      createdAt,
      updatedAt
    }
  };
};

// @desc Logout current user
// @route GET /api/v1/auth/logout
// @access Private
exports.logout = async ctx => {
  let options = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: "none"
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  ctx.cookies.set("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: "none"
  });

  ctx.status = 200;
  ctx.body = {
    success: true
  };
};

// @desc Update user details
// @route PUT /api/v1/auth/updatedetails
// @access Private
exports.updateDetails = async ctx => {
  const token = ctx.cookies.get("token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const fieldsToUpdate = {};

  if (ctx.request.body.name) {
    fieldsToUpdate.name = ctx.request.body.name;
  }

  if (ctx.request.body.email) {
    fieldsToUpdate.email = ctx.request.body.email;
  }

  const user = await User.findByIdAndUpdate(decoded.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  const { name, email, createdAt, updatedAt } = user;

  ctx.status = 200;
  ctx.body = {
    seccess: true,
    data: {
      name,
      email,
      createdAt,
      updatedAt
    }
  };
};

// @desc Update password
// @route PUT /api/v1/auth/updatepassword
// @access Private
exports.updatePassword = async ctx => {
  const token = ctx.cookies.get("token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("+password");

  if (!(await user.matchPassword(ctx.request.body.currentPassword))) {
    ctx.throw(401, "Password is incorect");
  }

  user.password = ctx.request.body.newPassword;
  await user.save();

  sendCookieResponse(user, 200, ctx);
};

const sendCookieResponse = (user, statusCode, ctx) => {
  const token = user.getSignedJwtToken();

  let options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // if (ctx.request.headers["user-agent"].includes("Windows")) {
  //   options.sameSite = "none";
  // }

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  ctx.status = statusCode;

  ctx.cookies.set("token", token, options);

  ctx.body = {
    success: true,
    data: user
  };
};
