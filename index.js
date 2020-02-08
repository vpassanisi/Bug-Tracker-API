require("dotenv").config();
require("colors");
const server = require("./server");

const port = process.env.PORT || 5500;

server.listen(port, () =>
  console.log(`Server is running on ${port}`.yellow.bold)
);
