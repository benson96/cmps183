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
        $.post(add_image_url,
          {
            id: self.vue.me,
            get_url: get_url
          },
          function(data) {
            setTimeout( function(){
              self.get_images(self.vue.me);
            }, 1000);
          }
        );
        // TODO: The file is uploaded.  Now you have to insert the get_url into the database, etc.
    };


    self.get_login_state = function() {
      $.getJSON(login_state_url, function(data) {
        self.vue.logged_in = data.logged_in;
      });
    }


    self.get_users = function() {
      $.getJSON(get_users_url, function(data) {
        self.vue.me = data.me[0].id;
        self.vue.users = data.me.concat(data.users);
      })
    }


    self.get_images = function(id) {
      $.post(get_images_url,
        {
          id: id
        },
        function(data) {
          self.vue.images = data.images;
        }
      );
    }


    self.select_user = function(id) {
      self.vue.selected_user = id;
      self.vue.self_page = (id == self.vue.me);
      self.get_images(id);
    }


    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_uploading: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            logged_in: false,
            users: [],
            selected_user: null,
            me: 0,
            images: null
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            select_user: self.select_user
        }

    });
    self.get_users();
    self.get_login_state();
    $( '#login_link' ).attr('href', login_url);
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
