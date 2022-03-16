const Sauce = require('../models/sauce');

//CREATE SAUCE FUNCTIONALITY
exports.createSauce = (req, res) => {
  const sauceObjet = JSON.parse(req.body.sauce)
  delete sauceObjet._id //delete sauce object id
  const sauce = new Sauce({ //create a new sauce
      ...sauceObjet,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //for images
  })
  console.log(sauce)

  sauce.save()
      .then(() => res.status(201).json({ message: 'Object saved' })) //if object saved
      .catch(error => res.status(400).json({ error })) //else return 400 error
}

//GET ONE SAUCE FUNCTIONALITY
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ //To find the sauce
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce); //if send the sauce back
    }
  ).catch(
    (error) => {
      res.status(404).json({ 
        error: error //else return 404 error
      });
    }
  );
};

//MODIFY SAUCE FUNCTIONALITY
exports.modifySauce = (req, res, next) => {
  const sauce = new Sauce({ //create the sauce
    _id: req.params.id,
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    price: req.body.price,
    userId: req.body.userId
  });
  //UPDATE THE SAUCE
  Sauce.updateOne({_id: req.params.id}, sauce).then(
    () => {
      res.status(201).json({
        message: 'Sauce updated successfully!' //if the sauce is updated
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error //else return 400 error
      });
    }
  );
};

//DELETED SAUCE FUNCTIONALITY
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }).then( //find a sauce
      (sauce) => {
        if (!sauce) {
          res.status(404).json({ 
            error: new Error('No such Sauce!') //if return no such sauce error
          });
        }
        if (sauce.userId !== req.auth.userId) {
          res.status(400).json({
            error: new Error('Unauthorized request!') //if return unauthorized request error
          });
        }
        Sauce.deleteOne({ _id: req.params.id }).then(
          () => {
            res.status(200).json({ 
              message: 'Deleted!' //if deleted
            });
          }
        ).catch(
          (error) => {
            res.status(400).json({
              error: error //else return 400 error
            });
          }
        );
      }
    )
  };

//GET ALL SAUCES FUNCTIONALITY
exports.getAllSauces = (req, res, next) => {
  Sauce.find().then( //find a sauce
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error //else return 400 error
      });
    }
  );
};

//LIKE OR DISLIKE FUNCTIONALITY
exports.likeOrNot = (req, res, next) => {
  if (req.body.like === 1) {
      Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ }, $push: { usersLiked: req.body.userId } })
          .then((sauce) => 
            res.status(200).json({ message: 'Add like' })) //if like is add
          .catch(error => 
              res.status(400).json({ error })) //else return 400 error
  } else if (req.body.like === -1) {
    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 }, $push: { usersDisliked: req.body.userId } })
          .then((sauce) => 
            res.status(200).json({ message: 'Add dislike' })) //if dislike is add
          .catch(error => 
              res.status(400).json({ error })) //else return 400 error
  } else {
Sauce.findOne({ _id: req.params.id })
  .then(sauce => {
    if (sauce.usersLiked.includes(req.body.userId)) {
    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
      .then(
        (sauce) => { 
          res.status(200).json({ message: 'Like deleted' }) }) //if like is deleted
.catch(
  error => res.status(400).json({ error })) //else return 400
} else if (sauce.usersDisliked.includes(req.body.userId)) {
  Sauce.updateOne(
    { _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
      .then(
        (sauce) => { 
          res.status(200).json({ message: 'Dislike deleted' }) }) //if dislike is deleted
//IF ELSE
.catch(
  error => 
    res.status(400).json({ error })) //else return 400 error
        }
  })
//IF ELSE
.catch(
  error => 
    res.status(400).json({ error })) //else return 400 error
  }
}
