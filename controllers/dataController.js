const mongo = require("mongoose");
const schema = require("./schemas")


exports.tournaments = async (req, res) => {
    const tournamentCollection = db.model.tournaments || db.model('tournaments', schema.tournament)

    try {
        const tournaments = await tournamentCollection.find(req.query)
        res.json(tournaments)
    } catch (error) {
        console.log(error)
    }
}


exports.games = async(req, res) => {
    const games = db.model('Games',
        new mongo.Schema({team1: 'string', team2: 'string', score1: 'number', score2: 'number', 
            time: 'date', tournament_id: 'ObjectID',  _id:'ObjectID'}), 'games');

    games.find(req.query,function(err, data) {
        if(err){console.log(err);}
        else{res.json(data);};
    });
}


exports.specials = async (req, res) => {
    try {
        tournament_id = req.params.id
        const specialCollection = db.model.specials || db.model('specials', schema.specialPrediction)
        const specials = await specialCollection.find({tournament_id: tournament_id})

        res.status(201).json({
            code: 201,
            specials: specials,
        });


    } catch (error) {
        res.status(500).json({
            code: 500,
            errors: [{
                msg: "Something went wrong with the request"
            }]
        });
    }
}



exports.countries = async(req, res) => {
    let counts = db.model('Countries', 
        new mongo.Schema({ country_id: 'string', name: 'string',  _id:'ObjectId' }), 'countries'); 

    counts.find({}, function(err, data) { 
        if(err){console.log(err);}
        else{
            res.json(data);}; 
    });
}