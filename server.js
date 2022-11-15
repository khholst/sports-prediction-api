const express = require('express')
const cors = require("cors");
const dotenv = require("dotenv");
const mongo = require("mongoose");

const auth = require("./routes/auth");
const data = require("./routes/data");
const room = require("./routes/room");
const admin = require("./routes/admin");
const predictions = require("./routes/predictions");
const results = require("./routes/results");


const app = express();
dotenv.config();

const db_uri = process.env.MONGOCONNECTION;
global.db = (global.db ? global.db : mongo.createConnection(db_uri));

const corsOptions = {
  methods: 'GET, POST',
  origin: ['https://khholst.github.io', 'http://localhost:4200'],
  //origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}


app.use(express.json());
app.use(cors(corsOptions));
app.use("/api/auth", auth);
app.use("/api/data", data);
app.use("/api/rooms", room);
app.use("/api/predictions", predictions);
app.use("/api/admin", admin);
app.use("/api/results", results);



app.listen(process.env.PORT || 8080);
