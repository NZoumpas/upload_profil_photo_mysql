const express = require("express");
const exphbs = require("express-handlebars");
const fileUpload = require("express-fileupload");
const mysql = require("mysql");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//default option
app.use(fileUpload());

//create static file
app.use(express.static("public"));
app.use(express.static("upload"));

//Templating engine
app.engine("hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", "hbs");

//Connection pool - mysql
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Check if you can connect to MySQL
pool.getConnection((err, connection) => {
  if (err) throw err; // not connected
  console.log("Connected as ID " + connection.threadId);
});

// Our GET router for the homepage and a simple SELECT MySQL Query
// We also render the page by doing res.render
app.get("", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    console.log("Connected!");

    connection.query('SELECT * FROM user WHERE id = "1"', (err, rows) => {
      // Once done, release connection
      connection.release();

      if (!err) {
        res.render("index", { rows });
      }
    });
  });
});

app.post("", (req, res) => {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  // name of the input is samplefile
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + "/upload/" + sampleFile.name;
  console.log(sampleFile);

  //Use mv() to place file on the server
  sampleFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);

    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      console.log("Connected!");

      connection.query(
        'UPDATE user SET profile_image = ? WHERE id = "1"',
        [sampleFile.name],
        (err, rows) => {
          // Once done, release connection
          connection.release();

          if (!err) {
            res.redirect("/");
          } else {
            console.log(err);
          }
        }
      );
    });

    // res.send("File uploaded!");
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
