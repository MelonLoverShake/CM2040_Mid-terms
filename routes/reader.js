/**
 * These are the routes for the reader feature
 */
const express = require('express');
const router = express.Router();
const date_time = new Date();
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 4, // limit each IP to 4 requests per windowMs
  message: 'Too many login/register attempts from this IP, please try again after 15 minutes'
});

const redirectlogin = (req, res, next) => {
  if (!req.session.username) {
    res.redirect('/login');
  } else {
    console.log("The session UserId is set as: " + req.session.userId);
    next();
  }
}

router.get('/', (req, res, next) => {
  /**
 * @description set the main route to redirect to the home route
 */
  try {
    // Render the 'mainpage' view and send the response to the client.
    res.render('mainpage');
  } catch (err) {
    // Log the error
    console.error('Error rendering mainpage:', err);

    // Send a generic error response to the client
    return res.status(500).send('An error occurred');
  }
});

router.get('/register', function (req, res) {
  // Purpose: This route is responsible for rendering the registration page.

  // Render the 'register' view and pass the title parameter to the view.
  res.render('register', {
    title: "Account Register | CuteBlog Blogging"
  });
});

router.post('/register-process', [
  // Middleware to validate the input fields
  check('email').isEmail(),
  check('username').not().isEmpty(),
  check('password').isLength({ min: 8 }),
],
loginLimiter,
function(req, res) {
  // Purpose: This route is responsible for processing the user registration form.

  // Validate the input fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.redirect('/register');
  }

  // Sanitize and retrieve the input values
  const plainPassword = req.sanitize(req.body.password);
  const sanitizedUsername = req.sanitize(req.body.username);
  const email = req.sanitize(req.body.email);

  const saltRounds = 10;

  // Check if the username already exists
  const sql = 'SELECT * FROM Users WHERE username = ?';
  db.get(sql, [sanitizedUsername], function(err, row) {
    if (err) {
      console.error(err);
      return res.status(500).send('Error checking for existing username');
    }

    if (row) {
      console.log("Username has been taken!");
      return res.render('register', { usernameError: 'Username already taken' });
    }

    // Hash the password
    bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
      if (err) {
        console.error(err);
        return res.status(500).send('Error hashing password');
      }

      // Insert the data into the SQLite database
      const insertSql = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)';
      const values = [sanitizedUsername, hashedPassword, email];

      db.run(insertSql, values, function(err) {
        if (err) {
          console.error(err);
          return res.status(500).send('Error inserting data into the database');
        }
        else {
          // Sending confirmation message by rendering empty ejs template with array of strings
          var message = ["Success!", "You are now registered. You may login as " + sanitizedUsername + " now.", "Your user name is: " + sanitizedUsername, "Your hashed password is: " + hashedPassword];
          res.render('confirmation.ejs', { messages: message });
        }
      });
    });
  });
});

router.get('/login', function (req, res) {
  // Purpose: This route is responsible for rendering the login page.

  // Render the 'login' view and pass the title parameter to the view.
  res.render('login', {
    title: "Account Login | CuteBlog Blogging"
  });
});


router.post('/login-process', loginLimiter, function (req, res) {
  // Purpose: This route is responsible for handling the login process.
  // It receives the user's login credentials, validates them against the database,
  // and manages the user's session if the login is successful.

  // Inputs:
  // - req.body.password: The plain-text password entered by the user.
  // - req.body.input: This can be either the user's username or email.
  // - loginLimiter: A middleware function that limits the number of login attempts
  //   to prevent brute-force attacks.

  const input = req.body.input;
  const plainPassword = req.body.password;

  db.serialize(function() {
    // Searching the database for the username or email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [input, input], function(err, row) {
      if (err) throw err;

      if (!row) {
        // Username/email not found, sending an error message
        var message = ["Failure", "Login unsuccessful.", "Username/email incorrect, please try again."];
        res.render('confirmation.ejs', { messages: message });
      } else {
        // Comparing entered password to the hashed password in the database
        const hashedPassword = row.password;
        bcrypt.compare(plainPassword, hashedPassword, function(err, result) {
          if (err) throw err;
          else {
            if (!result) {
              // Passwords don't match, sending an error message
              var message = ["Failure", "Login unsuccessful.", "Password incorrect, please try again."];
              res.render('confirmation.ejs', { messages: message });
            } else {
              // Saving user session since login was successful
              req.session.userId = row.id;
              req.session.email = row.email;
              req.session.username = row.username;
              // Sending a confirmation by rendering empty ejs template with array of strings
              var message = ["Success!", "You are now logged in."];
              res.render('confirmation.ejs', { messages: message });
            }
          }
        });
      }
    });
  });
});

router.get('/about', function (req, res) {
  // Purpose: This route is responsible for rendering the "About" page.

  // Render the 'about' view and pass the title parameter to the view.
  res.render('about', {
    title: "About the developer | CuteBlog Blogging"
  });
});

router.get('/DashBoard', redirectlogin, (req, res) => {
  // Purpose: This route is responsible for rendering the Dashboard page, which displays
  // a list of published blog posts and the blog settings.

  // Inputs:
  // - redirectlogin: A middleware function that redirects the user to the login page
  //   if they are not logged in.
  // - req.session.username: The username of the currently logged-in user, which is
  //   retrieved from the session.

  // Fetch the published blog posts
  db.all('SELECT * FROM Posts WHERE status = "published" ORDER BY publishedAt DESC', (err, posts) => {
    if (err) {
      console.error('Error fetching published posts:', err);
      return res.status(500).send('Error fetching published posts');
    }

    // Fetch the blog settings
    db.get('SELECT * FROM Settings', (err, settings) => {
      if (err) {
        console.error('Error fetching blog settings:', err);
        return res.status(500).send('Error fetching blog settings');
      }

      // Render the 'DashBoard' view and pass the following data:
      // - title: The page title
      // - username: The username of the currently logged-in user
      // - posts: An array of published blog posts, ordered by publication date in descending order
      // - settings: The blog settings
      res.render('DashBoard', {
        title: "Dashboard | CuteBlog Blogging",
        username: req.session.username,
        posts: posts,
        settings: settings
      });
    });
  });
});

