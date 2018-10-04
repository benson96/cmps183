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
        self.vue.file = null;
        self.vue.price = null;
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    self.input_file = function(event){
      // Reads the file.
      self.vue.file = null;
      var input = event.target;
      var file = input.files[0];
      self.vue.file = file;
    }

    self.submit = function(){
        self.upload_file(self.vue.file);
    }

    self.set_price = function(image){
      $.post(set,
      {
        id:image.id,
        price:image.price,
      }
    );
    }
    self.upload_file = function (file) {

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
                    var read = new FileReader();
                    read.onload = function(e){
                      req.addEventListener("load", self.upload_complete(get_url,e.target.result));
                      // TODO: if you like, add a listener for "error" to detect failure.
                      req.open("PUT", put_url, true);
                      req.send(file);
                    }
                    read.readAsDataURL(file)
                });
        }
    };


    self.upload_complete = function(get_url,base64) {
        // Hides the uploader div.
        $.post(AddImage,
          {
              url:get_url,
              img:base64,
              price:self.vue.price
          },
          function(data){
              //from luca's piazza answer
              self.vue.images.unshift(data.new);
              self.close_uploader();
          }
        );

        console.log('The file was uploaded; it is now available at ' + get_url);
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.

    };

    self.get_self = function(){
      $.post(
        getSelf,
          function (data) {
              self.vue.logged_in = data.logged_in;
              self.vue.user = data.user;
              if(self.vue.logged_in){
                self.vue.get_images(self.vue.user.id);
              }
          }
        )
    };

    self.get_images = function(id){
      if(self.vue.user != null && id != self.vue.user.id){
        self.vue.self_page = false;
      }else{
        self.vue.self_page = true;
      }
      self.vue.selected = id;
      $.post(
        getImages,{
          start_idx:0,
          end_idx:20,
          who:id
        },
          function (data) {
              self.vue.images = data.images;
          }
        )
    }

    self.get_users = function(){
      $.post(
        getUsers,
          function (data) {
              self.vue.user_list = data.users;
          }
        )
    };

    self.in_cart = function(image){
      //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
      var found = self.vue.cart.find(function(e) {
        return e.id == image.id;
      });
      return found;
    }

    self.remove_item = function(image){
      //based on lucas web2py_start_2016 lecture10_spotify branch
      id = image.id;
      var index = null;
       for (var i = 0; i < self.vue.cart.length; i++) {
           if (self.vue.cart[i].id === id) {
               // If I set this to i, it won't work, as the if below will
               // return false for items in first position.
               index = i + 1;
               break;
           }
       }
       if (index) {
           self.vue.cart.splice(index - 1, 1);
       }
    }

    self.add_item = function(image){
      self.vue.cart.unshift(image);
      console.log(self.vue.cart);
    }

    self.checkout = function(){
        self.vue.is_checkout = !self.vue.is_checkout;
    }

    self.pay = function () {
      //From luca's stripe example
      self.stripe_instance = StripeCheckout.configure({
               key: 'pk_test_bTT86SwRlSDUtMtvsNRuOQM2',    //put your own publishable key here
               image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
               locale: 'auto',
               token: function(token, args) {
                   console.log('got a token. sending data to localhost.');
                   self.stripe_token = token;
                   self.customer_info = args;
                   self.send_data_to_server();
               }
        });
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
               transaction_token: JSON.stringify(self.stripe_token),
               amount: self.vue.cart_total,
               cart: JSON.stringify(self.vue.cart),
           },
           function (data) {
               // The order was successful.
               self.vue.cart = []
               self.vue.is_checkout = false;
               $web2py.flash("Thank You for your purchase")
           }
       );
   };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_uploading: false,
            price:null,
            file:null,
            user: null,
            logged_in: false,
            selected:null,
            images:[],
            cart:[],
            is_checkout:false,
            user_list:[],
            self_page: true // Leave it to true, so initially you are looking at your own images.
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_self: self.get_self,
            get_images:self.get_images,
            input:self.input_file,
            submit:self.submit,
            in_cart:self.in_cart,
            add_item:self.add_item,
            remove_item:self.remove_item,
            checkout:self.checkout,
            pay:self.pay,
            set_price:self.set_price
        },
        computed: {
          users(){
            if(this.user == null){
              return this.user_list;
            }
            var list = this.user_list.filter(user=> {
                return user.id != this.user.id;
            });
            list.unshift(this.user)
            return list;
          },
          cart_total(){
            var total = 0;
            for (var i = 0; i < self.vue.cart.length; i++) {
               total += self.vue.cart[i].price;
           }
           return total;
         }
        }

    });

    self.get_self();
    self.get_users();
    //if(self.vue.logged_in == true){
      //  self.get_images(self.vue..user.id);
    //}
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
