var Job = require('./db/models/job');
var Client = require('./db/models/client');
var jwt = require('jwt-simple');
var Q = require('q');
var User = require('./db/models/user');
var request = require('./request-handler');

// exports.isLoggedIn = function(req, res) {
//   return req.headers['x-access-token'] ? !!
//   return req.session ? !!req.session.user : false;
// };

exports.checkUser = function(req, res, next) {
  var token = req.headers['x-access-token']
  if (!token) {
    next(new Error("no token"))
  } else {
    var user = jwt.decode(token, 'nyan cat');
    var findUser = Q.nbind(User.findOne, User);
    findUser({username: user.username})
      .then(function(foundUser){
        if (foundUser) {
          next();
        } else {
          res.send(401)
        }
      })
      .fail(function(err){
        next(err);
      })
  }

  // if (!exports.isLoggedIn(req)) {
  //   res.render('splash');
  // } else {
  //   next();
  // }
};

// exports.createSession = function(req, res, newUser) {
//   return req.session.regenerate(function() {
//       req.session.user = newUser;
//       res.redirect('/');
//     });
// };

/*
Post requests from the front-end can either be a requests to create a new job or to update a new job.
This function searches to see if the job that comes in from the request and either creates a new Job
record if it didn't already exist in the DB or updates the 'status' property of the job if the record already exists. 
*/
exports.createOrUpdateJob = function(req, res, job) {

  if (job === null) {
    //create
    exports.createJobDoc(req, res);
  } else {
    //update
    exports.updateJobDoc(req, res);
  }

};

/*
Finds the client id that corresponds to the client name from the POST request body.  
Uses found client id to create a new Job record in the database. 
*/
exports.createJobDoc = function(req, res) {
  Client.find({name:req.body.client}).exec(function (err, client){

    if(err) return res.send(500, err);

    var newJob = new Job({
      user: request.decodeToken(req.headers['x-access-token']),
      client: client[0]._id,
      rate: req.body.rate,
      start: req.body.start,
      end: req.body.end,
      status: req.body.status,
      description: req.body.description
    });

    newJob.save(function (err, job) {
      if (err) return res.send(500, err);
      // job.client = {name: req.body.client};
      res.json(job);
    });

  });
};

/*
Finds the Job record that matches the id in the request body and updates the status of the job. 
*/
exports.updateJobDoc = function (req, res) {
  Job.findOneAndUpdate({_id: req.body._id}, {status: req.body.status}, function (err, job) {
    if (err) return res.send(500, err);
    res.redirect('/');
  });
}
