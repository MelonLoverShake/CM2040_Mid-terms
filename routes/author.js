/**
 * These are the routes for the author feature
 */

const express = require('express');
const router = express.Router();
const date_time = new Date();
const { check, validationResult } = require('express-validator');


function formatDateForSQLite(date) {
  // Purpose: This function takes a JavaScript Date object and formats it into a string
  // that can be easily inserted into an SQLite database with a time zone adjustment to GMT+8.
  // Inputs: A JavaScript Date object representing the date and time to be formatted.
  // Outputs: A string in the format "YYYY-MM-DD HH:MM:SS" that can be used to insert
  // the date and time into an SQLite database.

  if (!(date instanceof Date)) {
      throw new Error("Invalid Date object");
  }

  // Adjust the date for GMT+8
  const gmtPlus8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);

  const year = gmtPlus8.getUTCFullYear();
  const month = String(gmtPlus8.getUTCMonth() + 1).padStart(2, '0');
  const day = String(gmtPlus8.getUTCDate()).padStart(2, '0');
  const hours = String(gmtPlus8.getUTCHours()).padStart(2, '0');
  const minutes = String(gmtPlus8.getUTCMinutes()).padStart(2, '0');
  const seconds = String(gmtPlus8.getUTCSeconds()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate;
}



const requiredPerms = (req, res, next) =>
  // Purpose: This middleware function checks if the user making the request has admin permissions.
  // Inputs: req (the Express request object), res (the Express response object), next (the next middleware function in the stack).
  // Outputs: If the user is an admin, calls the next middleware function. If the user is not an admin, renders the "AccessDenied" view and sends the response.
  // Check if the user's ID in the session is equal to 1 (assuming 1 represents an admin user)
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
  // Purpose: This middleware function checks if the user making the request is logged in. 
  // If the user is not logged in, it redirects them to the login page.
  // If the user is logged in, it calls the next middleware function in the stack.
  // Inputs: req (the Express request object), res (the Express response object), next (the next middleware function in the stack).
  // Outputs: If the user is not logged in, it redirects them to the login page. If the user is logged in, it calls the next middleware function.
  if (!req.session.username) {
    res.redirect('/login');
  } else {
    next();
  }
}


router.get('/create-post', requiredPerms, (req, res) =>
  // Purpose: This route handler function is responsible for rendering the 'create-post' page, which allows authenticated users with the required permissions to create a new blog post.
  // Inputs: req (the Express request object), res (the Express response object), requiredPerms (a middleware function that checks if the user has the necessary permissions to access this route).
  // Outputs: The function renders the 'create-post' view.
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


router.get('/view-post', (req, res) => {
  // Purpose: This route handler function is responsible for rendering the 'view-post' page, which displays the details of a specific blog post.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function renders the 'view-post' view, passing any necessary data (e.g., the post details) as part of the response.
  try {
    // Render the 'view-post' view
    res.render('view-post');
  } catch (error) {
    console.error('Error rendering view-post:', error);
    res.status(500).render('error', { message: 'An error occurred while rendering the view-post page.' });
  }
});

router.get('/author-settings', (req, res) => {
   // Purpose: This route handler function is responsible for rendering the 'author-settings' page, which allows an author to view and update their account settings.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function renders the 'author-settings' view, passing the user's current blog settings as part of the response.
  try {
    global.db.get('SELECT * FROM Settings', (err, row) => {
      if (err) {
        console.error('Error fetching settings:', err);
        res.status(500).render('error', { message: 'An error occurred while retrieving the settings.' });
      } else {
        console.log('Success passing to the page.');
        res.render('author-settings', { settings: row });
      }
    });
  } catch (error) {
    console.error('Error in /author-settings route:', error);
    res.status(500).render('error', { message: 'An unexpected error occurred.' });
  }
});

router.post('/update-settings', [
  check('title').not().isEmpty().withMessage('Title cannot be empty'),
  check('subtitle').not().isEmpty().withMessage('Subtitle cannot be empty'),
  check('author').not().isEmpty().withMessage('Author cannot be empty'),
], (req, res) => {
  // Purpose: This route handler function is responsible for updating the blog settings, such as the title, subtitle, and author name.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function either renders the 'author-settings' view with validation errors, or redirects the user to the '/author/author-settings' route after successfully updating the settings
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).render('author-settings', {
        settings: req.body,
        errors: errors.array(),
      });
    }

    const { title, subtitle, author } = req.body;

    const sql = 'UPDATE Settings SET title = ?, subtitle = ?, author = ?';

    global.db.run(sql, [title, subtitle, author], function (err) {
      if (err) {
        console.error('Error updating settings:', err);
        return res.status(500).render('error', { message: 'An error occurred while updating the settings.' });
      }
      res.redirect('/author/author-settings');
    });
  } catch (error) {
    console.error('Error in /update-settings route:', error);
    res.status(500).render('error', { message: 'An unexpected error occurred.' });
  }
});

