const express = require('express');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const db = require('./db');

let app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ['superkey', 'superkey2'],
}));

app.set('view engine', 'ejs');


// GET Handlers
// ---------------------------------------------------------------
// ---------------------------------------------------------------
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
  let varTemplates = {
    urls: db.urlDatabase,
    user: db.users[request.session.userID]
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
  //TODO fix for invalid params
  const userID = request.session.userID;
  if (userID) {
    let varTemplates = {
      url: db.urlDatabase[request.params.id],
      user: db.users[userID]
    };
    response.render('urls_show', varTemplates);
  } else {
    response.redirect('/login');
  }
});

app.get("/u/:shortURL", (request, response) => {
  //TODO fix for invalid url
  let longURL = db.urlDatabase[request.params.shortURL].fullUrl;
  response.redirect(longURL);
});
// ---------------------------------------------------------------


//POST Handlers
// ---------------------------------------------------------------
// ---------------------------------------------------------------
app.post("/urls", (request, response) => {
  //TODO add error checking for invalid shortURL
  let shortUrl = generateRandomString();
  const newUrl = {
    id: shortUrl,
    fullUrl: request.body.longURL,
    userID: request.session.userID
  }
  db.urlDatabase[shortUrl] = newUrl;

  response.redirect(`/urls/${shortUrl}`);
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

app.post('/urls/:id/update', (request, response) => {
  const id = request.params.id;
  const userID = request.session.userID;
  if (userID === db.urlDatabase[id].userID) {
    db.urlDatabase[id].fullUrl = request.body.new_URL;
    response.redirect('/urls');
  } else {
    response.statusCode = 401;
    response.send("You can only edit links that are made by you");
  }
});

app.post('/urls/:id/delete', (request, response) => {
  //TODO add error checking
  const id = request.params.id;
  const userID = request.session.userID;
  if (userID === db.urlDatabase[id].userID) {
    delete db.urlDatabase[id];
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
// ---------------------------------------------------------------


app.listen(PORT, () => {
  console.log(`App is listening on PORT: ${PORT}!`);
});


function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function createNewUser(userID, email, password){
  const hashedPassword = bcrypt.hashSync(password, 11);
  const user = {
    userID: userID,
    email: email,
    password: hashedPassword
  };
  return user;
}

function urlsForUser(id) {
  let userUrls = {};
  for (var url in db.urlDatabase) {
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
