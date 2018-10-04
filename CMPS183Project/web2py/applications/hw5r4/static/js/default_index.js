
// This is the js for the default/index.html view.


var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    function get_images_url(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return images_url + "&" + $.param(pp);
    }

    self.get_images = function () {
        $.getJSON(get_images_url(0, 20), function (data) {
            self.vue.images = data.images;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.images);
        });
        self.vue.self_page = true;
        self.vue.is_checkout = false;
    };

    self.get_more = function () {
        var num_memos = self.vue.memos.length;
        $.getJSON(get_images_url(num_memos, num_memos + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.images, data.images);
            enumerate(self.vue.images);
        });
    };

    function get_user_images_url(user_email, start_idx, end_idx) {
        var pp = {
            user_email: user_email,
            start_idx: start_idx,
            end_idx: end_idx
        };
        return user_images_url + "?" + $.param(pp);
    }

    self.get_user_images = function (user_email) {
        $.getJSON(get_user_images_url(user_email,0, 20), function (data) {
            self.vue.images = data.images;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.images);
        });
        self.vue.self_page = false;
        self.vue.is_checkout = false;
    };

    self.get_users = function () {
        $.getJSON(users_url, function (data) {
            self.vue.users = data.users;
            enumerate(self.vue.users);
        });
    };

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    self.upload_file = function (event) {
        // Reads the file.
        //var input = $("input#file_input");
        var file = document.getElementById("file_input").files[0];
        if (file) {
            // First, gets an upload URL.
            console.log("Trying to get the upload url");
            $.getJSON('https://upload-dot-luca-teaching.appspot.com/start/uploader/get_upload_url',
                function (data) {
                    // We now have upload (and download) URLs.
                    var put_url = data['signed_url'];
                    var get_url = data['access_url'];
                    console.log("Received upload url: " + put_url);
                    // Uploads the file, using the low-level interface.
                    var req = new XMLHttpRequest();
                    req.addEventListener("load", self.upload_complete(get_url));
                    // TODO: if you like, add a listener for "error" to detect failure.
                    req.open("PUT", put_url, true);
                    req.send(file);
                });
        }
    };

    self.upload_complete = function(get_url) {
        // Hides the uploader div.
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        $.post(add_image_url,
            {
                image_url: get_url,
                price: self.vue.image_price
            },
            function (data) {
                setTimeout(function() {
                    self.vue.images.unshift(data.image);
                    enumerate(self.vue.images);
                    self.get_images();
                }, 1000);
            });
    };

    self.edit_price_button = function (image_idx) {
        self.vue.is_editing = true;
        self.vue.selected_id = self.vue.images[image_idx].id;
        self.vue.edit_form_price = self.vue.images[image_idx].price;
    };

    self.set_price = function(image_idx) {
        self.vue.images[image_idx].price = self.vue.edit_form_price;
        $.post(set_price_url,
            {
                price: self.vue.edit_form_price,
                id: self.vue.selected_id
            },
            function (data) {
                $.web2py.enableElement($("#edit_image_submit"));
                self.vue.is_editing = !self.vue.is_editing;
                self.vue.edit_form_price = "0.00";
                self.vue.selected_id = -1;
            });
    };

    self.cancel_edit_price = function () {
        self.vue.selected_id = -1;
        self.vue.edit_form_price = "0.00";
        self.vue.is_editing = false;
    };

    self.delete_image = function (image_idx) {
        $.post(del_image_url, {image_id: self.vue.images[image_idx].id},
            function () {
                self.vue.images.splice(image_idx, 1);
                enumerate(self.vue.images);
            }
        )
    };

    self.is_cart = function (id) {
        return self.vue.cart.includes(id);
    };

    self.add_cart = function(id) {
        self.vue.cart.push(id);
    };

    self.rmv_cart = function(id) {
        for (var i = 0; 0 < self.vue.cart.length; i++) {
            if (self.vue.cart[i] == id)
                self.vue.cart.splice(i, 1);
        }
    };

    function get_cart_images_url(arr) {
        var pp = {
            cart: arr
        };
        return cart_images_url + "?" + $.param(pp);
    }

    self.customer_info = {};

    self.checkout = function () {
        self.vue.is_checkout = true;
        self.vue.checkout_sum = 0.00;
        if(self.vue.cart.length == 0)
            self.vue.images = [];
        $.getJSON(get_cart_images_url(self.vue.cart.toString()), function (data) {
            self.vue.images = data.images;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.images);
            for (var i = 0; i < self.vue.images.length; i++)
                self.vue.checkout_sum += self.vue.images[i].price;
        });
        self.vue.self_page = false;
        // prepares the form.
        self.stripe_instance = StripeCheckout.configure({
            key: 'pk_test_KQPzTHGk0fBIHtxKZsBoBn0D',    //put your own publishable key here
            image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
            locale: 'auto',
            token: function(token, args) {
                console.log('got a token. sending data to localhost.');
                self.stripe_token = token;
                self.customer_info = args;
                self.send_data_to_server();
            }
        });
    };

    self.pay = function () {
        self.stripe_instance.open({
            name: "Purchasing Images",
            description: "Buy cart content",
            billingAddress: true,
            shippingAddress: true,
            amount: self.vue.checkout_sum * 100
        });
    };

    self.send_data_to_server = function () {
        console.log("Payment for:", self.customer_info);
        // Calls the server.
        $.post(purchase_url,
            {
                customer_info: JSON.stringify(self.customer_info),
                transaction_token: JSON.stringify(self.stripe_token),
                amount: self.vue.cart.length,
                cart: JSON.stringify(self.vue.cart)
            },
            function (data) {
                // The order was successful.
                enumerate(self.vue.cart);
                self.vue.checkout_sum = 0.00;
                $.web2py.flash("Thank you for your purchase");

            }
        );
          self.vue.cart = [];
          self.get_images();
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            images: [],
            users: [],
            cart: [],
            is_uploading: false,
            is_editing: false,
            image_price: 0.00,
            edit_form_price: 0.00,
            selected_id: -1,
            is_checkout: false,
            checkout_sum: 0.00,
            self_page: true // Leave it to true, so initially you are looking at your own images.
        },
        methods: {
            get_images: self.get_images,
            get_more: self.get_more,
            get_users: self.get_users,
            get_user_images: self.get_user_images,
            get_cart_images: self.get_cart_images,
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            edit_price_button: self.edit_price_button,
            set_price: self.set_price,
            cancel_edit_price: self.cancel_edit_price,
            delete_image: self.delete_image,
            is_cart: self.is_cart,
            add_cart: self.add_cart,
            rmv_cart: self.rmv_cart,
            checkout: self.checkout,
            pay: self.pay
        }

    });

    self.get_images();
    self.get_users();

    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