router.get('/author-home', redirectlogin, requiredPerms, async (req, res) => {
  // Purpose: This route handler function is responsible for rendering the author-home page, which displays the blog settings and the list of posts with their comment counts.
// Inputs: req (the Express request object), res (the Express response object).
// Outputs: The function renders the 'author-home' view and passes data to the page such as posts.
  try {
    // Fetch settings from the database
    const settingsRow = await new Promise((resolve, reject) => {
      global.db.get('SELECT * FROM Settings', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Fetch posts and their comment count from the database
    const postsRows = await new Promise((resolve, reject) => {
      global.db.all('SELECT p.*, (SELECT COUNT(*) FROM Comments c WHERE c.postId = p.id) AS commentCount FROM Posts p', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    console.log("postsRows:", postsRows);

    // Dynamic title
    const dynamicTitle = 'Author Home Page | CuteBlog Blogging';

    // Render the 'author-home' view with the necessary data
    res.render('author-home', { 
      settings: settingsRow, 
      posts: postsRows, 
      title: dynamicTitle, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/DashBoard', (req, res) => {
  // Purpose: This route handler function is responsible for rendering the dashboard page, which displays a list of all published blog posts.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function fetches all published posts from the database and renders the dashboard view, passing the posts and the current user's username as data.
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
  // Purpose: This route handler function is responsible for deleting a post from the database.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function redirects the user to the '/author/author-home' route if the post is successfully deleted, or sends an error response if there are any issues.
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
  // Purpose: This route handler function is responsible for deleting a published post from the database.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function redirects the user to the '/author/author-home' route if the post is successfully deleted, or return an error message if any issues arises.
  try {
    const postId = req.body._postid;
    const userId = req.session.userId;

    console.log(postId);
    console.log(userId);

    // Check if the post is published before deleting
    db.get('SELECT status FROM Posts WHERE id = ?', [postId], (err, row) => {
      if (err) {
        console.error('Error checking post status:', err);
        return res.status(500).render('error', { message: 'An error occurred while checking the post status.' });
      }

      if (!row || row.status !== 'published') {
        return res.status(404).render('error', { message: 'Post not found or not published.' });
      }

      // Delete the post from the database
      db.run('DELETE FROM Posts WHERE id = ?', [postId], function(err) {
        if (err) {
          console.error('Error deleting the post:', err);
          return res.status(500).render('error', { message: 'An error occurred while deleting the post.' });
        }

        // Check if any rows were affected
        if (this.changes === 0) {
          return res.status(404).render('error', { message: 'Post not found.' });
        }

        res.redirect('/author/author-home');
      });
    });
  } catch (error) {
    console.error('Error in /delete-publishedpost route:', error);
    res.status(500).render('error', { message: 'An unexpected error occurred.' });
  }
});

router.post('/edit-post', async (req, res) => {
// Purpose: This route handler function is responsible for rendering the edit-post page for a specific post.
// Inputs: req (the Express request object), res (the Express response object).
// Outputs: The function renders the 'edit-post' view and passes the post information to the view.
  try {
    const postId = req.body.postid_for;

    // Fetch the post from the database
    const post = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM Posts WHERE id = ?', [postId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!post) {
      return res.status(404).send('Post not found.');
    }

    // Render the 'edit-post' view and pass the post data
    res.render('edit-post', {
      post: post
    });
  } catch (err) {
    console.error('Error retrieving post:', err.message);
    res.status(500).send('Error retrieving post.');
  }
});

router.post('/update-post', (req, res) => {
  // Purpose: This route handler function is responsible for updating an existing post.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function updates the post in the database and redirects the user to the author home page.
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
  // Purpose: This route handler function is responsible for publishing a post by updating its status and publishedAt date in the database.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: If the post is successfully published, the function redirects the user to the author-home page. If an error occurs, the function sends an respective error response.
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


router.post('/version-history', (req, res) => {
  // Purpose: This route handler function is responsible for rendering the version history for a specific post.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function renders the 'version-history' view and passes the past version of the particular post to the view.

  const postId = req.body.postid_;


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
  // Purpose: This route handler function is responsible for rendering the "author-home" view when a user visits the root URL of the author path.
  // Inputs: req (the Express request object), res (the Express response object).
  // Outputs: The function renders the "author-home" view and sends the response back to the client.
{
     res.render('author-home')
});

  

module.exports = router;
