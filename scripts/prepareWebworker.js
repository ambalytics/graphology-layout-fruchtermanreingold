var fs = require('fs');

var furchtermanReingold = require('../fruchterman-reingold');
var webworker = fs.readFileSync('./webworker.js', 'utf-8');

var impl = furchtermanReingold.fruchtermanReingoldImpl.toString();
var manipulatedWebWorker = webworker.replace(
  /[^\n]*\/\/\s*<%= fruchtermanReingoldImpl %>/,
  impl.toString()
);

fs.writeFileSync('./webworker.js', manipulatedWebWorker, 'utf-8');
