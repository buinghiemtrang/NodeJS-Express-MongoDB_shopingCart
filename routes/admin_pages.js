var express = require('express');
var router = express.Router();
var {check, validationResult} = require('express-validator');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Page model
var Page = require('../models/page');


/* GET admin page. */
router.get('/', isAdmin, function(req, res, next) {
  Page.find({}).exec(function(err, pages) {
    res.render('admin/pages', { pages });
  });
});

/* GET add page */
router.get('/add-page', isAdmin, function(req, res, next) {
  var title = "";
  var slug = "";
  var content = "";
  res.render('admin/add_page', { title, slug, content });
});

/* POST add page */
router.post('/add-page', [
  check('title', 'Title must have a value.').notEmpty(),
  check('content', 'Content must have a value.').notEmpty(),
],
  function(req, res, next) {
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  const errors = validationResult(req).errors;
  if (errors.length != 0) {
  res.render('admin/add_page', { errors, title, slug, content });
  }
  else {
    console.log('Chuyển dữ liệu từ form vào database');
    Page.findOne({ slug: slug}, function(err, page) {
      if (page) {
        // hiển thị thông báo có lỗi nếu chèn trùng
        req.flash('danger', 'Page slug exists, choose another.');
        res.render('admin/add_page', { title, slug, content });
      }
      else {
        // truyền dữ liệu từ form vào model Page
        var page = new Page({ title, slug, content, sorting: 100 });
        // lưu model page vào CSDL mongo
        page.save(function(err) {
          if (err) return console.log(err);

          Page.find({}).exec(function(err, pages) {
            if (err) {
              console.log(err);
            }
            else {
              req.app.locals.pages = pages;
            }
          });

          // hiện thông báo cho biết chèn dữ liệu thành công
          req.flash('success', 'Page added');
          // sau khi chèn thành công thì điều hướng về /admin/pages
          res.redirect('/admin/pages');
        });
      }
    });
  }
});

// Sort pages function
function sortPages(ids, callback) {
  var count = 0;

  for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      count++;

      (function (count) {
          Page.findById(id, function (err, page) {
              page.sorting = count;
              page.save(function (err) {
                  if (err)
                      return console.log(err);
                  ++count;
                  if (count >= ids.length) {
                      callback();
                  }
              });
          });
      })(count);

  }
}

// POST reorder pages
router.post('/reorder-pages', function (req, res) {
  var ids = req.body['id[]'];

  sortPages(ids, function () {
      Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
          if (err) {
              console.log(err);
          } else {
              req.app.locals.pages = pages;
          }
      });
  });

});


/* GET edit page. */
router.get('/edit-page/:id', isAdmin, function(req, res, next) {
  Page.findById( { _id: req.params.id }, function(err, page) {
    if (err) return console.log(err);

    res.render('admin/edit_page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
      id: page._id
    });
  });
});

/* POST edit page */
router.post('/edit-page/:id', [
  check('title', 'Title must have a value.').notEmpty(),
  check('content', 'Content must have a value.').notEmpty(),
],
function(req, res, next) {
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var id = req.params.id;

  const errors = validationResult(req).errors;
  if (errors.length != 0) {
    // có lỗi thì quay về trang edit để nhập lại cho đúng
    res.render('admin/edit_page', { errors, title, slug, content, id });
  }
  else {
    console.log('Chuyển dữ liệu từ form vào database');
    Page.findOne({ slug: slug, _id: { '$ne': id } }, function(err, page) {
      if (page) {
        // hiển thị thông báo có lỗi nếu chèn trùng
        req.flash('danger', 'Page slug exists, choose another.');
        res.render('admin/edit_page', { title, slug, content, id });
      }
      else {
        Page.findById(id, function(err, page) {
          if (err) return console.log(err);
          page.title = title;
          page.slug = slug;
          page.content = content;

          // cập nhật lại document trong database với id tương ứng
          page.save(function(err) {
            if (err) return console.log(err);

            Page.find({}).exec(function(err, pages) {
              if (err) {
                console.log(err);
              }
              else {
                req.app.locals.pages = pages;
              }
            });

            // hiện thông báo cho biết cập nhật dữ liệu thành công
            req.flash('success', 'Page updated!');
            // sau khi cập nhật thành công thì điều hướng về /admin/pages/edit-page
            res.redirect('/admin/pages/edit-page/' + id);
          });
        });
      }
    });
  }
});

/* GET delete page. */
router.get('/delete-page/:id', isAdmin, function(req, res, next) {
  Page.findByIdAndRemove( req.params.id, function(err) {
    if (err) return console.log(err);

    Page.find({}).exec(function(err, pages) {
      if (err) {
        console.log(err);
      }
      else {
        req.app.locals.pages = pages;
      }
    });
    
    req.flash('success', 'Page deleted!');
    // sau khi xóa thành công thì điều hướng về /admin/pages
    res.redirect('/admin/pages');
  });
});

module.exports = router;
