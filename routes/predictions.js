const authenticate = require("../middleware/authenticate");
const predictionController = require("../controllers/predictionController");
const router = require("express").Router();

router.get("/", authenticate, predictionController.all);
router.post("/new", authenticate, predictionController.new);





module.exports = router;