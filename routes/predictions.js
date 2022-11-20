const authenticate = require("../middleware/authenticate");
const predictionController = require("../controllers/predictionController");
const router = require("express").Router();

router.get("/", authenticate, predictionController.all);
router.post("/new", authenticate, predictionController.new);
router.post("/new-special", authenticate, predictionController.newSpecial);
router.post("/friends-predictions", authenticate, predictionController.friendsPredictions);





module.exports = router;