let movies = [
    {
        Title: 'Superbad',
        Director: {
            Name: 'Greg Mottola'
        }    
    },
    {
        Title: 'Super Troopers',
        Director: 'Jay Chandrasekhar'
    },
    {
        Title: 'Anchorman',
        Director: 'Adam McKay'
    },
    {
        Title: 'Blow',
        Director: 'Ted Demme'
    },
    {
        Title: 'The Nice Guys',
        Director: 'Shane Black'
    },
    {
        Title: 'Bourne Identity',
        Director: 'Doug Liman'
    },
    {
        Title: 'Snatch',
        Director: 'Guy Ritchie'
    },
    {
        Title: 'Baby Driver',
        Director: 'Edgar Wright'
    },
    {
        Title: 'Rush',
        Director: 'Ron Howard'
    },
    {
        Title: 'The Departed',
        Director: 'Martin Scorsese'
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

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!')
});

// returns JSON list of movies
app.get('/movies', (req, res) => {
    res.json(movies);
});

// READ - returns JSON object of individual movie
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.Title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('No movie by that name.')
    }
});

app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('No such genre.')
    }
});

app.get('/movies/director/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.Director.Name === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('No director by that name.')
    }
});

app.post('/users', (req, res) => {
    res.send('Successful POST request to add new user')
});

app.put('/users/:id', (req, res) => {
    res.send('Successful PUT request to update user info')
});

app.post('/users/:id/:movieTitle', (req, res) => {
    res.send('Successful POST request to add a new movie to a users favorites list')
});

app.delete('/users/:id/:movieTitle', (req, res) => {
    res.send('Successful DELETE request to delete a movie from a users favorites list')
});

app.delete('/users/:id', (req, res) => {
    res.send('Successful DELETE request to allow existing user to deregister')
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