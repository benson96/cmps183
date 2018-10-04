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
        console.log(self.vue.is_uploading);
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        console.log(self.vue.is_uploading);
        $("input#file_input").val(""); // This clears the file choice once uploaded.
    };

    self.upload_file = function (event) {
        // Reads the file.
        var file = document.getElementById("file_input").files[0];
        //self.vue.price = document.getElementById("price_input");
        //var file = input.files[0];
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
    
    self.get_user_images = function () {
         console.log("Trying to get the user_images");
        $.getJSON(user_images_url, function (data){        
        
            self.vue.user_images = data.user_images;
            enumerate(self.vue.user_images);
        })
    };

    self.get_user_list = function (){
        $.getJSON(get_user_list_url, function (data){      
        
            self.vue.user_list=data.user_list;
            enumerate(self.vue.user_list);
            }
        )
    };
    
    self.toggle_cart = function (id) {
        $.post(toggle_cart_url, {
            image_id: id,
            in_cart: !self.vue.in_cart,
        })
    }

    self.upload_complete = function(get_url) {
        // Hides the uploader div.
        self.close_uploader();
        console.log('The file was uploaded; it is now available at ' + get_url);
        console.log('price is ' + self.vue.price);
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
         $.post(add_image_url, { 
             image_url: get_url,
             price: self.vue.form_price,
         },
         //taken from piazza
            function (data) {
                console.log(data)  
                //adds delay before executing, taken from piazza
                setTimeout(function() {
                   
                    self.vue.user_images.push(data.user_images);
            }, 750);
                enumerate(self.vue.user_images);
            })
    };
    
    self.set_price = function (idx) {
       $.post(set_price_url, {
           
           id: idx,
       });
    };
    

    self.get_user_image_list = function(user_email) {
        $.post(get_images_url, {
            user_email: user_email,
        },
        
        function (data) {
           
            self.vue.user_images = data.user_images;
            enumerate(self.vue.user_images);
        });
    };



    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            logged_in: false,
            user_list: [],
            is_uploading: false,
            managing_stocks: false,
            user_images: [],
            form_price: null,
            edit_price: null,
        },
        
        methods: {
            toggle_cart: self.toggle_cart,
            get_user_images: self.get_user_images,
            upload_file: self.upload_file,
            get_user_image_list: self.get_user_image_list,
            open_uploader: self.open_uploader,
            get_user_list: self.get_user_list,
            close_uploader: self.close_uploader,
            manage_button: self.manage_button,
            set_price: self.set_price,
        }

    });

    
    
    self.get_user_list();
    self.get_user_images();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

