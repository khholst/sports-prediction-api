const mongo = require("mongoose");

const gamesSchema = {team1: 'string', team2: 'string', score1: 'number', score2: 'number', time: 'date', tournament_id: 'ObjectID',  _id:'ObjectID'};
const tournamentSchema = {_id: 'ObjectId', start_date: 'string', end_date: 'string',  name: 'string', img_url: 'string', sport: 'string'};


exports.all = (async(req, res) => {

    let Games = db.model('Games',
    new mongo.Schema(gamesSchema), 'games');


    const dbTournaments = db.model('Tournaments', new mongo.Schema(tournamentSchema), 'tournaments');


    const predictionsSchema = new mongo.Schema({
        game_id: {
            type: mongo.Schema.ObjectId,
            ref: "Games"
        },
        score1: Number,
        score2: Number,
        points: Number
    })

    const tournamentsSchema = new mongo.Schema({
        predictions: [predictionsSchema],
        tournament_id: {type: mongo.Schema.Types.ObjectId, ref: "Tournaments"},
        scores: Array
    })

    const username = res.locals.decodedToken.username;

    let User = db.model('Users',
    new mongo.Schema({username: 'string', password: 'string', rooms: 'array', tournaments: [tournamentsSchema], is_admin: 'boolean',  _id:'ObjectId'}), 'users');


    try {
        const userPredictions = await User.findOne({username: username}, {username: 0, password: 0, is_admin: 0, _id: 0, rooms: 0, __v: 0})
                              .populate("tournaments.predictions.game_id", "-tournament_id")
                              .populate("tournaments.tournament_id", "-start_date -end_date -img_url -sport -_id");

        res.status(200).json({
            predictions: userPredictions.tournaments
        })
    } catch (error) {
        console.log(error)
    }
})


exports.new = (async (req, res) => {
    const prediction = req.body;
    prediction.game_id = mongo.Types.ObjectId(prediction.game_id);
    prediction.points = -1;


    try {
    let Games = db.model('Games',
    new mongo.Schema(gamesSchema), 'games');

    const dbTournaments = db.model('Tournaments', new mongo.Schema(tournamentSchema), 'tournaments');

    const predictionsSchema = new mongo.Schema({
        game_id: {
            type: mongo.Schema.ObjectId,
            ref: "Games"
        },
        score1: Number,
        score2: Number,
        points: Number,
        winner: Number,
        difference: Number
    })

    const tournamentsSchema = new mongo.Schema({
        predictions: [predictionsSchema],
        tournament_id: {type: mongo.Schema.Types.ObjectId, ref: "Tournaments"},
        scores: Array
    })

    const Users = db.model('Users',
    new mongo.Schema({username: 'string', password: 'string', rooms: 'array', tournaments: [tournamentsSchema], is_admin: 'boolean',  _id:'ObjectId'}), 'users');

    const game = await Games.findOne({_id: prediction.game_id});


    const username = res.locals.decodedToken.username;

    //Check if user has already made this prediction
    const predictionExists = await Users.countDocuments(
    { username: username, "tournaments.predictions": {$elemMatch: {score1: -1, score2: -1, game_id: game._id}}})
    
    if (predictionExists === 0) {
        return res.status(403).json({
            "code": 403,
            "errors": [
                {"msg": "Prediction already exists"}
            ]
        })
    }

    let winner = 0;
    if (req.body.score1 > req.body.score2) { winner = 1 }
    else if (req.body.score2 > req.body.score1) { winner = 2 }

    let difference = Math.abs(req.body.score2 - req.body.score1);

    
    

    //Add prediction to user document
    const savePrediction = await Users.updateOne(
    { "username": username },
    {
        "$set": {
            "tournaments.$[tournament].predictions.$[prediction].score1": req.body.score1, 
            "tournaments.$[tournament].predictions.$[prediction].score2": req.body.score2,
            "tournaments.$[tournament].predictions.$[prediction].winner": winner,
            "tournaments.$[tournament].predictions.$[prediction].difference": difference,
        },
    },
    { "arrayFilters": [
        { "tournament.tournament_id": mongo.Types.ObjectId(game.tournament_id) },
        { "prediction.game_id": mongo.Types.ObjectId(game._id) }
    ]}
    )

    res.status(200).json({
        msg: "Prediction saved"
    })

    } catch (error) {
        console.log(error)
        res.status(400).json({})
    }

})