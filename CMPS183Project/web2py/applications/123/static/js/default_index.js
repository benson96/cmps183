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

    self.insertion_id = null;
    
    function get_pictures_url(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return pictures_url + "&" + $.param(pp);
    }
    
    self.get_pictures = function () {
        $.getJSON(get_pictures_url(0, 20), function (data) {
            self.vue.pictures = data.pictures;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.pictures);
        })
    };
    
    self.get_more = function () {
        var num_pictures = self.vue.pictures.length;
        $.getJSON(get_tracks_url(num_tracks, num_tracks + 20), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.pictures, data.pictures);
            enumerate(self.vue.pictures);
        });
    };

    self.add_picture = function () {
        $.post(add_picture_url,
        {
            insertion_id: self.insertion_id,
            picture_url: upload_url,
        },
        function (data) {
            $.web2py.enableElement($("#add_picture_submit"));
            self.vue.is_uploading = false;
            self.vue.pictures.unshift(data.picture);
            enumerate(self.vue.pictures);
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
                    upload_url = get_url;
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
        self.insertion_id = get_url.insertion_id;
        self.is_uploading = false;
        console.log('The file was uploaded; it is now available at ' + get_url);
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
        console.log('upload complete');
        
        /*function (data) {
            $.web2py.enableElement($("#add_picture_submit"));
            self.vue.is_uploading = false;
            self.vue.pictures.unshift(data.picture);
            enumerate(self.vue.pictures);
        }*/
        self.add_picture();
    };
    
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_uploading: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            pictures: [],
            logged_in: false,
            has_more: false,
            selected_user_id: -1,
            upload_url: null,
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            get_pictures: self.get_pictures,
            get_more: self.get_more,
        }

    });
    
    self.get_pictures();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

