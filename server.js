const express = require('express');
const path = require("path");
const connectDB = require('./config/db');

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

app.use(express.static('views'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use('', require('./routes/auth'));

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
