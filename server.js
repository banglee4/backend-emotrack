const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.listen(port, "0.0.0.0", () => {
  console.log("Server berjalan di http://localhost:3000");
});
