const WalkManifest = require('./walk-manifest');
const WriteData = require('./write-data');

const main = function (options) {
  console.log('Gathering Manifest data...');
  const resources = WalkManifest(options.decrypt, options.output, options.input, options.headers);

  return WriteData(options.decrypt, options.concurrency, resources, options.headers);
};

module.exports = main;
