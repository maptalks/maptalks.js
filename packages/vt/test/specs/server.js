const express = require('express');
const { join } = require('path');

function startServer(port, cb) {
  const app = express();
  app.use(express.static(join(__dirname, './resources')));
  return app.listen(port, cb);
}

module.exports = startServer;
