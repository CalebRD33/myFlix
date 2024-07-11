const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

const { check, validationResult } = require('express-validator');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
    
const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// uses Morgan middleware library to log all requests
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!')
});

// READ - returns JSON list of all movies
app.get('/movies', async (req, res) => {
    await Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// READ - returns JSON object of individual movie
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// READ - returns JSON object of individual genre and description
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((genre) => {
        res.json(genre.Genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// READ - returns a JSON object of individual director data(name, bio, birth year, death year)
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ 'Director.Name': req.params.directorName})
    .then((data) => {
        res.json(data.Director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// CREATE - add new user
app.post('/users', 
[
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    };  

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + ' already exists');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) =>{res.status(201).json(user) })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            })
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// UPDATE - change user information by username
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), 
[
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    };

    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }
    await Users.findOneAndUpdate({ Username: req.params.Username },
    {$set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true })
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// CREATE - add new movie to FavoriteMovies by Username ane MovieID
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }  
    await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {$push: { FavoriteMovies: req.params.MovieID }},
        { new: true }
    )
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Delete - delete movie from FavoriteMovies by Username ane MovieID
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    }  
    await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {$pull: { FavoriteMovies: req.params.MovieID }},
        { new: true }
    )
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE - delete user from database
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission denied');
    } 
    await Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
        if(!user) {
            res.status(400).send(req.params.Username + ' was not found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// retrieves static files from the public folder
app.use(express.static('public'));

// error-handling middleware function that will log all application-level errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});