router.get('/view-post/:postid', function (req, res) {
  // Purpose: This route is responsible for rendering the "View Post" page, which displays
  // the details of a specific blog post and its associated comments.

  // Inputs:
  // - req.params.postid: The ID of the blog post to be viewed.
  // - req.session.userId: The ID of the currently logged-in user.
  // - req.session.username: The username of the currently logged-in user.

  const postid = req.params.postid;
  const userId = req.session.userId;
  const username = req.session.username;

  // Queries:
  // - commentsQuery: Retrieves the count of comments for the given post.
  // - commentQuery: Retrieves the comments for the given post, ordered by creation date in descending order.
  // - postQuery: Retrieves the details of the blog post with the given ID.
  // - userQuery: Retrieves the details of the user with the given ID.
  // - updateViewCountQuery: Increments the view count for the given blog post.

  const commentsQuery = 'SELECT COUNT(*) AS commentCount FROM Comments WHERE postId = ?';
  const commentQuery = 'SELECT * FROM Comments WHERE postId = ? ORDER BY createdAt DESC';
  const postQuery = 'SELECT * FROM Posts WHERE id = ?';
  const userQuery = "SELECT * FROM Users WHERE id = ?";
  const updateViewCountQuery = 'UPDATE Posts SET Views = Views + 1 WHERE id = ?';

  // Fetch the comment count for the given post
  db.get(commentsQuery, [postid], (err, commentCount) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Fetch the comments for the given post
    db.all(commentQuery, [postid], (err, comments) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Fetch the details of the blog post with the given ID
      db.get(postQuery, [postid], (err, post) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }

        // Update the view count for the blog post
        db.run(updateViewCountQuery, [postid], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          // Fetch the details of the user who created the blog post
          db.get(userQuery, [userId], (err, user) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            if (!user) {
              return res.status(404).json({ error: 'User not found' });
            }

            // Render the 'view-post' view and pass the following data:
            // - post: The details of the blog post
            // - comments: The comments for the blog post
            // - commentCount: The count of comments for the blog post
            // - user: The details of the user who created the blog post
            // - username: The username of the currently logged-in user
            res.render('view-post', { post: post, comments: comments, commentCount: commentCount.commentCount, user: user, username: username });
          });
        });
      });
    });
  });
});

router.post('/like-post', function (req, res) {
  // Purpose: This route is responsible for updating the likes count of a particular blog post based on post ID.

  // Inputs:
  // - req.body.postLikeId - The ID of the post being liked.
  // - req.body.userId - The ID of the user liking the post.

  const postId = req.body.postLikeId;

  // Directly update the likes count in the Posts table
  const updateLikesQuery = "UPDATE Posts SET likes = likes + 1 WHERE id = ?";
  db.run(updateLikesQuery, [postId], (err) => {
    if (err) {
      // If there is an error updating the likes count, log the error and send a 500 Internal Server Error response.
      console.error(err);
      return res.status(500).send('Error updating likes count');
    }

    // Redirect the user to the view-post page after updating the likes count.
    res.redirect(`/view-post/${postId}`);
  });
});


router.post('/dislike-post', function (req, res) {
  // Purpose: This route is responsible for updating the dislikes count of a particular blog post based on post ID.

  // Inputs:
  // - req.body.postdisLikeId - The ID of the post being disliked.
  // - req.body.userrid - The ID of the user disliking the post.

  const postId = req.body.postdisLikeId;
  const userId = req.body.userrid; // Assuming you have the user's ID in the request

  // Update the dislikes count in the Posts table
  const updateDislikesQuery = "UPDATE Posts SET dislikes = dislikes + 1 WHERE id = ?";
  db.run(updateDislikesQuery, [postId], (err) => {
    if (err) {
      // If there is an error updating the dislikes count, log the error and send a 500 Internal Server Error response.
      console.error(err);
      return res.status(500).send('Error updating dislikes count');
    }

    // Redirect the user to the dashboard page after updating the dislikes count.
    res.redirect(`/view-post/${postId}`);
  });
});

router.post('/add-comments', function(req, res) {
  // Purpose: This route is responsible for adding a new comment to the database.

  // Inputs:
  // - req.body.pstid - The ID of the post the comment is being added to.
  // - req.body.comment - The text content of the comment.
  // - req.body.commenter - The username of the user making the comment.

  const AddComments = 'INSERT INTO Comments (postId, text, comment_user) VALUES (?, ?, ?)';
  const postId = req.body.pstid;
  const text = req.body.comment;
  const userName = req.body.commenter;

  db.all(AddComments, [postId, text, userName], (err, result) => {
    if (err) {
      // If there is an error adding the comment, log the error and send a 500 Internal Server Error response with an error message.
      console.error('Error adding comment:', err);
      return res.status(500).json({ error: 'Error adding comment' });
    } else {
      // If the comment is added successfully, redirect the user to the dashboard.
      res.redirect(`/view-post/${postId}`);
    }
  });
});

router.get('/settings', function (req, res) {
  // Purpose: This route is responsible for rendering the user settings page.

  // Inputs:
  // - None

  // Render the 'settings' view.
  res.render('settings');
});

module.exports = router;