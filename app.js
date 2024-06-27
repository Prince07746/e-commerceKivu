// Import required modules
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const Fuse = require('fuse.js');
const multer = require('multer');
require('dotenv').config();
// cookies
const cookieParser = require('cookie-parser');
// Create Express app
const app = express();
const port = 3030; // You can change this port as needed



// Middleware for parsing JSON bodies
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Set the directory to serve static files
app.use(express.static(path.join(__dirname,'outil')));

app.use(express.static(path.join(__dirname,'BDI')));

app.use(express.static(path.join(__dirname,'node_modules')));


app.use(cookieParser());
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});























// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database!');
    connection.release(); // Release the connection
  })
  .catch(error => {
    console.error('Error connecting to MySQL database:', error);
  });












// PARAMETRE D'ENVOIE EMAIL   =====================================================================================
//===========================================================================================================================

app.post("/message/AB",async (req,res)=>{

  const {nom,email,message} = req.body;


  res.redirect("/apropos");
 // EnvoyerMail("Bonour GDP bous vous annocont la nouvelle trabsition de GDP a KIVU Business message du developeur en chef","Transition GDP to KIVU BUSINESS");




})








//===========================================================================================================================
//===========================================================================================================================












// Middleware for authentication


// Function to check if user is authenticated based on cookies and database
const isAuthenticated = async (cookies) => {

  if (cookies && cookies.authenticated === 'true') {
    // User is authenticated via cookie, proceed with checking database
    const email = cookies.email;
    const password = cookies.password;
    if (email && password) {
      // Authenticate user via database
      const [rows, fields] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ? AND MotDePasse = ?', [email, password]);
      if (rows.length > 0) {
        // User found in database
        return true;
      }
    }
  }

  // User not authenticated or not found in database
  return false;
};


