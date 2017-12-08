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
  'b2xVn2': {
    id: 'b2xVn2',
    fullUrl: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  '9sm5xK': {
    id: '9sm5xK',
    fullUrl: "http://www.google.com",
    userID: "user2RandomID"
  }
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
  const userID = request.cookies.userID;
  let varTemplates = {
    urls: urlsForUser(request.cookies.userID),
    user: users[userID]
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
  if (request.cookies.userID) {
    let varTemplates = {
      urls: urlDatabase,
      user: users[request.cookies.userID]
    };
    response.render("urls_new", varTemplates);
  } else {
    response.redirect('/login');
  }
});

app.get('/urls/:id', (request, response) => {
  //TODO fix for invalid params
  const userID = request.cookies.userID;
  if (userID) {
    let varTemplates = {
      url: urlDatabase[request.params.id],
      user: users[userID]
    };
    response.render('urls_show', varTemplates);
  } else {
    response.redirect('/login');
  }
});

app.get("/u/:shortURL", (request, response) => {
  //TODO fix for invalid url
  let longURL = urlDatabase[request.params.shortURL].fullUrl;
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
    userID: request.cookies.userID
  }
  urlDatabase[shortUrl] = newUrl;

  response.redirect(`/urls/${shortUrl}`);
});

app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  const userID = getUserIDFromEmail(email);

  if (checkEmail(email) && users[userID].password === password && password && email) {
    response.cookie('userID', userID);
    response.redirect('/urls');
    return;
  }
  response.statusCode = 403;
  response.send("Email and/or password do not match");

});

app.post('/logout', (request, response) => {
  response.clearCookie('userID');
  response.redirect('/urls');
});

app.post('/urls/:id/update', (request, response) => {
  const id = request.params.id;
  const userID = request.cookies.userID;
  if (userID === urlDatabase[id].userID) {
    urlDatabase[id].fullUrl = request.body.new_URL;
    response.redirect('/urls');
  } else {
    response.statusCode = 401;
    response.send("You can only edit links that are made by you");
  }
});

app.post('/urls/:id/delete', (request, response) => {
  //TODO add error checking
  const id = request.params.id;
  const userID = request.cookies.userID;
  if (userID === urlDatabase[id].userID) {
    delete urlDatabase[id];
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

function urlsForUser(id) {
  let userUrls = {};
  for (var url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}

function getUserIDFromEmail(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
}

function checkPassword(password) {
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
