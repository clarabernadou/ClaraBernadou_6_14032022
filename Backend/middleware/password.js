module.exports = (req, res, next) => {
let userPassLength = req.body.password.length
	if (userPassLength > 8 && userPassLength < 100){
		next();
	}else{
		res.status(400).json({ 
			message: 'Mot de passe requis : 8 caractères minimum et 100 caractères maximum.'
		});
	}
}