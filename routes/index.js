module.exports = router => {
  router.prefix("/api/v1");
  router.use("/auth", require("./auth"));
  router.use("/bugs", require("./bugs"));
  router.use("/projects", require("./projects"));
};
