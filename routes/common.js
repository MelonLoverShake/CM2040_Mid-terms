const express = require('express');
const router = express.Router();
const date_time = new Date();
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const bodyParser = require('body-parser');
const Joi = require('joi');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

router.get('/logout', function (req, res) {
  // Purpose: This route is responsible for destroying the user's session and redirecting them to the login page.

  // Inputs:
  // - req.session - The user's current session.

  // Destroy the session
  req.session.destroy(function (err) {
    if (err) {
      // If there is an error destroying the session, log the error and send a 500 Internal Server Error response.
      console.error('Error destroying session:', err);
      res.sendStatus(500);
    } else {
      // If the session is destroyed successfully, log a success message and redirect the user to the login page.
      console.log("Session has been successfully destroyed");
      res.redirect('/login');
    }
  });
});
  
router.get('/AccessDenied', function (req, res) {
  // Purpose: This route is responsible for rendering the 'AccessDenied' view when an unauthorized user attempts to access a restricted resource.

  // Inputs:
  // - None

  // Render the 'AccessDenied' view and pass in a title for the page.
  res.render('AccessDenied', {
    title: "Access Denied | CuteBlog Blogging",
  });
});
  
router.get('/user-profile', function (req, res) {
  // Purpose: This route is responsible for rendering the user profile page with the user's information.

  // Inputs:
  // - req.session.userId - The ID of the user whose profile is being displayed.

  const userId = req.session.userId;

  // Fetch the user information from the database using the userId
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      // If there is an error fetching the user information, log the error and send a 500 Internal Server Error response.
      console.error(err);
      return res.status(500).send('Error fetching user information');
    }

    if (!user) {
      // If the user is not found in the database, send a 404 Not Found response.
      return res.status(404).send('User not found');
    }

    // Get the current date in the local format.
    const currentDate = new Date().toLocaleDateString();

    // Render the 'user-profile' view and pass in the user's information and the current date.
    res.render('user-profile', {
      title: "User Settings | CuteBlog Blogging",
      currentDate: currentDate,
      user: user
    });
  });
});

router.post('/user-settings', function (req, res) {
  // Purpose: This route is responsible for updating a user's settings, including their username and email.

  // Define the validation schema
  const schema = Joi.object({
    username: Joi.string()
      .min(8)
      .max(20)
      .required()
      .messages({
        'string.min': 'Username must be at least 8 characters long',
        'string.max': 'Username must be no more than 20 characters long',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Invalid email address',
        'any.required': 'Email is required'
      })
  });

  // Inputs:
  const { username, email } = req.body;
  const userId = req.session.userId;

  // Validate the request body using the schema
  const { error } = schema.validate(req.body);
  if (error) {
    // If there is a validation error, return the first error message
    return res.status(400).json({ error: error.details[0].message });
  }

  db.run(
    'UPDATE users SET username = ?, email = ? WHERE id = ?',
    [username, email, userId],
    function (err) {
      if (err) {
        // If there is an error updating the user's settings, log the error and send a 500 Internal Server Error response.
        console.error(err);
        return res.status(500).send('Error updating user settings');
      }

      res.redirect('/common/user-profile');
    }
  );
});

router.post('/process-delete', function (req, res) {
  // Purpose: This route is responsible for deleting a user account from the database and clearing the user's session.
  
  // Inputs:
  // - req.session.userId - The ID of the user whose account is being deleted.
  
  const userId = req.session.userId;

  db.run(
    // This SQL query deletes the user with the specified userId from the users table in the database.
    'DELETE FROM users WHERE id = ?',
    [userId],
    function (err) {
      if (err) {
        // If there is an error deleting the user, log the error and send a 500 Internal Server Error response.
        console.error(err);
        return res.status(500).send('Error deleting user account');
      }

      // Clear the user's session
      req.session.destroy(function (err) {
        if (err) {
          // If there is an error clearing the user's session, log the error and send a 500 Internal Server Error response.
          console.error(err);
          return res.status(500).send('Error clearing user session');
        }

        // If the user account was deleted and the session was cleared successfully, send a success message.
        res.send('User account deleted successfully');
      });
    }
  );
});


module.exports = router;