const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();

const { videos } = require('./config');

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-type, Authorization, X-CSRF-TOKEN, *');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method.toUpperCase() === 'OPTIONS') {
    res.status(200).send();
  } else {
    next();
  }
});

app.use(express.static(path.resolve('cache/recorder')));
app.get('/api/search', async (req, res) => {
  const { channel, date } = req.query;
  let results;
  try {
    results = await fs.readdir(path.resolve(`cache/recorder/${channel}/${date}`));
    if (results.length > 0) {
      const date = new Date();
      const last = results[results.length - 1];
      date.setHours(parseInt(last.slice(0, 2)));
      date.setMinutes(parseInt(last.slice(2, 4)));
      date.setSeconds(parseInt(last.slice(4, 6)));
      if (new Date().valueOf() - date.valueOf() < 60000) {
        results.pop();
      }
    }
  } catch (err) {
    results = [];
  }
  res.status(200).json(results);
});

app.get('/api/channels', (req, res) => {
  res.status(200).json(videos);
});

app.listen(11212);
console.log('video playback server start at 11212');
