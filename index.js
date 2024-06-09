let topMovies = [
    {
        title: 'Superbad',
        director: 'Greg Mottola'
    },
    {
        title: 'Super Troopers',
        director: 'Jay Chandrasekhar'
    },
    {
        title: 'Anchorman',
        director: 'Adam McKay'
    },
    {
        title: 'Blow',
        director: 'Ted Demme'
    },
    {
        title: 'The Nice Guys',
        director: 'Shane Black'
    },
    {
        title: 'Bourne Identity',
        director: 'Doug Liman'
    },
    {
        title: 'Snatch',
        director: 'Guy Ritchie'
    },
    {
        title: 'Baby Driver',
        director: 'Edgar Wright'
    },
    {
        title: 'Rush',
        director: 'Ron Howard'
    },
    {
        title: 'The Departed',
        director: 'Martin Scorsese'
    }
];

const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path');

const app = express();

// uses Morgan middleware library to log all requests
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

// returns JSON list of movies
app.get('/movies', (reg, res) => {
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!')
});

// retrieves static files from the public folder
app.use(express.static('public'));

// error-handling middleware function that will log all application-level errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});