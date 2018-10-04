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
        var reader = new FileReader();

        reader.addEventListener("load", function () {
            self.vue.img_url = reader.result;
        }, false);

        if (file) {
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
                    
                    req.onreadystatechange = function(){
                        //https://www.w3schools.com/xml/xml_http.asp
                        if(this.readyState == 4){ //server doesn't send "OK" status, can't check for that
                            self.add_image();                
                            self.close_uploader();
                            self.vue.show_img = false;
                        }
                    }
                    
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
    };


    self.add_image = function(){
        var parameters = {
            img_url: self.vue.img_url
        }
        $.post(add_image_api_url,
            parameters,
            function(data){
                self.vue.user_images.unshift(data.added_image_dict)    
            }
        )
    }
    
    self.get_user_images = function(user_id=null){
        var parameters = {
            user_id: user_id
        }
        $.post(get_user_images_api_url,
            parameters,
            function(data){
                if(data.image_dict_list !== null){
                    self.vue.user_images = data.image_dict_list;
                }
                self.vue.active_images_user_id = data.user_id;
                self.vue.self_page = data.my_profile;
            }
        )
    }
    
    self.get_users = function(){
        var parameters = {
            
        }
        $.post(get_users_api_url,
            parameters,
            function(data){
                if(data.users_dict_list !== null){
                    self.vue.user_list = data.users_dict_list;
                }
            }
        )
    }
    
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_uploading: false,
            img_url: null,
            show_img: false,
            self_page: true, // Leave it to true, so initially you are looking at your own images.
            user_list: [],
            user_images: [],
            active_images_user_id: null,
        },
        methods: {
            open_uploader: self.open_uploader,
            close_uploader: self.close_uploader,
            upload_file: self.upload_file,
            add_image: self.add_image,
            get_user_images: self.get_user_images
        }

    });

    self.get_users();
    self.get_user_images();
    $("#vue-div").show();

    return self;
};

var APP = null;


// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});

