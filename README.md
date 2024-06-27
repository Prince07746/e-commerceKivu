# e-commerce Kivu
a full stack web app ( e-commerce web app with all Shopify accessories)

![Screenshot 2024-06-27 154753](https://github.com/Prince07746/e-commerceKivu/assets/98363125/e9fd75d5-376e-4d4f-9d50-1323caa8781a)


![Screenshot 2024-06-27 144451](https://github.com/Prince07746/e-commerceKivu/assets/98363125/6bd94d2f-dcb6-4389-9246-fe2a805229f2)
![Screenshot 2024-06-27 151347](https://github.com/Prince07746/e-commerceKivu/assets/98363125/0a92ac6c-25c5-4fb4-8b8c-d32e5a7fdafe)

# Technology 
- Node.js, SQL
- API
- HTML, EJS,
- JAVASCRIPT, JQUERY
- BOOTSTRAP, BOXICON
- MYSQL

This code is a Node.js script that sets up an Express server with various middleware, routes, and configurations. It uses MySQL as the database, EJS as the view engine, and Nodemailer for sending emails. The server listens on port 3030.

Here's a breakdown of the code:

Import required modules:
express: web framework for Node.js
mysql2/promise: MySQL connector for Node.js with promises
body-parser: middleware for parsing incoming request bodies
ejs: view engine for rendering HTML templates
fs: built-in module for file system operations
nodemailer: module for sending emails
path: built-in module for handling file paths
Fuse.js: library for fuzzy searching
multer: middleware for handling file uploads
dotenv: module for loading environment variables from a .env file
cookie-parser: middleware for parsing cookies
console: built-in module for logging
Create Express app and set up middleware:
Set up JSON and URL-encoded form data parsing
Set up static directories for serving files
Set up EJS as the view engine
Set up cookie-parser
Create MySQL connection pool and test the connection

Define helper functions for authentication and login

Define routes for handling user login, signup, and logout

Define routes for handling home page, search, and item details

Define routes for handling classifier (category) pages

Define routes for handling admin pages (add/edit/delete products and users)

Define routes for handling user dashboard

Start the server on port 3030

The code contains a lot of routes and functionality for handling user authentication, CRUD operations for products and users, and rendering views using EJS templates. The main focus is on creating an e-commerce website with user accounts, product listings, and a shopping cart.
