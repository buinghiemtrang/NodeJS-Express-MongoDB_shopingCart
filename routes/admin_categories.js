var express = require('express');
var router = express.Router();
var { check, validationResult } = require('express-validator');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;


// Get category model
var Category = require('../models/category')


/* GET admin category */
router.get('/', isAdmin, function (req, res, next) {
  Category.find(function (err, categories) {
    if (err) return console.log(err);
    res.render('admin/categories', { categories });
  });
});

/* GET add category */
router.get('/add-category', isAdmin, function (req, res, next) {
  var title = "";
  res.render('admin/add_category', { title });
});


/* POST add category */
router.post('/add-category', [
  check('title', 'Title must have a value.').notEmpty()
],
  function (req, res, next) {
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();

    const errors = validationResult(req).errors;
    if (errors.length != 0) {
      console.log("có lỗi!");
      // truyền errors, title vào ejs
      res.render('admin/add_category', { errors, title });
    }
    else {
      console.log('Chuyển dữ liệu từ form vào database');
      Category.findOne({ slug: slug }, function (err, category) {
        if (category) {
          // hiển thị thông báo có lỗi nếu chèn trùng
          req.flash('danger', 'Category title exists, choose another.');
          res.render('admin/add_category', { title });
        }
        else {
          // truyền dữ liệu từ form vào model Category
          var category = new Category({ title, slug });
          // lưu model category vào CSDL mongo
          category.save(function (err) {
            if (err) return console.log(err);

            Category.find(function(err, categories) {
              if (err) {
                console.log(err);
              }
              else {
                req.app.locals.categories = categories;
              }
            });

            // hiện thông báo cho biết chèn dữ liệu thành công
            req.flash('success', 'Category added!');
            // sau khi chèn thành công thì điều hướng về /admin/categories
            res.redirect('/admin/categories');
          });
        }
      });
    }
});

/* GET edit category. */
router.get('/edit-category/:id', isAdmin, function (req, res, next) {

  Category.findById({ _id: req.params.id }, function (err, category) {
    if (err) return console.log(err);

    res.render('admin/edit_category', {
      title: category.title,
      id: category._id
    });
  });
});


/* POST edit category */
router.post('/edit-category/:id', [
  check('title', 'Title must have a value.').notEmpty()
],
  function (req, res, next) {
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id; // id từ param

    const errors = validationResult(req).errors;
    if (errors.length != 0) {
      // có lỗi thì quay về trang edit để nhập lại cho đúng
      res.render('admin/edit_category', { errors, title, id });
    }
    else {
      Category.findOne({ slug: slug, _id: {'$ne': id} }, function (err, category) {
        if (category) {
          // hiển thị thông báo có lỗi nếu chèn trùng
          req.flash('danger', 'Category title exists, choose another.');
          res.render('admin/edit_category', { title, id });
        }
        else {
          Category.findById(id, function (err, category) {
            if (err) return console.log(err);
            category.title = title;
            category.slug = slug;


            // cập nhật lại document trong database với id tương ứng
            category.save(function (err) {
              if (err) return console.log(err);

              Category.find(function(err, categories) {
                if (err) {
                  console.log(err);
                }
                else {
                  req.app.locals.categories = categories;
                }
              });

              // hiện thông báo cho biết cập nhật dữ liệu thành công
              req.flash('success', 'Category updated!');
              // sau khi cập nhật thành công thì điều hướng về /admin/pages/edit-category
              res.redirect('/admin/categories/edit-category/' + id);
            });
          });
        }
      });
    }
  });

/* GET delete category */
router.get('/delete-category/:id', function (req, res, next) {
  Category.findByIdAndRemove(req.params.id, function (err) {
    if (err) return console.log(err);

    Category.find(function(err, categories) {
      if (err) {
        console.log(err);
      }
      else {
        req.app.locals.categories = categories;
      }
    });
    
    req.flash('success', 'Category deleted!');
    // sau khi xóa thành công thì điều hướng về /admin/categories
    res.redirect('/admin/categories');
  });
});

module.exports = router;
