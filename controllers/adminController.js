const mongo = require("mongoose");
const schema = require("./schemas")




exports.newTournament = (async(req, res) => {
    const Tournaments = db.model('Tournaments', 
        new mongo.Schema({ name: 'string', start_date: 'string', end_date: 'string', img_url: 'string', num_games:'number', host:'array', sport: 'string' }), 'tournaments'); 

    try {
        const newTournament = await Tournaments.create(req.body);

        res.status(201).json({
            code: 201,
            msg: "Tournament created",
        });

    } catch (error) {
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        })
    }
})


exports.newGame = (async(req, res) => {
    try {
        const userCollection = db.models.users || db.model('users', schema.user);
        const gameCollection = db.models.games || db.model('games', schema.game);

        req.body.tournament_id = req.params.id;
        const addedGame = await gameCollection.create(req.body);

        const newPrediction = getNewPrediction(addedGame._id)
        await addPredictionForUsers(userCollection, newPrediction, req.params.id)

        res.status(201).json({
            code: 201,
            msg: "Game added",
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        });
    }
})

async function addPredictionForUsers(userCollection, prediction, tournament_id, special=false) {
    let subdocument = "predictions";
    if (special) { subdocument = "special_predictions" }
    push_location = `tournaments.$[tournament].${subdocument}`

    await userCollection.updateMany({},
        {
            "$push": {
                [push_location]: prediction, 
            },
        },
        { "arrayFilters": [
            { "tournament.tournament_id": mongo.Types.ObjectId(tournament_id) },
        ]}
    )
}

function getNewPrediction(game_id) {
    return {
        game_id: game_id,
        score1: -1,
        score2: -1,
        points: -999,
        winner: -1
    }
}

exports.newSpecial = (async(req, res) => {
    
    try {
        tournamentId = req.params.id;
        const specialCollection = db.model.specials || db.model('specials', schema.specialPrediction);
        const userCollection = db.models.users || db.model('users', schema.user);

        req.body.tournament_id = tournamentId;
        const newSpecial = await specialCollection.create(req.body);
        const newSpecialPrediction = getNewSpecialPrediction(newSpecial._id);

        addPredictionForUsers(userCollection, newSpecialPrediction, tournamentId, true);

        res.status(201).json({
            code: 201,
            msg: "Special prediction added",
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        });
    }
})


function getNewSpecialPrediction(prediction_id) {
    return {
        prediction_id   : prediction_id,
        user_prediction  : "TBD",
        user_points      : -999
    }
}


exports.editSpecial = async (req, res) => {


    try {
        const result        = req.body.result;
    const tournamentId  = mongo.Types.ObjectId(req.params.tournament_id);
    const specialId     = mongo.Types.ObjectId(req.params.special_id);

    const specialCollection = db.model.specials || db.model('specials', schema.specialPrediction);
    const userCollection = db.models.users || db.model('users', schema.user);

    const specialPrediction = await specialCollection.findOneAndUpdate(
        { _id: specialId },
        {
            "$set": {
                "result": result, 
            }
        }
    );

    const points = specialPrediction.points;

    const savePredictionPoints = await userCollection.bulkWrite([
        //Update all accurate predictions
        { "updateMany": {
            "filter":{},
            "update": {
                "$set": {"tournaments.$[tournament].special_predictions.$[prediction].user_points": points },
            },
            "arrayFilters": [
                {   "tournament.tournament_id": tournamentId },
                {   "prediction.prediction_id": specialId,
                    "prediction.user_prediction": result,                   
                }                   
            ]
        }},

        //Update all wrong predictions
        { "updateMany": {
            "filter":{},
            "update": {
                "$set": {"tournaments.$[tournament].special_predictions.$[prediction].user_points": 0 },
            },
            "arrayFilters": [
                {   "tournament.tournament_id": tournamentId },
                {   "prediction.prediction_id": specialId,
                    "prediction.user_prediction": {"$ne": result},
                }
            ]
        }},
    ])

    res.status(201).json({
        code: 201,
        msg: "Result added",
    });


    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        })
    }




    








}

