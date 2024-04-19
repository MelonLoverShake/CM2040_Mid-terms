const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('login');
  });
  
router.get('/register', function (req, res) {
    res.render('register');
  });

router.get('/login', function (req, res) {
    res.render('login');
  });

router.get('/about', function (req, res) {
   res.render('about');
});


module.exports = router;