===================================================================================
**Basic Libraries required in my application**
1. ejs
2. express
3. sqlite3
===================================================================================
**Additional Libraries required in my application**
1. bcrypt
2. compression
3. express-rate-limit
4. express-sanitizer
5. express-session
6. express-validator
7. helmet
8. Joi

All the libraries above can be installed using the npm install <library-name> --save command
====================================================================================
**Important things to take attention**
My application has an authorization feature securing the author endpoints.

There's only one possible username that able to access the author endpoints.

Upon first login, only the first account registered are able to access the author endpoints as my application is made with the assumption there's only one author.

After registering the first account, You are able to login using either the **username** or **email**, alongside with your password to access the author endpoints.

Please access the application though the author endpoints before attempting to access the reader's as to allow the session to be created.
======================================================================================
My application can be run with  ```npm install```, ```npm run build-db```, and ```npm run start``` . 
======================================================================================
Name: Tan Yee Chong 
Module: CM2040
Student Number: 230668566
Submission Date: 8 July 2024
======================================================================================
