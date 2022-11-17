const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const mongo = require("mongoose");


const userSchema = {username: 'string', password: 'string', rooms: 'array', tournaments: 'array', is_admin: 'boolean',  _id:'ObjectId'};
const gamesSchema = {team1: 'string', team2: 'string', score1: 'number', score2: 'number', time: 'date', tournament_id: 'ObjectID',  _id:'ObjectID'};
const specialPredictionsSchema = {prediction: 'string', result: 'string', end_date: 'date', tournament_id: 'ObjectID',  _id:'ObjectID', user_prediction: 'string'};
const tournamentSchema = {_id: 'ObjectId', start_date: 'string', end_date: 'string',  name: 'string', img_url: 'string', sport: 'string'};
const roomSchema = { _id: 'ObjectId', name: 'string', tournament_id: 'objectId', creator: 'string', join_key: 'string'};

//Add new room to database
exports.new = (async (req, res) => {
    try {
        const { name, tournament } = req.body;

        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(200).json({
                "code": 400,
                "errors": errors.array()
            });
        }

        const joinKey = uuidv4(); //Generate random join key for the room

        //Decode payload from the JWT token
        const jwtPayload = req.get("token").split(".")[1];
        const username = JSON.parse(Buffer.from(jwtPayload, "base64").toString("utf-8")).username;

        //Schema for rooms collection
        const Rooms = db.model('Rooms', 
        new mongo.Schema({ name: 'string', tournament_id: 'objectId', creator: 'string', join_key: 'string'}), 
        'rooms');

        //Construct room object to be added to the database
        const newRoom = {
            tournament_id: tournament,
            name: name,
            creator: username,
            join_key: joinKey
        }

    const createdRoom = await Rooms.create(newRoom);
    //Schema for users collection
    const Users = db.model('Users', new mongo.Schema(userSchema), 'users');


    //Check if user already is in this tournament
    const creatingUser = await Users.findOne({username: username}, {tournaments: 1});

    const userInTournament = checkUserIsInTournament(creatingUser, tournament);

    if (userInTournament) {
        const user = await Users.findOneAndUpdate({ username: username },
            { $push: { rooms: createdRoom._id }});

        return res.status(201).json({
            code: 201,
            join_key: joinKey,
            room_id: createdRoom._id
        })
    }





        const games = db.model('Games', new mongo.Schema(gamesSchema), 'games');
        const specials = db.model('Specials', new mongo.Schema(specialPredictionsSchema), 'specials')


        let possiblePredictions = await games.find({tournament_id: mongo.Types.ObjectId(tournament)})
                                                .select({"_id": 1, "time": 1});
        const specialPredictions = await specials.find({tournament_id: mongo.Types.ObjectId(tournament)})
        specialPredictions.forEach((e) => {
            e.user_prediction = "None"
        })


        possiblePredictions.forEach((e) => {
            e.score1 = -1,
            e.score2 = -1,
            e.points = (new Date(e.time).getTime() > new Date().getTime()) ? -999:-1 //-999: game not started; -1: game not predicted
        })

        possiblePredictions = possiblePredictions.map((e) => { return {'game_id': e._id, 'score1': e.score1, 'score2': e.score2, 'points': e.points} })
        

        const tournaments = {
            tournament_id: mongo.Types.ObjectId(tournament),
            predictions: possiblePredictions,
            special_predictions: specialPredictions
        }

        const user = await Users.findOneAndUpdate({ username: username },
            { $push: { rooms: createdRoom._id, tournaments: tournaments }});


        return res.status(201).json({
            code: 201,
            join_key: joinKey,
            room_id: createdRoom._id
        })
    } catch(error) {
        console.log(error)
        return res.status(404).json({
            code: 404,
            errors: [
                {
                    msg: "Something went wrong, the room could not be created"
                }
            ]
        });
    }
})


exports.findByKey = (async (req, res) => {
    //Room schema
    const Rooms = db.model('Rooms', new mongo.Schema(roomSchema), 'rooms');

    //Find room
    const room = await Rooms.findOne({join_key: req.params.key});

    //Users schema
    const Users = db.model('Users', new mongo.Schema(userSchema), 'users');

    //Torunaments schema
    const Tournaments = db.model('Tournaments', new mongo.Schema(tournamentSchema), 'tournaments');

    let members = 0;
    if (room) {
        members = await Users.countDocuments({"rooms": { $in: [room._id]}});
        
        const tournament = await Tournaments.findOne({_id: room.tournament_id})

        res.status(200).json({
            code: 200,
            name: room.name,
            tournament: tournament.name,
            sport: tournament.sport,
            creator: room.creator,
            members: members,
            _id: room._id
        });
    } else {
        res.status(404).json({
            code: 404,
            errors: [
                {
                    msg: "Room not found"
                }
            ]
        });
    }
})


