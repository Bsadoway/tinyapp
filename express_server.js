const express = require('express');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')


let app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher"
  }
}

// GET Handlers
// ---------------------------------------------------------------
// ---------------------------------------------------------------
app.get('/', (request, response) => {
  if (users[request.cookies.userID]) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

app.get('/urls', (request, response) => {
  let varTemplates = {
    urls: urlDatabase,
    user: users[request.cookies.userID]
  };
  response.render('urls_index', varTemplates);
});

app.get('/login', (request, response) => {
  if (users[request.cookies.userID]) {
    response.redirect('/urls');
  } else {
    let varTemplates = {
      urls: urlDatabase,
      user: users[request.cookies.userID]
    };
    response.render('urls_login', varTemplates);
  }
});

app.get('/register', (request, response) => {
  let varTemplates = {
    urls: urlDatabase,
    user: users[request.cookies.userID]
  };
  
  response.render('urls_register', varTemplates);
})

app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

app.get("/urls/new", (request, response) => {
  let varTemplates = {
    urls: urlDatabase,
    user: users[request.cookies.userID]
  };
  response.render("urls_new", varTemplates);
});

app.get('/urls/:id', (request, response) => {
  //TODO fix for invalid params
  let varTemplates = {
    fullUrl: urlDatabase[request.params.id],
    shortUrl: request.params.id,
    user: users[request.cookies.userID]
  };
  response.render('urls_show', varTemplates);
});

app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});
// ---------------------------------------------------------------


//POST Handlers
// ---------------------------------------------------------------
// ---------------------------------------------------------------
app.post("/urls", (request, response) => {
  //TODO add error checking for invalid shortURL
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = request.body.longURL;

  response.redirect(`/urls/${shortUrl}`);
});

app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  if(checkEmail(email) && checkPassword(password)){
    response.cookie('userID', getUserIDFromEmail(email));
    response.redirect('/');
  } else {
    response.statusCode = 403;
    response.send("Email and/or password do not match");
  }
});

app.post('/logout', (request, response) => {
  response.clearCookie('userID');
  response.redirect('/urls');
});

app.post('/urls/:id/update', (request, response) => {
  const id = request.params.id;
  urlDatabase[id] = request.body.new_URL;
  response.redirect('/urls');
});

app.post('/urls/:id/delete', (request, response) => {
  //TODO add error checking
  const id = request.params.id;
  delete urlDatabase[id];
  response.redirect('/urls');
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
  if (checkEmail(email)) {
    response.statusCode = 400;
    response.send("Email already exists, did you forget your password?");
    return;
  }

  const user = {
    userID: userID,
    email: email,
    password: password
  };
  users[userID] = user;

  response.cookie('userID', userID);
  response.redirect('/urls');

});
// ---------------------------------------------------------------


app.listen(PORT, () => {
  console.log(`App is listening on PORT: ${PORT}!`);
});


function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function getUserIDFromEmail(email){
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
}

function checkPassword(password){
  for (let user in users) {
    if (users[user].password === password) {
      return true;
    }
  }
  return false;
}

function checkEmail(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}
