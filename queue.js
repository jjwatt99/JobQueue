const redis = require('redis');
const client = redis.createClient();
const request = require('request');
const workerFarm = require('worker-farm');
const workers = workerFarm(require.resolve('./child'));

function jobQueue() {
	var outer = this;
	this.queue = [];
	this.jobs = {};
	this.busy = false;
}

jobQueue.prototype.add = function(url) {
  var outer = this;
  url = 'http://' + url;
  this.queue.push(url);
  var id = this.getId(0);
  this.jobs[id] = url;
  if (this.busy === false) {
	  var ret = 0;
	  for (var i = 0; i < this.queue.length; i++) {
	  	this.busy = true;
	  	workers(this.queue[i], function(err, res, body, url) {
	      client.set(url, JSON.stringify(body));
	      if (ret + 1 === outer.queue.length) {
	      	workerFarm.end(workers);
	      	outer.busy = false;
	      }
	  	});
	  }
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
  	return 'id not found';
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