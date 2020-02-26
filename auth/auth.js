const passport = require("koa-passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");

let opts = {};
ExtractJwt.cookieExtractor = function(ctx) {
  let token = null;
  console.log("1");
  if (ctx && ctx.cookies.get("token")) {
    token = ctx.cookies.get("token");
  }
  console.log("2");
  return token;
};
opts.jwtFromRequest = ExtractJwt.cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(
  new JwtStrategy(opts, async function(jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  })
);
