const jwt = require('jsonwebtoken'); //import jsonwebtoken

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); //decoded the token
    const userId = decodedToken.userId;
    req.auth = { userId };
    if (req.body.userId && req.body.userId !== userId) {
      throw 'Invalid user ID'; //if the user is invalid
    } else {
      next(); //else switch to next middleware
    }
  } catch {
    res.status(401).json({
      error: new Error('Invalid request!') //else the request is invalid
    });
  }
};