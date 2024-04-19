const express = require('express')
const app = express()
const router = express.Router();
const port = 3000;


// set the app to use ejs for rendering
app.set('view engine', 'ejs');

const cssdirectory = express.static(__dirname + '/css');
const imagediretory = express.static(__dirname + '/assets');

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

const readerRoutes = require('./routes/reader');
app.use('/', readerRoutes);

app.use('/css/',cssdirectory);
app.use('/assets/', imagediretory);
