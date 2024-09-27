import mongoose from 'mongoose';
import slug from 'mongoose-slug-updater';
import passportLocalMongoose from 'passport-local-mongoose';
import fs from 'fs';
import path from 'path';
import url from 'url';

mongoose.plugin(slug);

// users
// * our site requires authentication...
// * so users have a username and password
// * they also can have 0 or more reviews
const User = new mongoose.Schema({});
User.plugin(passportLocalMongoose);

// Movies
// * they have a title and a director
// * they also have 1 or more stars, year, and length
// * they can have 0 or more reviews
const Movie = new mongoose.Schema({
    title: String,
    director: String,
    stars: [String],
    year: Number,
    length: Number,
    reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],
    slug: {type: String, slug: ['title', 'director', 'year'], unique: true}
});

// Reviews
// * each review must have 1 related user and 1 related movie
// * they also have a content and a timestamp
const Review = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    content: String,
    createdAt: {type: Date, default: Date.now}
});

mongoose.model('User', User);
mongoose.model('Movie', Movie);
mongoose.model('Review', Review);

// is the environment variable, NODE_ENV, set to PRODUCTION? 
const __dirname = path.dirname(url.fileURLToPath(import.meta.url)).split('/').slice(0, -1).join('/');
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
  // if we're in PRODUCTION mode, then read the configration from a file
  // use blocking file io to do this...
  const fn = path.join(__dirname, 'config.json');
  const data = fs.readFileSync(fn);

  // our configuration file will be in json, so parse it and set the
  // conenction string appropriately!
  const conf = JSON.parse(data);
  dbconf = conf.dbconf;
} 
else {
  dbconf = 'mongodb://localhost/final_project';
}

console.log('Waiting for connection to database...');
try {
  mongoose.connect(dbconf, {useNewUrlParser: true});
  console.log('Successfully connected to database.');
} catch (err) {
  console.log('ERROR: ', err);
}
