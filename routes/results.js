const authenticate = require("../middleware/authenticate");
const resultController = require("../controllers/resultsController");
const router = require("express").Router();

router.post("/save", authenticate, resultController.save);

module.exports = router;