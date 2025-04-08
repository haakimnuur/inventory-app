const express = require('express');
const app = express();
const path = require("node:path");
const indexRouter = require("./routes/indexRouter");
const productsRouter = require('./routes/productsRouter');
const categoriesRouter = require('./routes/categoriesRouter');
require("dotenv").config();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Use public dir
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// Use views directory and EJS template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});