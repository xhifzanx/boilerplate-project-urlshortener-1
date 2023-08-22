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
  original_url: String,
  short_url: String
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
    return res.status(500).json({ error: 'invalid url' })
  }
  dns.lookup(u, function(err, data) {
    if (err) {
      return res.status(500).json({ error: 'invalid url' })
    }
   
    Website.findOne({original_url: url}).then((data) => {
      console.log(data == null )
      if (data == null) {
        Website.find().then((data) => {
          var short_url = String(data.length + 1)
          var website = new Website({ original_url: url, short_url: short_url })
          website.save().then((data) => {
            res.json({ original_url: url, short_url: Number(short_url) })
          }).catch(error => {
            console.error('Error:', error);
          });
        }).catch(error => {
          console.error('Error:', error);
        });
      } else {
        res.json({original_url: data.original_url, short_url: Number(data.short_url)})
      }
    }).catch(error => {
      console.error('Error:', error);
    });

  })
})

app.get('/api/shorturl/:shorturl?', function(req, res) {
  if (req.params.shorturl != undefined) {
    var short_url = req.params.shorturl
    await Website.findOne({short_url: short_url}).then((data) => {
      if (data == null) {
        return res.json({"error":"No short URL found for the given input"})
      }
      res.redirect(data.original_url)
    }).catch(error => {
      console.error('Error:', error);
    });
  } else {
    return res.status(500).json({"error":"Wrong format"})
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
