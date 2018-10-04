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

    function sleep (time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

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
        var input = event.target;
        // var file = input.files[0];
        var file = document.getElementById("file_input").files[0];
        // We want to read the image file, and transform it into a data URL.
        var reader = new FileReader();

        // We add a listener for the load event of the file reader.
        // The listener is called when loading terminates.
        // Once loading (the reader.readAsDataURL) terminates, we have
        // the data URL available.
        reader.addEventListener("load", function () {
            // An image can be represented as a data URL.
            // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
            // Here, we set the data URL of the image contained in the file to an image in the
            // HTML, causing the display of the file image.
            self.vue.img_url = reader.result;
        }, false);

        if (file) {
            // Reads the file as a data URL.
            reader.readAsDataURL(file);
            // Gets an upload URL.
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
        self.vue.show_img = true;
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
        $.post(add_image_url, {
            image_url: get_url,
            price: self.vue.price_input
          }, function(data){
            sleep(500).then(() => {
              self.get_user_images(self.vue.current_img_id);
            });
          }
        );
    };

    self.get_user_images = function (id) {
      self.vue.current_img_id = id;
      $.post(get_user_images_url, {
          id: id
        }, function (data) {
          self.vue.images = data.images;
        });

        if (self.vue.current_img_id == self.vue.current_user_id) {
          console.log(self.vue.current_img_id);
          self.vue.self_page = true;
        }
        if (self.vue.current_img_id != self.vue.current_user_id) {
          self.vue.self_page = false;
        }
    };

    self.get_users = function () {
      $.getJSON(get_users_url, function (data) {
        if (self.vue.current_img_id == null) {
          self.get_user_images(data.users[0].id);
          self.vue.current_user_id = data.users[0].id;
          self.vue.self_page = true;
        }

        self.vue.users = data.users;
      });
    };

    self.format_price = function (value) {
        var val = (value/1).toFixed(2);
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    self.set_price = function(id, price) {
      $.post(set_price_url, {
          image_id: id,
          price: price,
        }, function(data){
        }
      )
    }

    self.in_cart = function(image) {
      for (var i in self.vue.cart) {
        if (self.vue.cart[i].id === image.id) {
          return true;
        }
      }
      return false
    }

    self.add_image_to_cart = function(image) {
      var remove = false;
      for (var i in self.vue.cart) {
        if (self.vue.cart[i].id === image.id) {
          self.vue.cart.splice(self.vue.cart.indexOf(i), 1);
          remove = true;
        }
      }
      if (remove === false) {
        self.vue.cart.push(image);
      }
      self.update_cart();
    }

    self.update_cart = function () {
        enumerate(self.vue.cart);
        var cart_total = 0;
        for (var i = 0; i < self.vue.cart.length; i++) {
          cart_total += self.vue.cart[i].price;
        }
        self.vue.cart_total = cart_total;
    };

    self.goto = function () {
        if (self.vue.is_checkout === true) {
            // prepares the form.
            self.stripe_instance = StripeCheckout.configure({
                key: 'pk_test_4USmQbgjo6Y1WJjXWbQu85kN',    //put your own publishable key here
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

    };

    self.pay = function () {
        self.stripe_instance.open({
            name: "Your nice cart",
            description: "Buy cart content",
            billingAddress: true,
            shippingAddress: true,
            amount: Math.round(self.vue.cart_total * 100),
        });
    };

    self.send_data_to_server = function () {
        console.log("Payment for:", self.customer_info);
        // Calls the server.
        $.post(purchase_url,
            {
                customer_info: JSON.stringify(self.customer_info),
                transaction_token: JSON.stringify(self.stripe_token),
                amount: self.vue.cart_total,
                cart: JSON.stringify(self.vue.cart),
            },
            function (data) {
                // The order was successful.
                self.vue.cart = [];
                self.update_cart();
                self.goto('test');
                $.web2py.flash("Thank you for your purchase");
            }
        );
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_uploading: false,
            img_url: null,
            show_img: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            current_img_id: null,
            current_user_id: null,
            users: [],
            images: [],
            price_input: 0.00,
            cart: [],
            cart_data: [],
            is_checkout: false,
            cart_total: 0.00,
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_users: self.get_users,
            get_user_images: self.get_user_images,
            set_price: self.set_price,
            format_price: self.format_price,
            in_cart: self.in_cart,
            add_image_to_cart: self.add_image_to_cart,
            update_cart: self.update_cart,
            goto: self.goto,
            pay: self.pay,
        }

    });

    self.get_users();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
