var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator');

// get Users model
var User = require('../models/user');

// GET register
router.get('/register', function (req, res, next) {

  res.render('register', {
    title: 'Register'
  });

});

// POST register
// kiểm tra các field trên form đăng ký
const checkFormRegister = [
  check('name', 'Name is required!').notEmpty(),
  check('email', 'Email is required!').isEmail(),
  check('username', 'Username is required!').notEmpty(),
  check('password', 'Password is required!').notEmpty(),
  check('password2').custom((value, { req }) => {
    if (value != req.body.password) {
      throw new Error('Password do not match!');
    }
    return true;
  })
]

// khi bấm submit form đăng ký sẽ xử lý theo route này
router.post('/register', checkFormRegister, function (req, res, next) {

  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;

  const errors = validationResult(req).errors;

  if (errors.length != 0) {
    res.render('register', {
      errors: errors,
      user: null,
      title: 'Register'
    });
  } else {
    User.findOne({ username: username }, function (err, user) {
      if (err) console.log(err);

      if (user) {
        req.flash('danger', 'Username exists, please choose another');
        res.redirect('/users/register');
      } else { // nếu chưa có thì add user vào database
        var user = new User({
          name: name,
          email: email,
          username: username,
          password: password,
          admin: 0
          // admin: 0
        });
        bcrypt.genSalt(10, function (err, salt) {
          // mã hóa mật khẩu của người dùng và lưu vào database
          bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) console.log(err);

            user.password = hash;

            user.save(function (err) {
              if (err) {
                console.log(err);
              } else {
                req.flash('success', 'You are now register!');
                res.redirect('/users/login')
              }
            });
          });
        });
      }
    });
  }
});

// GET login
router.get('/login', function (req, res, next) {
  // nếu user đã có thì quay về trang chủ
  if (res.locals.user) res.redirect('/');
  // Hiển thị để người dùng login
  res.render('login', {
    title: 'Log In'
  });

});

// POST login
router.post('/login', function (req, res, next) {

  passport.authenticate('local', {
    successRedirect: '/', // thành công thì quay về home để mua hàng
    failureRedirect: '/users/login', // thất bại thì login lại
    failureFlash: true
  })(req, res, next);

});

// GET logout
router.get('/logout', function (req, res, next) {

  req.logout();

  req.flash('success', 'You are logged out!');
  res.redirect('/users/login');
});



module.exports = router;
