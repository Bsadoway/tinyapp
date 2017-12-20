const express = require('express');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const db = require('./db');
const dateFormat = require('dateformat');


let app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));

//TODO use process.env for keys
app.use(cookieSession({
  name: 'session',
  keys: ['superkey', 'superkey2'],
}));

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  if (db.users[request.session.userID]) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

app.get('/urls', (request, response) => {
  const userID = request.session.userID;
  let varTemplates = {
    urls: urlsForUser(userID),
    user: db.users[userID]
  };
  response.render('urls_index', varTemplates);
});

app.get('/login', (request, response) => {
  let varTemplates = {
    urls: db.urlDatabase,
    user: db.users[request.session.userID]
  };

  if (db.users[request.session.userID]) {
    response.redirect('/urls');
  } else {
    response.render('urls_login', varTemplates);
  }
});

app.get('/register', (request, response) => {
  const userID = request.session.userID;
  if (userID) {
    response.redirect('/urls');
    return;
  }

  let varTemplates = {
    urls: db.urlDatabase,
    user: db.users[userID]
  };

  response.render('urls_register', varTemplates);
})

app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

app.get("/urls/new", (request, response) => {
  if (request.session.userID) {
    let varTemplates = {
      urls: db.urlDatabase,
      user: db.users[request.session.userID]
    };
    response.render("urls_new", varTemplates);
  } else {
    response.redirect('/login');
  }
});

app.get('/urls/:id', (request, response) => {
  const userID = request.session.userID;
  const shortUrl = request.params.id;

  if (!db.urlDatabase[shortUrl]) {
    response.statusCode = 404;
    response.send("Error, url ID not found");
    return;
  }

  if (userID === db.urlDatabase[shortUrl].userID) {
    let varTemplates = {
      url: db.urlDatabase[shortUrl],
      user: db.users[userID]
    };
    response.render('urls_show', varTemplates);
  } else {
    response.redirect('/login');
  }
});

app.get("/u/:id", (request, response) => {
  const url = db.urlDatabase[request.params.id];
  if (url) {
    const longURL = url.fullUrl;
    response.redirect(longURL);
  } else {
    response.statusCode = 404;
    response.send("Error, URL not found");
  }
});

app.post("/urls", (request, response) => {
  const shortUrl = generateRandomString();
  const fullUrl = request.body.longURL;
  const userID = request.session.userID;

  if(!fullUrl){
    response.statusCode = 403;
    response.send("Error, url must be valid");
    return;
  }

  if (userID) {
    db.urlDatabase[shortUrl] = createNewUrl(shortUrl, fullUrl, userID);
    response.redirect(`/urls/${shortUrl}`);
  } else {
    response.statusCode = 403;
    response.send("Forbidden to post to this link");
  }
});

app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  const userID = getUserIDFromEmail(email);

  if (userID && bcrypt.compareSync(password, db.users[userID].password) && password && email) {
    request.session.userID = userID;
    response.redirect('/urls');
    return;
  }
  response.statusCode = 403;
  response.send("Email and/or password do not match");

});

app.post('/logout', (request, response) => {
  request.session = null;
  response.redirect('/urls');
});

app.post('/urls/:id', (request, response) => {
  const shortUrl = request.params.id;
  const userID = request.session.userID;

  if (!db.urlDatabase[shortUrl]) {
    response.statusCode = 404;
    response.send("Error, URL does not exist");
    return;
  }

  if (userID === db.urlDatabase[shortUrl].userID) {
    db.urlDatabase[shortUrl].fullUrl = request.body.new_URL;
    response.redirect('/urls');
  } else {
    response.statusCode = 401;
    response.send("You can only edit links that are made by you");
  }
});

app.post('/urls/:id/delete', (request, response) => {
  const shortUrl = request.params.id;
  const userID = request.session.userID;

  if (!db.urlDatabase[shortUrl]) {
    response.statusCode = 404;
    response.send("Error, URL does not exist");
    return;
  }

  if (userID === db.urlDatabase[shortUrl].userID) {
    delete db.urlDatabase[shortUrl];
    response.redirect('/urls');
  } else {
    response.statusCode = 401;
    response.send("You can only delete links that are made by you");
  }
});

app.post('/register', (request, response) => {
  const userID = generateRandomString();
  const email = request.body.email;
  const password = request.body.password;

  if (!email || !password) {
    response.statusCode = 400;
    response.send("Invalid email or password");
    return;
  }
  if (getUserIDFromEmail(email)) {
    response.statusCode = 400;
    response.send("Email already exists, did you forget your password?");
    return;
  }

  db.users[userID] = createNewUser(userID, email, password);

  request.session.userID = userID;
  response.redirect('/urls');

});


app.listen(PORT, () => {
  console.log(`App is listening on PORT: ${PORT}!`);
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function createNewUser(userID, email, password) {
  const hashedPassword = bcrypt.hashSync(password, 11);
  const user = {
    userID: userID,
    email: email,
    password: hashedPassword
  };
  return user;
}

function createNewUrl(shortUrl, fullUrl, userID) {
  const date = Date.now();
  const newUrl = {
    id: shortUrl,
    fullUrl: appendHTTP(fullUrl),
    userID: userID,
    createdDate: dateFormat(date, "dddd, mmmm dS, yyyy, h:MM:ss TT")
  }
  return newUrl;
}


function urlsForUser(id) {
  let userUrls = {};
  for (let url in db.urlDatabase) {
    if (db.urlDatabase[url].userID === id) {
      userUrls[url] = db.urlDatabase[url];
    }
  }
  return userUrls;
}

function getUserIDFromEmail(email) {
  for (let user in db.users) {
    if (db.users[user].email === email) {
      return user;
    }
  }
  return false;
}

function appendHTTP(http) {
  const prefix = 'http://';

  if (!/^https?:\/\//i.test(http)) {
    http = prefix + http;
  }
  return http;
}
