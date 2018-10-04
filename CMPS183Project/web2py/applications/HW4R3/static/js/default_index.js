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

    self.get_user_images = function() {
        $.getJSON(get_images_url, function(data) {
            self.vue.users = data.users;
            self.vue.my_id = data.my_id;
            enumerate(self.vue.users);
        })
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
        //insert the get_url into the database
        $.post(add_url,
            {
                user_id: self.vue.my_id,
                image: get_url
            },
            function () {
                //prepend url to images field of object at user index
                self.vue.users[0].images.unshift(get_url);
            }
        );
    };

    //changes whose images are being viewed
    self.set_user = function(user_idx) { self.vue.curr_idx = user_idx; };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            //array of objects (dicts), each object in the array is a different user
            //first field: user_id
            //second field: firstname
            //third field: array containing urls of all images posted by that user
            users: [],
            
            //stores the current user's id for image insertions
            my_id: null,

            //this tracks whose images are being displayed
            //Starts at the user's index (always 0) and updated by set_user
            curr_idx: 0,

            //removed self_page; the only flag we need will depend on curr_idx being 0 or not
            is_uploading: false
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            set_user: self.set_user
        }
    });

    self.get_user_images();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
