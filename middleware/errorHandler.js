function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        success: false,
        error: err.message || "Service Error"
      };

      if (err.name === "CastError") {
        const message = `Resource not found with id of ${err.value}`;
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: message
        };
      }

      if (err.code === 11000) {
        const message = "Duplicate field value entered";
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: message
        };
      }

      if (err.name === "ValidateError") {
        const message = Object.values(err.errors).map(val => val.message);
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: message
        };
      }
    }
  };
}

module.exports = errorHandler;
