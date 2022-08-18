const express = require("express");
const compression = require("compression");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const appRoutes = require("./routes/app-routes");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(appRoutes);

app.use(function (req, res, next) {
  res.render("index");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = app;
