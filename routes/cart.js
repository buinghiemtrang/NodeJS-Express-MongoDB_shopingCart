var express = require('express');
var router = express.Router();

// Get Product model
var Product = require('../models/product');

// GET add product to cart
router.get('/add/:product', function (req, res) {

    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);
        // nếu giỏ hàng rỗng thì khởi tạo mới
        if (typeof req.session.cart == "undefined") {
            req.session.cart = [];
            // thêm hàng vào giỏ hàng
            req.session.cart.push({
                title: slug,
                qty: 1, // số lượng
                price: parseFloat(p.price).toFixed(2),
                image: '/product_images/' + p._id + '/' + p.image
            });
        } else { // nếu đã hàng trong giỏ rồi thì thêm vô nữa
            var cart = req.session.cart;
            var newItem = true;

            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++; // nếu hàng đã có thì tăng số lượng
                    newItem = false; // đánh dấu không phải là hàng mới
                    break;
                }
            }

            if (newItem) { // nếu là hàng mới thì thêm vào giỏ
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(2),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }

//        console.log(req.session.cart);
        req.flash('success', 'Product added!');
        res.redirect('back');
    });

});

// GET checkout page
router.get('/checkout', function (req, res) {
    // nếu hết hàng trong giỏ thì xóa biến session
    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });
    }

});

// GET update product
router.get('/update/:product', function (req, res) {

    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch (action) {
                case "add":
                    cart[i].qty++;
                    break;
                case "remove":
                    cart[i].qty--;
                    if (cart[i].qty < 1) // xóa product nếu số lượng < 1
                        cart.splice(i, 1);
                    break;
                case "clear":
                    cart.splice(i, 1);
                    if (cart.length == 0)
                        delete req.session.cart;
                    break;
                default:
                    console.log('update problem');
                    break;
            }
            break;
        }
    }

    req.flash('success', 'Cart updated!');
    res.redirect('/cart/checkout'); // tiếp tục quay lại giỏ hàng

});

// GET clear cart
router.get('/clear', function (req, res) {

    delete req.session.cart;
    
    req.flash('success', 'Cart cleared!');
    res.redirect('/cart/checkout');

});

// GET buy now
router.get('/buynow', function (req, res) {

    delete req.session.cart;
    
    res.sendStatus(200);

});

// Exports
module.exports = router;


