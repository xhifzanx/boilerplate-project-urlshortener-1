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
    return res.json({ error: 'invalid url' })
  }
  dns.lookup(u, async function(err, data) {
    if (err) {
      return res.json({ error: 'invalid url' })
    }
   
    await Website.findOne({original_url: url}).then(async (webiste) => {
      if (webiste == null) {
        await Website.find().then((result) => {
          var short_url = String(result.length + 1)
          var website = new Website({ original_url: url, short_url: short_url })
          website.save().then((data) => {
            console.log('created ' + data)
            res.json({ original_url: url, short_url: Number(short_url) })
          }).catch(error => {
            console.error('Error:', error);
          });
        }).catch(error => {
          console.error('Error:', error);
        });
      } else {
        console.log('found ' + webiste)
        res.json({ original_url: webiste.original_url, short_url: Number(webiste.short_url)})
      }
    }).catch(error => {
      console.error('Error:', error);
    });

  })
})

app.get('/api/shorturl/:short_url?',async function(req, res) {
  var short_url = req.params.short_url
  if (short_url !== undefined && String(short_url) != 'undefined') {
    if (!isNaN(Number(short_url))) {
      console.log('found short_url')
      await Website.findOne({short_url: short_url}).then((data) => {
        if (data == null) {
          return res.json({"error":"No short URL found for the given input"})
        }
        res.redirect(data.original_url)
      }).catch(error => {
        console.error('Error:', error);
      });
    } else {
      console.log(req.params)
      return res.json({"error":"Wrong format"})
    }

  } else {
    return res.status(404).json('No URL found')
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
