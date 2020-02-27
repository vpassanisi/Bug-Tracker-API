const Koa = require("koa");
const Router = require("koa-router");
const Logger = require("koa-logger");
const Cors = require("@koa/cors");
const BodyParser = require("koa-bodyparser");
const Helmet = require("koa-helmet");
const Filter = require("koa-content-filter");
const json = require("koa-json");
const respond = require("koa-respond");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const passport = require("koa-passport");
const errorHandler = require("./middleware/errorHandler");
const serve = require("koa-static-server");
const RateLimit = require("koa2-ratelimit").RateLimit;
const {
  default: sslify, // middleware factory
  resolver: xForwardedProtoResolver // resolver needed
} = require("koa-sslify");

dotenv.config({ path: "./config/.env" });

connectDB();

const app = new Koa();
const router = new Router();

app.proxy = true;

// if (process.env.NODE_ENV === "production") {
app.use(sslify({ resolver: xForwardedProtoResolver }));
// }

app.use(errorHandler());

app.on("error", (err, ctx) => {
  console.log(err);
});

app.use(Helmet());

if (process.env.NODE_ENV === "development") {
  app.use(Logger());
}

app.use(Cors({ credentials: true }));
app.use(Filter());
app.use(json());
app.use(
  BodyParser({
    enableTypes: ["json"],
    jsonLimit: "5mb",
    strict: true,
    onerror: function(err, ctx) {
      ctx.throw("body parse error", 422);
    }
  })
);

const limiter = RateLimit.middleware({
  interval: { min: 10 },
  max: 100
});

//  apply to all requests
app.use(limiter);

require("./auth/auth");
app.use(passport.initialize());

app.use(respond());

// API routes
require("./routes")(router);
app.use(router.routes());
app.use(serve({ rootDir: "./client/public" }));
app.use(router.allowedMethods());

module.exports = app;
