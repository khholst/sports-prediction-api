const mongo = require("mongoose");


exports.newTournament = (async(req, res) => {
    const Tournaments = db.model('Tournaments', 
        new mongo.Schema({ name: 'string', start_date: 'string', end_date: 'string', img_url: 'string', num_games:'number', sport: 'string' }), 'tournaments'); 

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
        const predictionsSchema = new mongo.Schema({
            game_id: {
                type: mongo.Schema.ObjectId,
                ref: "Games"
            },
            score1: Number,
            score2: Number,
            points: Number
        }, { _id: false })
    
        const tournamentsSchema = new mongo.Schema({
            predictions: [predictionsSchema],
            tournament_id: {type: mongo.Schema.Types.ObjectId, ref: "Tournaments"}
        })
        
        let User = db.model('Users',
        new mongo.Schema({username: 'string', password: 'string', rooms: 'array', tournaments: [tournamentsSchema], is_admin: 'boolean',  _id:'ObjectId'}), 'users');


        const Games =   db.model('Games',
                        new mongo.Schema({team1: 'string', team2: 'string', score1: 'number', score2: 'number', 
                        time: 'date', tournament_id: 'ObjectID',  stage: 'string'}), 'games');



        req.body.tournament_id = req.params.id;

        const addedGame = await Games.create(req.body);


        const newPrediction = {
            game_id: addedGame._id,
            score1: -1,
            score2: -1,
            points: -999,
            winner: -1
        }

        //Add new game to user predictions
        const saveGameInPredictions = await User.updateMany(
            {  },
            {
                "$push": {
                    "tournaments.$[tournament].predictions": newPrediction, 
                },
            },
            { "arrayFilters": [
                { "tournament.tournament_id": mongo.Types.ObjectId(req.params.id) },
            ]}
        )


        res.status(201).json({
            code: 201,
            msg: "Game added",
        });

    } catch (error) {
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        });
    }
})