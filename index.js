const express = require('express')
const app = express()
const router = express.Router();
const compression = require('compression');
const { check, validationResult } = require('express-validator'); //inclusion off express-validator module  
const port = 3000; //Port used for Connection
const expressSanitizer = require('express-sanitizer'); //inclusion of express-sanitizer module 
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const expiryDate = new Date(Date.now() + 60 * 60 * 1000); //Cookie Expires after 1 hour of inactivity


app.use(compression()); //greatly decrease the size of the response body and hence increase the speed of the application.

const ApplicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // limit each IP to 8 requests per windowMs
  message: 'Too many attempts from this IP, please try again after 15 minutes'
});


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ['self','localhost'],
      scriptSrc: ['self', 'localhost']
    },
  })
);


// X-XSS-Protection
app.use(helmet.xssFilter());

// items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database('./database.db', function (err){
if (err)
{
  console.error(err);
  process.exit(1); //Bail out as we can't connect to the DB
}
else
{
  console.log('Database Connected');
  global.db.run('PRAGMA foreign_keys=ON'); //This tells SQLite to pay attention to foreign key constraints
}
});



app.disable('x-powered-by');

// configure body parser to be able to receive the request body
const bodyParser = require ("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// set the app to use ejs for rendering
app.set('view engine', 'ejs');

// use static files on the assets,css and Image Folders
const cssdirectory = express.static(__dirname + '/css');
const scriptdirectory = express.static(__dirname + '/scripts');
const ImageDirectory = express.static(__dirname + '/assets');
app.use(expressSanitizer()); //added for sanitisation 

// add the reader routes to the app under the path /
const readerRoutes = require('./routes/reader');
app.use('/', readerRoutes);

// add the author routes to the app under the path /author
const authorRoutes = require('./routes/author');
app.use('/author', authorRoutes);

// add the common routes between reader and author under the path /common
const commonRoutes = require('./routes/common');
app.use('/common', commonRoutes);

//Setting up Express.js to serve static files from three different directories
app.use('/css/',cssdirectory);
app.use('/scripts/',scriptdirectory);
app.use('/assets/', ImageDirectory);

//add the Rate Limit to the application of CuteBlog
app.use(ApplicationLimiter);

app.use(session({
  secret: 's3Cur3',
  name: 'sessionId',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: expiryDate,
    domain: 'localhost'
  },
  rolling: true
}))


app.listen(port, () => {
  console.log(`CuteBlog Application listening on port ${port}`)
});
