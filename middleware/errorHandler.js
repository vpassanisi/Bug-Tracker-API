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

      console.log(err);

      if (err.name === "CastError") {
        const message = `Resource not found with id of ${err.value}`;
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: [message]
        };
      }

      if (err.code === 11000) {
        const message = [];

        for (const property in err.keyValue) {
          message.push(`That ${property} already exists`);
        }

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

      if (err.name === "ValidationError") {
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
