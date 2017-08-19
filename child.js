var request = require('request');

module.exports = function(url, cb) {
  request(url, function(err, res, body) {
    cb(err, res, body, url);
  });
};