// Route for handling login and creating authentication cookie
app.post('/login', async (req, res) => {
  try {
    // Retrieve email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).send('email and password are required');
    }

    // Authenticate user via database
    const [rows, fields] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ? AND MotDePasse = ?', [email, password]);

    if (rows.length > 0) {
      console.log(rows);
      // User found in database, set authentication cookie
      res.cookie('authenticated', 'true');
      res.cookie('email', email); // Optionally store username in cookie
      res.cookie('password', password); // Optionally store password in cookie
      res.redirect("/");
    } else {
      // User not found in database
      res.status(401).send('Invalid email or password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/login",async (req,res)=>{

try{
    // Check if user is authenticated
    const authenticated = await isAuthenticated(req.cookies);
    if (authenticated) {
    res.redirect("/")
    }
    else{
   res.render("login",{name:"prince"});
    }
}  catch (error){
  res.send("Error , we are working on the issue")
}


});

app.post('/signup', async (req, res) => {

  try {
    // Retrieve form data from the request body
    const { nom, email, password, numero } = req.body;

    // Check if all required fields are provided
    if (!nom || !email || !password || !numero) {
      return res.status(400).send('Name, email, password, and phone number are required');
    }
    // Check if user is authenticated
    const authenticated = await isAuthenticated(req.cookies);
    if (authenticated) {
      // If user is already authenticated, redirect to home page
      res.redirect('/');
    } else {
      // Check if the email already exists in the database
      const [existingUsers, _] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ?', [email]);
      if (existingUsers.length > 0) {
        // If email already exists, return error
        return res.status(400).send('Email already exists');
      }
      // Insert user information into the database
      const [result, fields] = await pool.query('INSERT INTO utilisateurs (NomUtilisateur, Email, MotDePasse, Téléphone) VALUES (?, ?, ?, ?)', [nom, email, password, numero]);

      // Check if insertion was successful
      if (result.affectedRows === 1) {
        // Render signup success page or redirect to login page
        res.redirect("/login");
      } else {
        // Insertion failed
        res.status(500).send('Failed to sign up');
      }
    }
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/signup', async (req, res) => {
  try {
  
// Check if user is authenticated
const authenticated = await isAuthenticated(req.cookies);
if (authenticated) {
  // If user is already authenticated, redirect to home page
  res.redirect('/');
} else {
   
  res.render("signup");


}


  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).send('Internal Server Error');
  }
});





// Route for handling logout and destroying authentication cookie
app.get('/logout', (req, res) => {
  try {
    // Clear authentication cookie
    res.clearCookie('authenticated');
    res.clearCookie('username');
    res.clearCookie('password');
    
    // Redirect to home page or any other appropriate page after logout
    res.redirect('/');
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).send('Internal Server Error');
  }
});























// Route for home page
app.get('/', async (req, res) => {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated(req.cookies);

    let userDataRows = null; // Initialize user data

    if (authenticated) {
      // User is authenticated, fetch user data from the database
      const email = req.cookies.email; // Retrieve username from cookie
      [userDataRows] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ?', [email]);
    }

    // Fetch latest 25 articles from the database
    const [rows, fields] = await pool.query(
      'SELECT * FROM articles ORDER BY cree_le DESC LIMIT 25'
    );
    // count the number of all items in the panier
    const [panierCountResult] = await pool.query('SELECT COUNT(*) as count FROM panier WHERE Email = ?', [req.cookies.email]);
    const panierCount = panierCountResult[0].count;
    // Determine user status for rendering purposes
    const utilisateur = authenticated ? "David" : "Membre";
    const logInfo = authenticated ? "bx bx-log-in" : "bx bx-user-circle";
    const log1Info = authenticated ? "logout" : "login";
    const log2Info = authenticated ? `+${panierCount}` : 0;
    
    // Render home page with fetched data
    res.render('home', {
      products: rows,
      utilisateur: utilisateur,
      logInfo: logInfo,
      log1Info: log1Info,
      panier: log2Info
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});




// Search route
app.post('/search', async (req, res) => {
  const { query } = req.body;

  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    // Perform a query to get all articles
    const [results] = await connection.query('SELECT * FROM articles');

    // Release the connection back to the pool
    connection.release();

    // Create a Fuse instance with the data and search options
    const fuse = new Fuse(results, {
      keys: ['nom', 'description'], // Specify the columns to search in
      includeScore: true, // Include search score for each result
      threshold: 0.4, // Adjust the threshold as needed
      shouldSort: true // Sort the results by search score
    });

    // Perform the fuzzy search
    const fuzzyResults = fuse.search(query);

    // Extract the search results from the fuzzy search result objects
    const filteredResults = fuzzyResults.map(result => result.item);

    // Send the filtered results to the client
    res.json(filteredResults);
  } catch (error) {
    console.error('An error occurred while performing the search:', error);
    res.status(500).json({ error: 'An error occurred while performing the search.' });
  }
});










// Route for viewing item details
// Route for viewing item details
app.get('/item/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated(req.cookies);

    // Fetch item details from the database based on the item ID
    const [article, fields] = await pool.query('SELECT * FROM articles WHERE id = ?', [itemId]);

    if (article.length === 0) {
      // Handle case where the item is not found
      res.status(404).send('Item not found');
      return;
    }

    const currentType = article[0].type;
    const currentSousType = article[0].sous_type;

    let produitsimillaire;
    if (authenticated) {
      // User is authenticated, fetch user data from the database
      const email = req.cookies.email; // Retrieve username from cookie
      const [userDataRows, userDataFields] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ?', [email]);

      // Fetch similar products, limiting the results to 15
      [produitsimillaire] = await pool.query(
        'SELECT * FROM articles WHERE (type LIKE ? OR soustype LIKE ?) AND id <> ? LIMIT 20', 
        [`%${currentType}%`, `%${currentSousType}%`, itemId]
      );

        // count the number of all items in the panier
    const [panierCountResult] = await pool.query('SELECT COUNT(*) as count FROM panier WHERE Email = ?', [req.cookies.email]);
    const panierCount = panierCountResult[0].count;
    const log2Info = authenticated ? `+${panierCount}` : 0;

      res.render('afficheurproduit', {
        produits: article,
        produitsimillaire: produitsimillaire,
        utilisateur: "David",
        logInfo: "bx bx-log-in",
        log1Info: "logout",
        panier: log2Info
      });

    } else {
      // Fetch similar products, limiting the results to 15
      [produitsimillaire] = await pool.query(
        'SELECT * FROM articles WHERE (type = ? OR soustype = ?) AND id <> ? LIMIT 15', 
        [currentType, currentSousType, itemId]
      );

      res.render('afficheurproduit', {
        produits: article,
        produitsimillaire: produitsimillaire,
        utilisateur: "Membre",
        logInfo: "bx bx-user-circle",
        log1Info: "login"
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get("/item/classifier/:id", async (req, res) => {
  const typeId = req.params.id;
 
  try {
    const authenticated = await isAuthenticated(req.cookies);
    
    if(authenticated){
       // Query to find exact matches
    const [exactMatchRows] = await pool.query('SELECT * FROM articles WHERE type = ?', [typeId]);
    const [panierCountResult] = await pool.query('SELECT COUNT(*) as count FROM panier WHERE Email = ?', [req.cookies.email]);
    const panierCount = panierCountResult[0].count;
  
    if (exactMatchRows.length > 0) {
      res.render('categoriseur', 
        { 
        products: exactMatchRows ,
        logInfo:"bx bx-user-circle",
        log1Info:"logout",
        panier: `+${panierCount}`
      });
    } else {
      // If no exact matches found, find similar items
      const [similarMatchRows] = await pool.query(`
        SELECT * FROM articles 
        WHERE type LIKE ? 
        OR type LIKE ? 
        OR type LIKE ?
      `, [`%${typeId}%`, `${typeId}%`, `%${typeId}`]);

      res.render('categoriseur', {
         products: similarMatchRows,
         logInfo:"bx bx-user-circle",
         log1Info:"logout",
        panier: `+${panierCount}`
        });
          
    }

    }else{

  // Query to find exact matches
  const [exactMatchRows] = await pool.query('SELECT * FROM articles WHERE type = ?', [typeId]);

  if (exactMatchRows.length > 0) {
    res.render('categoriseur', 
      { 
      products: exactMatchRows ,
      logInfo:"bx bx-log-in",
      log1Info:"logout",
      panier: 0
    });
  } else {
    // If no exact matches found, find similar items
    const [similarMatchRows] = await pool.query(`
      SELECT * FROM articles 
      WHERE type LIKE ? 
      OR type LIKE ? 
      OR type LIKE ?
    `, [`%${typeId}%`, `${typeId}%`, `%${typeId}`]);

    res.render('categoriseur', {
       products: similarMatchRows,
       logInfo:"bx bx-log-in",
       log1Info:"logout",
       panier: 0
      });
  }




    }
    


  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Internal Server Error');
  }
});






// Route to handle type and subtype
app.get("/item/classifier/:id1/:id2", async (req, res) => {
  const type = req.params.id1;
  const soustype = req.params.id2;

  try {
    // Check authentication
    const authenticated = await isAuthenticated(req.cookies);

    let rows = [];

    // Query to find articles with matching type and soustype
    [rows] = await pool.query('SELECT * FROM articles WHERE soustype = ? AND type = ?', [soustype, type]);
    
    if (rows.length === 0) {
      // If no articles found with both soustype and type, try finding based on soustype only
      [rows] = await pool.query('SELECT * FROM articles WHERE soustype = ?', [soustype]);
      
      if (rows.length === 0) {
        // If no articles found with soustype, try finding based on type
        [rows] = await pool.query('SELECT * FROM articles WHERE type = ?', [type]);
      }
    }

    // Retrieve panier count if authenticated
    let panierCount = 0;
    if (authenticated) {
      const [panierCountResult] = await pool.query('SELECT COUNT(*) as count FROM panier WHERE Email = ?', [req.cookies.email]);
      panierCount = panierCountResult[0].count;
    }

    if (rows.length > 0) {
      // If articles found, render the results with authentication information and panier count
      res.render('categoriseur', { 
        products: rows,
         logInfo: authenticated ? "bx bx-user-circle" : "bx bx-log-in", 
         log1Info: authenticated ? "logout": "login",
          panier: panierCount });
    } else {
      // If no articles found with both type and soustype, render an empty state
      res.render('categoriseur', { 
        products: [], 
        logInfo: authenticated ? "bx bx-user-circle" : "bx bx-log-in", 
        log1Info:authenticated ? "logout": "login",
         panier: panierCount });
    }
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Internal Server Error');
  }
});







// Route for about page
app.get('/apropos', async (req, res) => {
  // Render the about page
  try {
    // Check if user is authenticated
    
    // Fetch item details from the database based on the item ID
    const authenticated = await isAuthenticated(req.cookies);

    if (authenticated) {
  res.render('apropos',{logInfo:"bx bx-log-in",log1Info:"logout"});
  
} else{
    
  
  res.render('apropos',{logInfo:"bx bx-user-circle",log1Info:"login"});

    }
  } catch (error) {
    console.error('Error fetching data:', error);


  }
});















// Route for terms and conditions page
app.get('/terms',  async (req, res) => {
  // Render the terms and conditions page
 
  // Render the about page
  try {
    // Check if user is authenticated
    
    // Fetch item details from the database based on the item ID
    const authenticated = await isAuthenticated(req.cookies);

    if (authenticated) {
    res.render('termetcondition',{logInfo:"bx bx-log-in",log1Info:"logout"});
  
    } else{

    res.render('termetcondition',{logInfo:"bx bx-user-circle",log1Info:"login"});
    }
  } catch (error) {

    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error ');


  }
});



// Route for terms and conditions page
app.get('/privacy',  async (req, res) => {
  // Render the terms and conditions page
 
  // Render the about page
  try {
    // Check if user is authenticated
    
    // Fetch item details from the database based on the item ID
    const authenticated = await isAuthenticated(req.cookies);

    if (authenticated) {
    res.render('privacyPolicy',{logInfo:"bx bx-log-in",log1Info:"logout"});
  
    } else{

    res.render('privacyPolicy',{logInfo:"bx bx-user-circle",log1Info:"login"});
    }
  } catch (error) {

    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error ');


  }
});











// Route for cookie policy page
app.get('/cookies',  async (req, res) => {
  // Render the cookie policy page
 
  // Render the about page
  try {
    // Check if user is authenticated
    
    // Fetch item details from the database based on the item ID
    const authenticated = await isAuthenticated(req.cookies);

    if (authenticated) {
    res.render('cookiepolicy',{logInfo:"bx bx-log-in",log1Info:"logout"});
  
    } else{

    res.render('cookiepolicy',{logInfo:"bx bx-user-circle",log1Info:"login"});
    }
  } catch (error) {

    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error ');


  }
});










// ADMINITRATEUR  ============================================================
// ================= ADMINISTRATEUR =========================================





// ADD PRODUCT AJOUTER PRODUIT 

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'BDI/') // Default folder before item-specific folder creation
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() +file.originalname)
  }
});

const telecharger = multer({ storage: storage });
// Route for adding a product
app.post('/add-product', telecharger.array('productImages', 4), async (req, res) => {
  const {
    productName,
    productDescription,
    productPrice,
    productStock,
    productLink,
    productColor,
    productBrand,
    productType,
    productCondition,
    productSubType,
    productWarranty,
    productOrigin,
    productCapacity,
    productImageSrc,
    productImageId,
    productCreated,
    productModified
  } = req.body;

 console.log(req.body);

  try {
    const createdDate = new Date(productCreated);
    const modifiedDate = new Date(productModified);

    // Insert product data into the database
    const [result] = await pool.query(
      `INSERT INTO articles 
        (Nom, description, prix, stock, lien, couleur, marque, type, conditions, SousType, Garantie, Origine, Capacity, img_src, img_id, cree_le, modifie_le) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productName,
        productDescription,
        parseFloat(productPrice), // Ensure price is a float
        parseInt(productStock, 10), // Ensure stock is an integer
        productLink,
        productColor,
        productBrand,
        productType,
        productCondition,
        productSubType,
        productWarranty,
        productOrigin,
        productCapacity,
        productImageSrc,
        productImageId,
        createdDate,
        modifiedDate
      ]
    );

    const productId = result.insertId; // Get the inserted product's ID

      // Create a folder named after the product ID
      const productFolder = path.join(__dirname, 'BDI', String(productId));
      if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
      }
  
      // Move uploaded files to the product-specific folder and update the database with the file names
      const imageNames = {};
      req.files.forEach((file, index) => {

        const newFilePath = path.join(productFolder, file.filename);
        fs.renameSync(file.path, newFilePath);

        imageNames[`img${index + 1}`] = file.filename; // Store only the file name
      });

      console.log(imageNames.img1);


    // Update the database with image paths
    await pool.query(
      `UPDATE articles 
       SET img_id = ? ,img1 = ?, img2 = ?, img3 = ?, img4 = ? 
       WHERE id = ?`,
      [productId,imageNames.img1 || null, imageNames.img2 || null, imageNames.img3 || null, imageNames.img4 || null, productId]
    );

    console.log('Produit ajouté avec succès');
    res.redirect("/admin");
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Erreur interne du serveur');
  }
});


app.get("/admin" , (req,res)=>{

res.redirect("/admin/ajouteProduit")

})




app.get("/admin/ajouteProduit" ,async (req,res)=>{
 try {
  // Retrieve all users from the database
  const [produits, fields] = await pool.query('SELECT * FROM articles');
  
  // alphabetically 
  
  produits.sort((a, b) => a.nom.localeCompare(b.nom));
  // Render the EJS template and pass users data to it
  res.render('ajouteproduit', { products:produits });
  
} catch (error) {
  console.error('Error fetching articles:', error);
  res.status(500).send('Internal Server Error');
}
})





// Route to render the form for adding a new user
app.get('/admin/ajouteUtilisateur', async (req, res) => {

  try {
    // Retrieve all users from the database
    const [users, fields] = await pool.query('SELECT * FROM utilisateurs');

    // Render the EJS template and pass users data to it
    res.render('ajouteUtilisateur', { users });
    console.log(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');


  }
});





app.get("/admin/afficheurProduit" , (req,res)=>{


 res.render('afficheurProduit',{});


})




















// MODIFICTAION UTILISATEUR  =================================================================================================
// ============================================================================================================================


// Route to handle editing a user (GET request to render edit form)
app.get('/admin/editUtilisateur/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch the user from the database based on userId
    const [user, fields] = await pool.query('SELECT * FROM utilisateurs WHERE UserID = ?', [userId]);

    if (user.length > 0) {
      // Render the edit form with user data
      res.render('editUtilisateur', { user: user[0] });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle updating a user (POST request from edit form)
app.post('/admin/editUtilisateur/:id', async (req, res) => {
  const userId = req.params.id;
  const { NomUtilisateur, Email, Téléphone } = req.body;

  try {
    // Update the user in the database
    await pool.query('UPDATE utilisateurs SET NomUtilisateur = ?, Email = ?, Téléphone = ? WHERE UserID = ?', [NomUtilisateur, Email, Téléphone, userId]);

    res.redirect('/admin/ajouteUtilisateur');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to handle deleting a user
app.get('/admin/deleteUtilisateur/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete the user from the database based on userId
    await pool.query('DELETE FROM utilisateurs WHERE UserID = ?', [userId]);

    res.redirect('/admin/ajouteUtilisateur');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Internal Server Error');
  }
});







// ====================================================================================
// ====================================================================================





// MODIFICATION PRODUITS ==========================================================================================================
// ================================================================================================================================


// GET route to render edit form for a specific product
app.get('/admin/editProduit/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    // Fetch product details from the database based on productId
    const [products, fields] = await pool.query('SELECT * FROM articles WHERE id = ?', [productId]);

    // Check if product exists
    if (products.length === 0) {
      return res.status(404).send('Product not found');
    }

    // Render the edit form with product data
    res.render('editProduit', { produit: products[0] });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Internal Server Error');
  }
});


// POST route to handle product edit submission
app.post('/admin/editProduit/:productId', async (req, res) => {
  const productId = req.params.productId;
  const {
    nom, description, prix, stock, lien, couleur, marque,
    type, conditions, soustype, garantie, origine, capacity
  } = req.body;

  try {
    // Update the product in the database
    await pool.query(`
      UPDATE articles 
      SET nom = ?, description = ?, prix = ?, stock = ?, lien = ?, 
          couleur = ?, marque = ?, type = ?, conditions = ?, 
          soustype = ?, garantie = ?, origine = ?, capacity = ?
      WHERE id = ?
    `, [nom, description, prix, stock, lien, couleur, marque, type, conditions, soustype, garantie, origine, capacity, productId]);

    // Redirect to product list or wherever appropriate
    res.redirect('/admin/ajouteProduit');

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Internal Server Error');
  }
});


// POST route to handle product deletion
app.get('/admin/deleteProduit/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    // Delete the product from the database
    await pool.query('DELETE FROM articles WHERE id = ?', [productId]);

    // Redirect to product list or wherever appropriate
    res.redirect('/admin/ajouteProduit');

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Internal Server Error');
  }
});






// ================================================================================================================================






// DASHBOARD UTIISATEUR ===================================================================
// ======================================================================================

// Route to display the user dashboard
app.get('/moi', async (req, res) => {
  try {
      const authenticated = await isAuthenticated(req.cookies);

      if (!authenticated) {
          return res.redirect('/login');
      }

      const email = req.cookies.email;
      const [userRows] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ?', [email]);
      const [cartRows] = await pool.query('SELECT * FROM panier WHERE Email = ?', [email]);
      const [panierCountResult] = await pool.query('SELECT COUNT(*) as count FROM panier WHERE Email = ?', [req.cookies.email]);
      const panierCount = panierCountResult[0].count;
    

      const cartItems = await Promise.all(cartRows.map(async (cartItem) => {
          const [productRows] = await pool.query('SELECT * FROM articles WHERE id = ?', [cartItem.ProductID]);
          return {
              ...productRows[0],
              quantite: cartItem.Quantité
          };
      }));

      const logInfo = authenticated ? "bx bx-log-in" : "bx bx-user-circle";
      const log1Info = authenticated ? "logout" : "login";
      const log2Info = authenticated ? `+${panierCount}` : 0;

      res.render('dashboard', {
          user: userRows[0],
          cartItems: cartItems,
          logInfo: logInfo,
          log1Info: log1Info,
          panier: log2Info
      });
  } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to update user profile
app.post('/update-profile', async (req, res) => {
  const { name, email, phone } = req.body;
  const userEmail = req.cookies.email;

  try {
      const [result] = await pool.query(
          'UPDATE utilisateurs SET NomUtilisateur = ?, Email = ?, Téléphone = ? WHERE Email = ?',
          [name, email, phone, userEmail]
      );

      if (result.affectedRows === 1) {
          res.json({ success: true });
      } else {
          res.json({ success: false });
      }
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false });
  }
});

// Route to update cart quantity
app.post('/update-cart', async (req, res) => {
  const { id, quantity } = req.body;
  const email = req.cookies.email;

  try {
      const [result] = await pool.query(
          'UPDATE panier SET Quantité = ? WHERE ProductID = ? AND Email = ?',
          [quantity, id, email]
      );

      if (result.affectedRows === 1) {
          res.json({ success: true });
      } else {
          res.json({ success: false });
      }
  } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ success: false });
  }
});

// Route to remove item from cart
app.post('/remove-from-cart', async (req, res) => {
  const { id } = req.body;
  const email = req.cookies.email;

  try {
      const [result] = await pool.query(
          'DELETE FROM panier WHERE ProductID = ? AND Email = ?',
          [id, email]
      );

      if (result.affectedRows === 1) {
          res.json({ success: true
          })
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false });
    }
});

// Route to add item to cart
app.post('/add-to-cart', async (req, res) => {
  const { productId } = req.body;
  const email = req.cookies.email;

  if (!email) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  try {
      const [userRows] = await pool.query('SELECT * FROM utilisateurs WHERE Email = ?', [email]);
      if (userRows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      const userId = userRows[0].UserID;

      const [productRows] = await pool.query('SELECT * FROM articles WHERE id = ?', [productId]);
      if (productRows.length === 0) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const product = productRows[0];

      const [cartRows] = await pool.query(
          'SELECT * FROM panier WHERE UserID = ? AND ProductID = ?',
          [userId, productId]
      );

      if (cartRows.length > 0) {
          await pool.query(
              'UPDATE panier SET Quantité = Quantité + 1, Prix = ? WHERE UserID = ? AND ProductID = ?',
              [product.prix * (cartRows[0].Quantité + 1), userId, productId]
          );
      } else {
          await pool.query(
              'INSERT INTO panier (UserID, ProductID, Quantité, Prix, Email) VALUES (?, ?, ?, ?, ?)',
              [userId, productId, 1, product.prix, email]
          );
      }

      res.json({ success: true });
  } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({ success: false });
  }
});



// ============================================================================
// ============================================================================
// ============================================================================


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
