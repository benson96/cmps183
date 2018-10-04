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

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    self.upload_file = function () {
        // Reads the file.
        if (self.vue.img_file) {
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
                    req.send(self.vue.img_file);
                    self.vue.img_file = null;
                });
        }
    };


    self.upload_complete = function(get_url) {
        // Hides the uploader div.
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
        self.add_image(get_url)
    };

    self.add_image = function(image_url) {
        self.vue.loading = true
        $.post(add_image_url,{
            image_url: image_url,
            price: self.vue.price
        }, function(data){
            self.vue.price = 0
            setTimeout(() => {
              self.get_user_images(self.vue.user_id)
            }, 2000)
        });
    };

    self.get_user_images = function(id) {
        $.get(get_user_images_url + '?id=' + id, function(data){
            self.vue.show_img_list = []
            for (let img of data.img_list) {
                if (img.created_by == self.vue.selected_user.id) {
                    self.vue.show_img_list.push(img)
                }
            }
            self.vue.img_list = data.img_list
            self.vue.loading = false
        })
    }

    self.update_image = function(id) {
        $.post(update_image_url, {
            id: id,
            price: self.vue.edit_price
        }, function(data) {
            self.get_user_images(self.vue.user_id)
        })
    }

    self.pay = function () {
        self.stripe_instance.open({
            name: "Your nice cart",
            description: "Buy cart content",
            billingAddress: true,
            shippingAddress: true,
            amount: Math.round(self.vue.cart_total * 100),
        });
    };

    self.totalAmount = function () {
      total = 0
      for (let img of self.vue.selected_imgs) {
        total = total + img.price
      }
      return total
    }

    self.stripe_instance = StripeCheckout.configure({
        key: 'pk_test_SIettNkxmHpaIvYvdNVxsvuD',    //put your own publishable key here
        image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
        locale: 'auto',
        token: function(token, args) {
            console.log('got a token. sending data to localhost.');
            self.stripe_token = token;
            self.customer_info = args;
            self.send_data_to_server();
        }
    });

    // self.customer_info = {}
    // self.stripe_token = ''
    //
    // self.goto = function (page) {
    //     self.vue.page = page;
    //     if (page == 'cart') {
    //         // prepares the form.
    //         self.stripe_instance = StripeCheckout.configure({
    //             key: 'pk_test_SIettNkxmHpaIvYvdNVxsvuD',    //put your own publishable key here
    //             image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
    //             locale: 'auto',
    //             token: function(token, args) {
    //                 console.log('got a token. sending data to localhost.');
    //                 self.stripe_token = token;
    //                 self.customer_info = args;
    //                 self.send_data_to_server();
    //             }
    //         });
    //     };
    // };
    //
    self.send_data_to_server = function () {
        // Calls the server.
        $.post(purchase_url,
            {
                customer_info: JSON.stringify(self.customer_info),
                transaction_token: self.stripe_token.id,
                amount: self.totalAmount(),
                cart: JSON.stringify(self.vue.selected_imgs),
            },
            function (data) {
                // The order was successful.
                self.vue.selected_imgs = [];
                self.vue.snackbar = true
            }
        );
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            logged_in: logged_in,
            email: email,
            user_id: user_id,
            is_uploading: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            img_list: [],
            user_list: user_list,
            loading: false,
            selected_user: {id: 0},
            price: 0,
            img_file: null,
            selected_imgs: [],
            edit_id: null,
            edit_price: 0,
            cartDialog: false,
            show_img_list: [],
            snackbar: false
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_user_images: self.get_user_images,
            update_image: self.update_image,
            pay: self.pay,
            totalAmount: self.totalAmount,
            fileChange(event) {
              this.img_file = event.target.files[0]
            },
            select(img) {
              for (let i = 0; i < this.selected_imgs.length; i++) {
                if (this.selected_imgs[i].id == img.id) {
                    this.selected_imgs.splice(i, 1)
                    return
                }
              }
              this.selected_imgs.push(img)
            },
            editPrice(img) {
              if (img.created_by != this.user_id) return
              this.edit_id = img.id
              this.edit_price = img.price
            },
            getImgUrlByID(id) {
              for (let img of this.img_list) {
                if (img.id == id) {
                  console.log(img.image_url);
                  return img.image_url
                }
              }
            },
            isSelected(img) {
              for (let i = 0; i < this.selected_imgs.length; i++) {
                if (this.selected_imgs[i].id == img.id) return true
              }
              return false
            }
        },
        watch: {
          selected_user(now, old) {
            this.get_user_images(now.id)
          }
        },
        mounted() {
          if (logged_in) {
            list = []
            for(let user of user_list) {
              if (user.id == this.user_id) list.unshift(user)
              else list.push(user)
            }
            this.user_list = list
          }
          this.get_user_images(this.user_list[0].id)
          this.selected_user = this.user_list[0]
        }
    });

    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