exports.join = (async (req, res) => {
    const roomID = mongo.Types.ObjectId(req.params.id);


    const Users = db.model('Users', new mongo.Schema(userSchema), 'users');
    const Rooms = db.model('Rooms', new mongo.Schema(roomSchema), 'rooms');
    
    const jwtPayload = req.get("token").split(".")[1];
    const username = JSON.parse(Buffer.from(jwtPayload, "base64").toString("utf-8")).username;


    const user = await Users.findOne({username: username});
    const userInRoom = user.rooms.some(room => room.equals(roomID));

    if (userInRoom) {
        res.status(403).json({
            code: 403,
            errors: [{
                msg: "You have already joined this room"
            }]
        })

    } else {
        const room = await Rooms.findOne({_id: roomID}, {tournament_id: 1, _id: 0});
        const userInTournament = checkUserIsInTournament(user, room.tournament_id);


        if (!userInTournament) {
            const games = db.model('Games', new mongo.Schema(gamesSchema), 'games');
            const specials = db.model('Specials', new mongo.Schema(specialPredictionsSchema), 'specials')

            //THIS TO COMMON FUNCTION
            let possiblePredictions = await games.find({tournament_id: room.tournament_id})
                                                    .select({"_id": 1, "time": 1});

            let specialPredictions = await specials.find({tournament_id: mongo.Types.ObjectId(room.tournament_id)})
            specialPredictions.forEach((e) => {
                e.user_prediction = "None"
            })

            possiblePredictions.forEach((e) => {
                e.score1 = -1,
                e.score2 = -1,
                e.points = (new Date(e.time).getTime() > new Date().getTime()) ? -999 : -1 //-999: game not started; -1: game started but not predicted
                e.winner = -1
            })

            possiblePredictions = possiblePredictions.map((e) => { 
                return {'game_id': e._id, 'score1': e.score1, 'score2': e.score2, 'points': e.points, 'winner': e.winner} 
            });

            const tournaments = {
                tournament_id: mongo.Types.ObjectId(room.tournament_id),
                predictions: possiblePredictions,
                special_predictions: specialPredictions
            }
    
            const userUpdate = await user.updateOne({$push: {rooms: roomID, tournaments: tournaments}})
        } else {
            const userUpdate = await user.updateOne({$push: {rooms: roomID}})
        }
        res.status(201).json({
            code: 201,
            message: "Room joined successfully",
            room_id: roomID
        })
    }
})


exports.all = (async (req, res) => {
    const username = req.params.username;

    let userRooms = db.model('Users',
    new mongo.Schema(userSchema), 'users');
    const userRoomIds = await userRooms.findOne({username: username}, {rooms:1, _id: 0});
    let roomIds = [];

    for (let room of userRoomIds.rooms){
      roomIds.push(room);
    };

    const rooms = db.model('Rooms', new mongo.Schema(roomSchema), 'rooms');
    const roomData = await rooms.find({"_id" : { "$in": roomIds }});

    res.status(200).json(roomData);
})



exports.room = (async (req, res) => {
    const room_id = mongo.Types.ObjectId(req.params.id);
    const rooms = db.model('Rooms',
        new mongo.Schema({ tournament_id: 'string', _id: 'ObjectId', name: 'string', creator: 'string', join_key: 'string' }), 'rooms');

    const roomData = await rooms.find({"_id": room_id});
    res.status(200).json(roomData);
})



exports.roomUsers = (async (req, res) => {
    const predSchema = new mongo.Schema({game_id:'ObjectID', score1:'number', score2:'number', points:'number'})
    const subschema = new mongo.Schema({tournament_id:'ObjectID', predictions:[predSchema]});
    let userRooms = db.model('Users',
        new mongo.Schema({_id:'ObjectId', username: 'string', rooms: ['ObjectId'], tournaments: [subschema]}), 'users');
    

    userRooms.find({"rooms": { "$elemMatch": { "$in": req.query.room.split(",")} }},function(err, data) {
        if(err){console.log(err);}
        else{
            for(let i=0;i<data.length;i++){
                data[i].rooms = data[i].rooms.filter(function(room){return req.query.room.split(",").includes(room.toString())});
            };
            data = data.map((user) => {
                return {
                  '_id':user._id,
                  'username':user.username,
                  'rooms':user.rooms,
                  'tournaments':user.tournaments
                };
              });
            
            res.json(data);
        };
    });
})


function checkUserIsInTournament(user, tournament_id) {
    let userIsInTournament = false;

    user.tournaments.forEach(element => {
        if(element.tournament_id.equals(mongo.Types.ObjectId(tournament_id))) {
            userIsInTournament = true;
        }
    });
    
    return userIsInTournament;
}