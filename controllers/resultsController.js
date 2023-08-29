const mongo = require("mongoose");
const schema = require("./schemas")



function createPointRangeArray(score, pointRange, offset) {
    const pointRangeArray = [];
    if (offset === 0) {
        for (let i = score - pointRange; i < score + pointRange + 1; i++) {
            pointRangeArray.push(i)
        }
    } else {
        for (let i = score - pointRange; i < score - offset; i++) {
            pointRangeArray.push(i);
        }
        for (let i = score + offset + 1; i < score + pointRange + 1; i++) {
            pointRangeArray.push(i)
        }
    }
    return pointRangeArray
}



exports.save = (async (req, res) => {



    try {
        const result = req.body;

        const tournamentCollection = db.model.tournaments || db.model('tournaments', schema.tournament)
        const gameCollection = db.model.games || db.model('games', schema.game)
        const userCollection = db.model.users || db.model('users', schema.user)

        // Find sport to know which point logic to use
        const tournament = await tournamentCollection.findOne({_id: result.tournament_id}, "sport -_id")
        const sport = tournament.sport

        // Update prediction in predictions collection with score
        const predictionWithResult = await gameCollection.updateOne(
            { _id: result._id },
            {
                "$set": {
                    "score1": result.score1, 
                    "score2": result.score2
                }
            }
        );


        // Update user predictions with score
        let winner = 0;
        if (result.score1 > result.score2) { winner = 1 }
        else if (result.score2 > result.score1) { winner = 2 }
        const difference = Math.abs(result.score1 - result.score2);


        if (sport === "basketball") {
            const withinFivePointsTeam1 = createPointRangeArray(result.score1, 5, 0);
            const withinFivePointsTeam2 = createPointRangeArray(result.score2, 5, 0)
            
            const withinTenPointsTeam1 = createPointRangeArray(result.score1, 10, 0);
            const withinTenPointsTeam2 = createPointRangeArray(result.score2, 10, 0);


            const savePredictionPoints = await userCollection.bulkWrite([
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

                        }                                               
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
                            "prediction.score1": {"$in": withinTenPointsTeam1},
                            "prediction.score2": {"$in": withinTenPointsTeam2},
                        }                                                           
                    ]
                }},
    
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
                            "prediction.score1": {"$in": withinFivePointsTeam1},
                            "prediction.score2": {"$in": withinFivePointsTeam2},
                        }                                                           
                    ]
                }},
            ])





        } else if (sport === "football" || sport == "volleyball") {
            const savePredictionPoints = await Users.bulkWrite([
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
                            "prediction.difference": difference
                        }                                                           
                    ]
                }},
    
                //Update all 3 point predictions
                { "updateMany": {
                    "filter":{},
                    "update": {
                        "$set": {"tournaments.$[tournament].predictions.$[prediction].points": 3 },
                    },
                    "arrayFilters": [
                        {   "tournament.tournament_id": mongo.Types.ObjectId(result.tournament_id) },
                        {   "prediction.game_id": mongo.Types.ObjectId(result._id),
                            "prediction.score1": result.score1,
                            "prediction.score2": result.score2
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
                            "prediction.difference": {"$ne": difference}
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
        }

    
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
    };
})