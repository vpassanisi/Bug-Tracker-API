const Router = require("koa-router");
const passport = require("koa-passport");
const {
  createBug,
  updateBug,
  bugsByProject,
  deleteBug
} = require("../controllers/bugs");

const router = new Router();

router.post("/", passport.authenticate("jwt", { session: false }), createBug);
router.put("/:id", passport.authenticate("jwt", { session: false }), updateBug);
router.get(
  "/project",
  passport.authenticate("jwt", { session: false }),
  bugsByProject
);
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  deleteBug
);

module.exports = router.routes();
