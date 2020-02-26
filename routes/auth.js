const Router = require("koa-router");
const passport = require("koa-passport");

const router = new Router();

const {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword
} = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", passport.authenticate("jwt", { session: false }), getMe);
router.get("/logout", passport.authenticate("jwt", { session: false }), logout);
router.put(
  "/updateDetails",
  passport.authenticate("jwt", { session: false }),
  updateDetails
);
router.put(
  "/updatePassword",
  passport.authenticate("jwt", { session: false }),
  updatePassword
);

module.exports = router.routes();
