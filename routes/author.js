/**
 * These are the routes for the author feature
 */

const express = require('express');
const router = express.Router();
const date_time = new Date();
const { check, validationResult } = require('express-validator');

/**
 * Formats a Date object into a string in the format suitable for SQLite databases.
 *
 * @param {Date} date - The Date object to be formatted.
 * @returns {string} The formatted date and time string in the format "YYYY-MM-DD HH:MM:SS".
 * @throws {Error} If the input `date` is not a valid Date object.
 */
function formatDateForSQLite(date) {
  if (!(date instanceof Date)) {
      throw new Error("Invalid Date object");
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate;
}

/**
 * Middleware function to check if the user has the required permissions.
 *
 * @param {Object} req - The incoming HTTP request object.
 * @param {Object} res - The outgoing HTTP response object.
 * @param {Function} next - The next middleware function in the stack.
 * @returns {void}
 */
const requiredPerms = (req, res, next) =>
  {
      // Check if the user's ID in the session is not equal to 1
      if (req.session.userId !== 1)
      {
          // If the user does not have the required permissions,
          // render the "AccessDenied" view and send the response
          res.render("AccessDenied");
      }
      else
      {
          // If the user has the required permissions,
          // call the next middleware function in the stack
          next();
      }
};
const redirectlogin = (req, res, next) => {
  if (!req.session.username) {
    res.redirect('/login');
  } else {
    next();
  }
}


/**
 * Route handler for the '/create-post' endpoint.
 *
 * @param {Object} req - The incoming HTTP request object.
 * @param {Object} res - The outgoing HTTP response object.
 * @returns {void}
 */
router.get('/create-post', requiredPerms, (req, res) =>
  {
      // Render the 'create-post' view
      res.render('create-post');
  });

router.post('/create-post-process', (req, res, next) => {
  const { title, subtitle, content } = req.body;
  const userId = req.session.userId; // Assuming you have stored the userId in the session

  
  const createdAt = new Date();

  const formattedcreated = formatDateForSQLite(createdAt);

  // Insert the new post into the Posts table with the current date and time
  global.db.run(
    `INSERT INTO Posts (title, subtitle, content, userId, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [title, subtitle, content, userId, formattedcreated],
    function (err) {
      if (err) {
        // Handle the error appropriately
        return next(err);
      }

      // The post was successfully created
      const postId = this.lastID;

      // Redirect to the newly created post's page or any other desired location
      res.redirect('/author/author-home');
    }
  );
});

/**
 * Route handler for the '/view-post' endpoint.
 *
 * @param {Object} req - The incoming HTTP request object.
 * @param {Object} res - The outgoing HTTP response object.
 * @returns {void}
 */
router.get('/view-post', (req, res) =>
  {
      // Render the 'view-post' view
      res.render('view-post');
  });

router.get('/author-settings',(req,res) =>
{
      global.db.get('SELECT * FROM Settings',(err,row) =>
      {
            if (err)
            {
                  console.log(err);
            }
            else
            {
                  console.log('Success pass to the page.');
                  res.render('author-settings', {settings: row});
            }
      });
});

router.post('/update-settings',[check('title').not().isEmpty(), check('subtitle').not().isEmpty(), check('author').not().isEmpty()], (req, res) => {
      const title = req.body.title; // Assuming the updated settings are sent in the request body

      const subtitle = req.body.subtitle;

      const author = req.body.author;
       
      console.log(req.body.title);
      
      console.log(author);
      
      const sql = 'UPDATE Settings SET title = ?, subtitle = ?, author = ?';
    
      // Assuming you are using the sqlite3 library for SQLite
      global.db.run(sql, [title, subtitle, author], function (err) {
        if (err) {
          console.log(err);
          res.status(500).send('Error updating settings');
        } else {
          res.redirect('/author/author-settings');
        }
      });
      
});


router.get('/author-home', requiredPerms, (req, res) => {
  // Query the settings table
  global.db.get('SELECT * FROM Settings', (err, settingsRow) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      // Query the posts table and the comments table to get the comment count for each post
      global.db.all('SELECT p.*, (SELECT COUNT(*) FROM Comments c WHERE c.postId = p.id) AS commentCount FROM Posts p', (err, postsRows) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        } else {
          console.log("postsRows:", postsRows);
          // Dynamic title
          const dynamicTitle = 'Author Home Page | CuteBlog Blogging';
          res.render('author-home', { 
            settings: settingsRow, 
            posts: postsRows, 
            title: dynamicTitle, 
          });
        }
      });
    }
  });
});

router.get('/DashBoard', (req, res) => {
      db.all('SELECT * FROM Posts WHERE status = "published"', (err, posts) => {
        if (err) {
          console.error('Error fetching published posts:', err);
          return res.status(500).send('Error fetching published posts');
        }
    
        res.render('DashBoard', {
          title: "Dashboard | CuteBlog Blogging",
          username: req.session.username,
          posts: posts
        });
      });
});

router.post('/delete-post', (req, res) => {
  try {
    const postId = req.body.postid;

    console.log(postId);

    
    
    // Delete the post from the database
    db.run('DELETE FROM Posts WHERE id = ?', [postId], function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send('Error deleting the post.');
      }

      // Check if any rows were affected
      if (this.changes === 0) {
        return res.status(404).send('Post not found.');
      }

      res.redirect('/author/author-home');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

router.post('/delete-publishedpost', (req, res) => {
  const postId = req.body._postid;
  const userId = req.session.userId;

  console.log(postId);
  console.log(userId);

  // Check if the post is published before deleting
  db.get('SELECT status FROM Posts WHERE id = ?', [postId], (err, row) => {
      if (err) {
          console.log(err);
          return res.status(500).send('Error checking post status.');
      }

      if (!row || row.status !== 'published') {
          return res.status(404).send('Post not found or not published.');
      }

      // Delete the post from the database
      db.run('DELETE FROM Posts WHERE id = ?', [postId], function(err) {
          if (err) {
              console.log(err);
              return res.status(500).send('Error deleting the post.');
          }

          // Check if any rows were affected
          if (this.changes === 0) {
              return res.status(404).send('Post not found.');
          }

          res.redirect('/author/author-home');
      });
  });
});

router.post('/edit-post', (req, res) => {
  const postId = req.body.postid_for;

  db.get('SELECT * FROM Posts WHERE id = ?', [postId], (err, post) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send('Error retrieving post.');
    } else {
      if (!post) {
        return res.status(404).send('Post not found.');
      }

      // Pass the post data to the edit post page
      res.render('edit-post', {
        post: post
      });
    }
  });
});

router.post('/update-post', (req, res) => {
  const { postId, title, subtitle } = req.body;
  const content = req.body.content;
  const modifiedAt = new Date(); // Get the current time
  const formattedmodifed = formatDateForSQLite(modifiedAt);

  // Fetch the existing post content
  db.get('SELECT content FROM Posts WHERE id = ?', [postId], (err, existingPost) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send('Error fetching post.');
    }

    // Insert the old content into the PostHistory table
    db.run(
      'UPDATE Posts SET PostHistory = ?, modifiedAt = ?  WHERE id = ?',
      [existingPost.content, formattedmodifed, postId],
      (err) => {
        if (err) {
          console.log(err.message);
          return res.status(500).send('Error saving post history.');
        }

        // Update the post with the new content
        db.run(
          'UPDATE Posts SET title = ?, subtitle = ?, content = ?, ModifiedAt = ? WHERE id = ?',
          [title, subtitle, content, formattedmodifed, postId],
          (err) => {
            if (err) {
              console.log(err.message);
              return res.status(500).send('Error updating post.');
            } else {
              // Redirect the user to the updated post or the list of posts
              return res.redirect('/author/author-home'); // or res.redirect('/posts');
            }
          }
        );
      }
    );
  });
});

router.post('/publish-post/:postId', (req, res) => {
  try {
    const postId = req.params.postId;

    // Get the current date and time
    const publishedDate = new Date();

    const formattedpublish = formatDateForSQLite(publishedDate);

    console.log(formattedpublish);

    // Update the status of the post to 'published' in the database
    db.run('UPDATE Posts SET status = ?, publishedAt = ? WHERE id = ?', ['published', formattedpublish, postId], function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error publishing the post.');
      }

      // Check if any rows were affected
      if (this.changes === 0) {
        return res.status(404).send('Post not found.');
      }

      res.redirect('/author/author-home');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});

// Route to view post version history
router.post('/version-history', (req, res) => {
  const postId = req.body.postid_;

  console.log(postId);

  // Fetch the post information
  db.get(`SELECT * FROM posts WHERE id = ?`, [postId], (err, post) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching post information');
    }

    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Render the post information to the page
    res.render('version-history', { post });
  });
});

router.get('/',(req,res) =>
{
     res.render('author-home')
});

  

module.exports = router;
