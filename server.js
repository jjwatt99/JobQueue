const express = require('express');
const bodyParser = require('body-parser');
const jobQueue = require('./queue');
const app = express();
const queue = new jobQueue();

app.use(bodyParser.json());

app.post('/api/start', (req, res) => {
  var id = queue.add(req.body.url);
  res.json({job_id: id});
});

app.get('/api/check/:id', (req, res) => {
  queue.check(req.params.id, function(data) {
    res.json({response: data});
  });
});

app.listen(3000, function() {});