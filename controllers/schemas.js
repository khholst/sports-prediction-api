const mongo = require("mongoose");

const gameSchema = new mongo.Schema({
    team1           : 'string',
    team2           : 'string',
    score1          : 'number',
    score2          : 'number', 
    time            : 'date',
    tournament_id   : 'ObjectID',
    stage           : 'string'
});
exports.game = gameSchema;

const predictionSchema = {
    game_id : { type: 'ObjectID', ref: 'Games' },
    score1  : 'number',
    score2  : 'number',
    points  : 'number'
};


const specialPredictionSchema = new mongo.Schema({
    tournament_id   : 'ObjectID',
    prediction      : 'string',
    description     : 'string',
    points          : 'number',
    type            : 'string',
    active_until    : 'string',
    result          : 'string'
});
exports.specialPrediction = specialPredictionSchema;


const specialPredictionUnderTournamentSchema = {
    prediction_id   : {type: 'ObjectID', ref: 'specials'},
    user_prediction : 'string',
    user_points     : 'number',
    
}


const tournamentUnderUserSchema = {
    tournament_id   : {type: "ObjectID", ref: "tournaments"},
    predictions     : [predictionSchema],
    special_predictions: [specialPredictionUnderTournamentSchema]
}


const userSchema = new mongo.Schema({
    username    : 'string',
    password    : 'string',
    rooms       : 'array',
    tournaments : [tournamentUnderUserSchema],
    is_admin    : 'boolean',
    _id         :'ObjectId'
});
exports.user = userSchema;