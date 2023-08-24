const router = require("express").Router();
const dataController = require("../controllers/dataController")

router.get("/tournaments", dataController.tournaments);
router.get("/tournaments/:id/specials", dataController.specials);
router.get("/countries", dataController.countries);
router.get("/games", dataController.games);


module.exports = router;