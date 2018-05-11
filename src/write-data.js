const Promise = require('bluebird');
const mkdirp = Promise.promisify(require('mkdirp'));
const request = require('requestretry');
const fs = Promise.promisifyAll(require('fs'));
const aesDecrypter = require('aes-decrypter').Decrypter;
const path = require('path');

const writeFile = function (file, content) {
  return mkdirp(path.dirname(file)).then(() => fs.writeFileAsync(file, content)).then(() => {
    console.log(`Finished: ${path.relative('.', file)}`);
  });
};

const requestFile = function (uri) {
  const options = {
    uri,
    timeout: 60000, // 60 seconds timeout
    encoding: null, // treat all responses as a buffer
    retryDelay: 1000, // retry 1s after on failure
  };
  return new Promise(((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      return resolve(body);
    });
  }));
};

const toArrayBuffer = function (buffer) {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
};

const decryptFile = function (content, encryption) {
  return new Promise(((resolve, reject) => {
    const d = new aesDecrypter(toArrayBuffer(content), encryption.bytes, encryption.iv, ((err, bytes) => resolve(new Buffer(bytes))));
  }));
};

const WriteData = function (decrypt, concurrency, resources) {
  const inProgress = [];
  const operations = [];

  resources.forEach((r) => {
    if (r.content) {
      operations.push(() => writeFile(r.file, r.content));
    } else if (r.key && decrypt) {
      operations.push(() => requestFile(r.uri).then(content => decryptFile(content, r.key)).then(content => writeFile(r.file, content)));
    } else if (inProgress.indexOf(r.uri) === -1) {
      operations.push(() => requestFile(r.uri).then(content => writeFile(r.file, content)));
      inProgress.push(r.uri);
    }
  });

  return Promise.map(operations, o => Promise.join(o()), { concurrency }).all((o) => {
    console.log('DONE!');
    return Promise.resolve();
  });
};

module.exports = WriteData;
