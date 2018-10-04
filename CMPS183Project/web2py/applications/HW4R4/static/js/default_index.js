// This is the js for the default/index.html view.


var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings
    
    // Stores any currently uploading images as data-URLs
    self.image_data_url = null;

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
    
    // Upload file to CDN
    self.upload_file = function (event) {
        // Reads the file.
        var input = event.target;
        var file = document.getElementById("file_input").files[0];
        var reader  = new FileReader();
        
        // Save data-URL for later
        reader.addEventListener("load", function () {
            self.image_data_url = reader.result;
        }, false);
        
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
                    req.addEventListener("load", self.add_image_url(get_url));
                    req.open("PUT", put_url, true);
                    req.send(file);
                });
            
            // Start reading file into data-URL
            reader.readAsDataURL(file);
        }
    };

    // After image is uploaded to the CDN,
    // add its URL to local server and do some cleanup
    self.add_image_url = function(get_url) {
        console.log('The file was uploaded; it is now available at ' + get_url);
        
        // Add URL to database
        $.post(image_upload_url, {
            image_url: get_url
        }, function(data) {
            // Hides the uploader div after the image url is saved
            self.close_uploader();
            
            // Add image to user list if they are the current user
            if (self.vue.self_page) {
                // Fall back to using image URL if the data-URL is not done in time
                if (self.image_data_url == null) {
                    self.image_data_url = get_url;
                    console.log("Data-URL not available in time, falling back to upload URL");
                }
                
                // Create new image and set its URL
                self.vue.user_images.unshift({
                    image_url: self.image_data_url
                })
            }
        })
    };
    
    // Gets the images for the provided user and adds them to the page
    self.get_user_images = function(user_id) {
        // Don't do anything if already on the user
        // Or if currently uploading files
        if (user_id == self.vue.current_user) {
            return;
        }
        
        
        // Set self page if changing to the current user's ID
        if (logged_in_user) {
            self.vue.self_page = logged_in_user.id == user_id;
        }
        // Close uploaded when changing pages
        self.close_uploader();
        // Set new user id
        self.vue.current_user = user_id;
        // Clear image list until loaded
        self.vue.user_images = null;
        
        // Get images
        $.post(image_get_url, {
            user_id: user_id
        }, function(data) {
            self.vue.user_images = data.images;
        })
    }
    
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            user_images: null, // List of images for a user
            is_uploading: false, // Is the unloader open
            user_list: null, // List of users
            self_page: false, // True when on your own user images
            current_user: null, // Information about the logged in user
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_user_images: self.get_user_images,
        }
    });
    
    // Always start with the current user's images loaded
    if (logged_in_user) {
        self.get_user_images(logged_in_user.id);
    }
    
    // Get the list of users
    $.post(user_list_url, function(data) {
        self.vue.user_list = data.users;
    })

    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

