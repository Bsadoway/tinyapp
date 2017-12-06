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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get('/', (request, response) => {
  response.end("Hello");
});

app.get('/urls', (request, response) => {
  let varTemplates = {
    urls: urlDatabase,
    username: request.cookies["username"]
  };
  response.render('urls_index', varTemplates);
});

app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get('/urls/:id', (request, response) => {
  //TODO fix for invalid params
  let varTemplates = {
    fullUrl: urlDatabase[request.params.id],
    shortUrl: request.params.id,
    username: request.cookies["username"]
  };
  response.render('urls_show', varTemplates);
});

app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});


app.post("/urls", (request, response) => {
  //TODO add error checking for invalid shortURL
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = request.body.longURL;

  response.redirect(`/urls/${shortUrl}`);
});

app.post('/login', (request, response) => {
  response.cookie('username',request.body.username);
  response.redirect('/urls');
});

app.post('/logout', (request, response) => {
  response.clearCookie('username');
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



app.listen(PORT, () => {
  console.log(`App is listening on PORT: ${PORT}!`);
});


function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}
