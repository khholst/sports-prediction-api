const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const isAdmin = require("../middleware/is-admin");
const adminController = require("../controllers/adminController");


router.post("/tournaments/new", authenticate, isAdmin, adminController.newTournament);
router.post("/tournaments/:id/games/new", authenticate, isAdmin, adminController.newGame);



module.exports = router;