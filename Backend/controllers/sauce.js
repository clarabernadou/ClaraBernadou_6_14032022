const Sauce = require('../models/sauce');

exports.createSauce = (req, res) => {
  const sauceObjet = JSON.parse(req.body.sauce)
  delete sauceObjet._id
  const sauce = new Sauce({
      ...sauceObjet,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  })
  console.log(sauce)
  sauce.save()
      .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
      .catch(error => res.status(400).json({ error }))
}

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  const sauce = new Sauce({
    _id: req.params.id,
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    price: req.body.price,
    userId: req.body.userId
  });
  Sauce.updateOne({_id: req.params.id}, sauce).then(
    () => {
      res.status(201).json({
        message: 'Sauce updated successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }).then(
      (sauce) => {
        if (!sauce) {
          res.status(404).json({
            error: new Error('No such Sauce!')
          });
        }
        if (sauce.userId !== req.auth.userId) {
          res.status(400).json({
            error: new Error('Unauthorized request!')
          });
        }
        Sauce.deleteOne({ _id: req.params.id }).then(
          () => {
            res.status(200).json({
              message: 'Deleted!'
            });
          }
        ).catch(
          (error) => {
            res.status(400).json({
              error: error
            });
          }
        );
      }
    )
  };

exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

//LIKE OR DISLIKE
exports.likeOrNot = (req, res, next) => {
  if (req.body.like === 1) {
      Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ }, $push: { usersLiked: req.body.userId } })
          .then((sauce) => 
            res.status(200).json({ message: 'Add like' }))
          .catch(error => 
              res.status(400).json({ error }))
  } else if (req.body.like === -1) {
    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 }, $push: { usersDisliked: req.body.userId } })
          .then((sauce) => 
            res.status(200).json({ message: 'Add dislike' }))
          .catch(error => 
              res.status(400).json({ error }))
  } else {
Sauce.findOne({ _id: req.params.id })
  .then(sauce => {
    if (sauce.usersLiked.includes(req.body.userId)) {
    Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
      .then(
        (sauce) => { 
          res.status(200).json({ message: 'Like deleted' }) })
//IF ELSE
.catch(
  error => res.status(400).json({ error }))
} else if (sauce.usersDisliked.includes(req.body.userId)) {
  Sauce.updateOne(
    { _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
      .then(
        (sauce) => { 
          res.status(200).json({ message: 'Dislike deleted' }) })
//IF ELSE
.catch(
  error => 
    res.status(400).json({ error }))
        }
  })
//IF ELSE
.catch(
  error => 
    res.status(400).json({ error }))
  }
}
