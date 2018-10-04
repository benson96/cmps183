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

    self.get_users = function() {
        $.getJSON(get_users_url, function (data) {
            self.vue.users = data.users
        })

        // console.log("users lenght = " + self.vue.users.length);

        // for (var i = 0; i < self.vue.users.length; i++) {
        //     console.log("users[" + i + "] = " + self.vue.users[i].first_name);
        // }
    }

    self.show_other_images = function (user_id, curr_user) {
        console.log("user_id = " + user_id);
        console.log("curr_user = " + curr_user);
        
        if (user_id != curr_user) {
            self.vue.self_page = false;
        } else {
            self.vue.self_page = true;
        }

        console.log(self.vue.self_page);

        self.selected_user = user_id;
        console.log("selected_user = " + self.selected_user);
        //call get_images, querying the database to select images only owned by the correct user
        self.get_user_images(user_id);
        self.vue.displaying = true;

    }

    self.open_uploader = function () {
        $("div#uploader_div").show();
        self.vue.is_uploading = true;
    };

    self.close_uploader = function () {
        $("div#uploader_div").hide();
        self.vue.is_uploading = false;
        $("input#file_input").val(""); // This clears the file choice once uploaded.

    };

    //displays the images
    function get_images_url(start_idx, end_idx, user_id) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx,
            created_by: user_id
        };
        return images_url + "?" + $.param(pp);
    }

    self.get_user_images = function (user_id) {
        $.getJSON(get_images_url(self.vue.start_idx, self.vue.end_idx, user_id), function (data) {
            self.vue.user_images = data.user_images;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.user_images);
            
        })

    };

    self.get_more = function () {
        console.log("user_images length = " + self.vue.user_images.length);
        self.vue.end_idx = self.vue.end_idx + 10;
        var num_images = self.vue.user_images.length;
        $.getJSON(get_images_url(num_images, num_images + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.user_images, data.user_images);
            enumerate(self.vue.user_images);
            self.get_user_images(self.selected_user);
        });
    };

    self.upload_file = function (event) {
        // Reads the file.
        var input = event.target;
        var file = input.files[0];
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
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
        $.post(upload_image_url, 
            {
                image_url: get_url
            }, 
            function (data) {
                console.log("returned from database and into js");
                console.log("selected_user = " + self.selected_user);
                setTimeout(function() {
                    self.get_user_images(self.selected_user);
                }, 500);
                
        });

        
    };


    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            start_idx: 0,
            end_idx: 20,
            user_images: [],
            users: [],
            has_more: false,
            logged_in: false,
            is_uploading: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            displaying: false,
            selected_user: -1 //initialized to this because it will start out as no one selected
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            upload_complete: self.upload_complete,
            //get_user_images: self.get_user_images,
            get_more: self.get_more,
            get_users: self.get_users,
            show_other_images: self.show_other_images
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

