const mongo = require("mongoose");





module.exports = async (req, res, next) => {
    const subschema = new mongo.Schema({room_id:'ObjectID', score:'array'});
    const userRooms = db.model('Users',
    new mongo.Schema({_id:'ObjectId', username: 'string', rooms:'array'}), 'users')

    try {
        const rooms = await userRooms.findOne({ username: res.locals.decodedToken.username }, { rooms: 1, _id: 0 });
        const inputRooms = req.query.room.split(",");
        let roomIDs = [];
        rooms.rooms.forEach(element => roomIDs.push(element.toString()));

        let valuesExist = true;
        for (const inputRoom of inputRooms) {
            if (!roomIDs.includes(inputRoom)) {
                valuesExist = false;
            }
        }

        if (!valuesExist) {
            res.status(404).json({
                code: 404,
                errors: [{
                    msg: "You have requested information about a room that you are not autorized to see"
                }]
            })
        } else {
            next();
        }



    } catch (error) {
        console.log(error);
    }
}