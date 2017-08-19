const redis = require('redis');
const client = redis.createClient();
const request = require('request');
const workerFarm = require('worker-farm');
const workers = workerFarm(require.resolve('./child'));

function jobQueue() {
	this.queue = [];
	this.jobs = {};
	this.start = 0;
}

jobQueue.prototype.add = function(url) {
  var self = this;
  url = 'http://' + url;
  self.queue.push(url);
  var id = self.getId(0);
  self.jobs[id] = url;
  for (var i = self.start; i < self.queue.length; i++) {
    self.start += 1;
  	workers(self.queue[i], function(err, res, body, url) {
      client.set(url, JSON.stringify(body));
    });
  }
  return id;
}

jobQueue.prototype.getId = function(num) {
	var result = num + Math.floor(Math.random() * 1000);
	if (result in this.jobs) {
    return this.getId(result);
	} else {
		return result;
	}
}

jobQueue.prototype.check = function(id, cb) {
  var url = this.jobs[id];
  if (url === undefined) {
  	cb('id not found');
  }
  client.get(url, function(err, reply) {
  	if (err) {
  		console.log(err);
  	} else if (reply === null) {
  		cb('job is processing');
  	} else {
      cb(reply.toString());	
  	}
  });
}

module.exports = jobQueue;