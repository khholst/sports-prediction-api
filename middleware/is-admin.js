const jwt = require("jsonwebtoken");


module.exports = (req, res, next) => {
    try {
        if (!res.locals.decodedToken.admin) {
            res.status(403).json({
                code: 403,
                errors: [
                    {
                        msg: "Your are not authorized for this action"
                    }
                ]
            })
        } else {
            next();
        }
    } catch (error) {
        res.status(403).json({
            code: 403,
            errors: [
                {
                    msg: "Your are not authorized"
                }
            ]
        })
    }
}