const router = require("express").Router();
const randomController = require("../controllers/randomController");



//Route generating a random name with adjective and noun
router.get("/generate", randomController.generateTwoPartName);


module.exports = router;