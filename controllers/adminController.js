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
        const Games =   db.model('Games',
                        new mongo.Schema({team1: 'string', team2: 'string', score1: 'number', score2: 'number', 
                        time: 'date', tournament_id: 'ObjectID',  stage: 'string'}), 'games');

        req.body.tournament_id = req.params.id;

        const addedGame = await Games.create(req.body)

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