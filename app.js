var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var passport = require('passport');

// Ket noi den CSDL mongodb
mongoose.connect(config.database, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Ket noi thanh cong");
});

// Init app
var app = express();

// set routes
var pagesRouter = require('./routes/pages');
var products = require('./routes/products');
var cart = require('./routes/cart');
var users = require('./routes/users');
var adminRouter = require('./routes/admin_pages');
var categoriesRouter = require('./routes/admin_categories');
var productsRouter = require('./routes/admin_products');

// Set global errors variable
app.locals.errors = null;


// GET Page model
var Page = require('./models/page');
// Lấy hết page và truyền vào header.ejs
Page.find(function(err, pages) {
  if (err) console.log(err);
  else {
    app.locals.pages = pages;
  }
});

// get Category model
var Category = require('./models/category');
// get all categories to pass to header.ejs
Category.find({}, function (err, categories) {
  if (err) {
    console.log(err);
  } else {

    // tạo biến toàn cục để truyền qua lại giữa view và route khác
    app.locals.categories = categories;
  }
});

// Express FileUpload middleware
app.use(fileUpload());

// Express Session middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
//  cookie: { secure: true }
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport config
require('./config/passport')(passport);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// set cart locals
app.get('*', function (req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// các route phía admin
app.use('/admin/pages', adminRouter);
app.use('/admin/categories', categoriesRouter);
app.use('/admin/products', productsRouter);

// các route phía client
app.use('/users', users);
app.use('/cart', cart);
app.use('/products', products);
app.use('/', pagesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
