const Router = require("koa-router");
const passport = require("koa-passport");
const {
  createProject,
  getProject,
  getProjects,
  setProject,
  deleteProject,
  updateProject
} = require("../controllers/projects");

const router = new Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createProject
);
router.get(
  "/getProject",
  passport.authenticate("jwt", { session: false }),
  getProject
);
router.get(
  "/getProjects",
  passport.authenticate("jwt", { session: false }),
  getProjects
);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  setProject
);
router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  updateProject
);
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  deleteProject
);

module.exports = router.routes();
