var WalkManifest = require('./walk-manifest');
var WriteData = require('./write-data');
var fs = require('react-native-fs');

var main = function(options) {
  console.log('Gathering Manifest data...');
  var resources = WalkManifest(options.decrypt, options.output, options.input, options.headers);

  return WriteData(options.decrypt, options.concurrency, resources, options.headers);
};

module.exports = main;
