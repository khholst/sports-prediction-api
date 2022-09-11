const mongo = require("mongoose");

const gamesSchema = {team1: 'string', team2: 'string', score1: 'number', score2: 'number', time: 'date', tournament_id: 'ObjectID',  _id:'ObjectID'};

exports.save = (async (req, res) => {
    const result = req.body;

    try {
        let Games = db.model('Games',
            new mongo.Schema(gamesSchema), 'games');

        const predictionsSchema = new mongo.Schema({
            game_id: {
                type: mongo.Schema.ObjectId,
                ref: "Games"
            },
            score1: Number,
            score2: Number,
            points: Number
        });

        const tournamentsSchema = new mongo.Schema({
            predictions: [predictionsSchema],
            tournament_id: {type: mongo.Schema.Types.ObjectId, ref: "Tournaments"}
        });
    
        let Users = db.model('Users',
            new mongo.Schema({username: 'string', password: 'string', rooms: 'array', tournaments: [tournamentsSchema], is_admin: 'boolean',  _id:'ObjectId'}), 'users');
        
        const saveResults = await Games.updateOne(
            { _id: result._id },
            {
                "$set": {
                    "score1": result.score1, 
                    "score2": result.score2
                }
            }
        );



        //Find winning team for later comparison
        let winner = 0;
        if (result.score1 > result.score2) { winner = 1 }
        else if (result.score2 > result.score1) { winner = 2 }

        const difference = Math.abs(result.score1 - result.score2);
        let onePointDiff = [difference];

        for (let i = 1; i <= 10; i++) {
            onePointDiff.push(difference + i);
            onePointDiff.push(difference - i);
        }

        

        const savePredictionPoints = await Users.bulkWrite([
            //Update all 3 point predictions
            { "updateMany": {
                "filter":{},
                "update": {
                    "$set": {"tournaments.$[tournament].predictions.$[prediction].points": 3 },
                },
                "arrayFilters": [
                    {   "tournament.tournament_id": mongo.Types.ObjectId(result.tournament_id) },
                    {   "prediction.game_id": mongo.Types.ObjectId(result._id),
                        "prediction.winner": winner,
                        "prediction.difference": {"$lte": difference + 5, "$gte": difference - 5} }                                                           
                ]
            }},

            //Update all 2 point predictions
            { "updateMany": {
                "filter":{},
                "update": {
                    "$set": {"tournaments.$[tournament].predictions.$[prediction].points": 2 },
                },
                "arrayFilters": [
                    {   "tournament.tournament_id": mongo.Types.ObjectId(result.tournament_id) },
                    {   "prediction.game_id": mongo.Types.ObjectId(result._id),
                        "prediction.winner": winner,
                        "prediction.difference": {"$in": [difference + 6, difference + 7, difference + 8, difference + 9, difference + 10,
                                                        difference - 6, difference - 7, difference - 8, difference - 9, difference - 10]}
                    }                                                           
                ]
            }},
            //Update all 1 point predictions
            { "updateMany": {
                "filter":{},
                "update": {
                    "$set": {"tournaments.$[tournament].predictions.$[prediction].points": 1 },
                },
                "arrayFilters": [
                    {   "tournament.tournament_id": mongo.Types.ObjectId(result.tournament_id) },
                    {   "prediction.game_id": mongo.Types.ObjectId(result._id),
                        "prediction.winner": winner,
                        "prediction.difference": {"$nin": onePointDiff}
                    }                                                           
                ]
            }},
            //Update all 0 point predictions
            { "updateMany": {
                "filter":{},
                "update": {
                    "$set": {"tournaments.$[tournament].predictions.$[prediction].points": 0 },
                },
                "arrayFilters": [
                    {   "tournament.tournament_id": mongo.Types.ObjectId(result.tournament_id) },
                    {   "prediction.game_id": mongo.Types.ObjectId(result._id),
                        "prediction.winner": {"$ne": winner},
                    }                                                           
                ]
            }},
        ])

        res.status(201).json({
            code: 201,
            msg: "Result added",
        });

    } catch (error) {
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        })
    };
})