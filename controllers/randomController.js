const randomNames = require("../data/random")


exports.generateTwoPartName = (req, res) => {
    try {
        const randomAdjectiveIndex = Math.round(Math.random() * 117); //117 items in lists
        const randomNounIndex = Math.round(Math.random() * 117);
        const randomName = `${randomNames.adjectives[randomAdjectiveIndex]} ${randomNames.animalsPlural[randomNounIndex]}`

        return res.status(201).json({
            code: 201,
            roomName: randomName,
        })
    } catch (error) {
        return res.status(404).json({
            code: 404,
            errors: [
                {
                    msg: "Something went wrong, room name could not be generated"
                }
            ]
        });
    }
}