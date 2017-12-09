const bcrypt = require('bcrypt');

const urlDatabase = {
  'b2xVn2': {
    id: 'b2xVn2',
    fullUrl: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    createdDate: "Monday, January 19th, 2017, 3:12:50 PM"
  },
  '9sm5xK': {
    id: '9sm5xK',
    fullUrl: "http://www.google.com",
    userID: "user2RandomID",
    createdDate: "Sunday, January 18th, 2017, 12:12:50 PM"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple", 11)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher", 11)
  }
}

exports.users = users;
exports.urlDatabase = urlDatabase;
