require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const mongoose = require('mongoose')
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const conn = mongoose.connection
conn.on('connected', function() {
  console.log("mongoose connected")
})

const websiteSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
})

let Website = mongoose.model('Website', websiteSchema);



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/api/shorturl', function(req, res) {
  var url = req.body.url;
  if (url.includes('https') || url.includes('http')) {
    var u = url.split('/')[2]
  } else {
    var u = url
  }
  dns.lookup(u, function(err, data) {
    if (err) {
      return res.json({ error: 'invalid url' })
    }

    Website.find().then((data) => {
      var short_url = data.length + 1
      var website = new Website({ original_url: url, short_url: short_url })
      website.save().then((data) => {
        res.json({ original_url: url, short_url: short_url })
      })
    })

  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
