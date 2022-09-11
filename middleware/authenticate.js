const jwt = require("jsonwebtoken");


module.exports = (req, res, next) => {
    try {
        const token = req.get("token");
        const decoded = jwt.verify(token, process.env.JWTSECRET);
        res.locals.decodedToken = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                code: 401,
                errors: [
                    {
                        msg: "Your session has expired"
                    }
                ]
            })
        } else {
            console.log(error)
            res.status(401).json({
                code: 401,
                errors: [
                    {
                        msg: "You are not authenticated"
                    }
                ]
            })
        }
    }
}