const mongo = require("mongoose");


module.exports = async (req, res, next) => {
    const userRooms = db.model('Users',
    new mongo.Schema({_id:'ObjectId', username: 'string', rooms:'array'}), 'users')

    try {
        const rooms = await userRooms.findOne({ username: res.locals.decodedToken.username }, { rooms: 1, _id: 0 });
        const roomID = req.params.id;
        const userIsInRoom = rooms.rooms.some(e => e.equals(mongo.Types.ObjectId(roomID)));

        if (!userIsInRoom) {
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