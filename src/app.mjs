import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize';
import passport from 'passport';
import './db.mjs';
import './auth.mjs';
import session from 'express-session';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// configure templating to hbs
app.set('view engine', 'hbs');

// body parser (req.body)
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'keyboard dog',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

const User = mongoose.model('User');
const Movie = mongoose.model('Movie');
const Review = mongoose.model('Review');

const authRequired = (req, res, next) => {
  if(!req.session.user) {
    req.session.redirectPath = req.path;
    res.redirect('/login'); 
  } else {
    next();
  }
};

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.get('/', async (req, res) => {
    const input = req.query.input;
    let movies = await Movie.find().sort({title: 1}).exec();
    if (input) {
        movies = movies.filter(movie => movie.title.toLowerCase().includes(input.toLowerCase()));
    }
    movies = movies.map(movie => {
        movie.stars = movie.stars.join(', ');
        return movie;
    });
    res.render('movies', {user: req.session.user, movies: movies});
});

app.get('/movie/:slug', async (req, res) => {
    const movie = await Movie.findOne({slug: req.params.slug}).populate('reviews').exec();
    let reviews = [];
    for (let i = 0; i < movie.reviews.length; i++) {
        const review = movie.reviews[i];
        const user = await User.findById(review.user);
        const date = review.createdAt;
        reviews.push({content: review.content, user: user.username, date: date});
    }
    reviews.sort((a, b) => b.date - a.date);
    reviews = reviews.map(function(ele) {
        return {content: ele.content, user: ele.user, date: ele.date.toLocaleString()};
    });
    movie.stars = movie.stars.join(', ');
    res.render('review', {movie: movie, reviews: reviews});
});

app.get('/add', authRequired, (req, res) => {
    res.render('add');
});

app.post('/add', async (req, res) => {
    const title = req.body.title;
    const director = req.body.director;
    const stars = req.body.stars.split(',').map(star => star.trim());
    const year = req.body.year;
    const length = req.body.length;
    const checkDuplicate = await Movie.findOne({title: title, director: director, year: year});
    if (checkDuplicate) {
        res.render('add', {message: 'Movie already exists'});
        return;
    }
    const movie = new Movie({
        title: title,
        director: director,
        stars: stars,
        year: year,
        length: length,
    });
    await movie.save();
    res.redirect('/');
});

app.post('/movie/review', async (req, res) => {
    const url = req.get('Referer');
    const slug = url.split('/').pop();
    const movie = await Movie.find({slug: slug});
    const comment = req.body.textbox;
    const review = new Review({
        user: req.session.user._id,
        content: comment
    });
    await review.save();
    await Movie.updateOne({_id: movie[0]._id}, {$push: {reviews: review._id}}).exec();
    res.redirect(url);
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', async function(err, user) {
      if(user) {
          req.logIn(user, function() {
            req.session.user = user;
            res.redirect('/');
        });
      } else {
        const username = sanitize(req.body.username);
        const finduser = await User.findOne({username: username});
        if (finduser === null) {
            res.render('login', {message:'User does not exist'});
        }
        else {
            res.render('login', {message:'Your password is incorrect.'});
        }
      }
    })(req, res, next);
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const username = sanitize(req.body.username);
    const password = sanitize(req.body.password);

    User.register(new User({username: username}), password, (err, user) => {
        if (err) {
            const finduser = User.findOne({username: username});
            res.render('register', {message: err.message});
        }
        else {
            passport.authenticate('local')(req, res, function() {
                req.session.user = user;
                res.redirect('/');
            });
        }
    });
  });

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(process.env.PORT || 3000);
