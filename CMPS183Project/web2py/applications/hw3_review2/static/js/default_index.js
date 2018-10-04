// This is the js for the default/index.html view.




//a good portion of code originated from https://piazza.com/class/jf2geiytvic7ao?cid=301 and is modified for this assignment

var app = function() {

    var self = {};
    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    function get_posts_url(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return posts_url + "?" + $.param(pp);
    }




    self.get_posts = function () {
        var post_len = self.vue.posts.length;
        $.getJSON(get_posts_url(post_len, post_len+4), function (data) {
            console.log(data);
            self.vue.posts = data.posts;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
        })
    };

    self.add_post_button = function () {
        // The button to add a track has been pressed.
        if(self.vue.logged_in)
          self.vue.is_adding_post = !self.vue.is_adding_post;
    };

    self.add_post = function () {
        // The submit button to add a track has been added.
        $.post(add_post_url,
            {
                content: self.vue.form_content,
				content2: self.vue.form_content2,
            },
            function (data) {
                $.web2py.enableElement($("#add_post_submit"));
                self.vue.posts.unshift(data.post);
                console.log(self.vue.posts.length);
                // if posts length is greater than 4 has_more is true
                if (self.vue.posts.length > 4) {
                    self.vue.has_more = true;
                }
                self.vue.is_adding_post = !self.vue.is_adding_post;
                self.vue.form_content = "";
				self.vue.form_content2 = "";

            });
    };

    self.get_more = function () {
        var num_posts = self.vue.posts.length;
        $.getJSON(get_posts_url(num_posts, num_posts + 4), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.posts, data.posts);
        });
    };

    self.edit_post_submit = function () {
        // The submit button to add a track has been added.
        $.post(edit_post_url,
            {
				post_title: self.vue.edit_content2,
                post_content: self.vue.edit_content,
                id: self.vue.edit_id
            },
            function (data) {
				console.log(data);
                $.web2py.enableElement($("#edit_post_submit"));
                self.vue.editing = !self.vue.editing;
            });
    };
    self.edit_post = function(post_id) {
        console.log(post_id);
        self.vue.editing = !self.vue.editing;
        self.vue.edit_id = post_id;
    };

    self.cancel_edit = function () {
        self.vue.editing = !self.vue.editing;
        self.vue.edit_id = 0;
    };
	
	self.toggle_post = function (post_id) {
        // The submit button to add a track has been added.
		self.vue.toggle_id = post_id;
		console.log(self.vue.pub); 
		self.vue.pub = !self.vue.pub; 
		console.log(self.vue.pub); 
        $.post(toggle_post_url,
            { 
                post_content: self.vue.edit_content,
				is_pub: self.vue.pub,
                id: self.vue.toggle_id
            },
            function (data) {
                $.web2py.enableElement($("#toggle_post_submit"));
            });
    };
	
	
    self.delete_track = function(post_id) {
        $.post(del_post_url,
            {
                post_id: post_id
            },
            function () {
                var idx = null;
                for (var i = 0; i < self.vue.posts.length; i++) {
                    if (self.vue.posts[i].id === post_id) {
                        // If I set this to i, it won't work, as the if below will
                        // return false for items in first position.
                        idx = i + 1;
                        break;
                    }
                }
                if (idx) {
                    self.vue.posts.splice(idx - 1, 1);

                    //if posts length is less that 5 has_more is false
                    if (self.vue.posts.length < 5) {
                        self.vue.has_more = false;
                    }
                }
            }
        )
    };


    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            posts: [],
            get_more: false,
            logged_in: false,
            editing: false,
			toggling: false, 
			pub: null, 
            is_adding_post: false,
            has_more: false,
            form_content: null,
			form_content2: null, 
            edit_content: null,
            edit_content2: null,
            edit_id: 0,
			toggle_content: null, 
			toggle_id: 0,
            show: true
        },
        methods: {
            get_more: self.get_more,
            add_post_button: self.add_post_button,
            add_post: self.add_post,
            delete_track: self.delete_track,
            edit_post: self.edit_post,
			toggle_post: self.toggle_post, 
            edit_post_submit: self.edit_post_submit,
            cancel_edit: self.cancel_edit
        }


    });

    self.get_posts();
    $("#vue-div").show();
    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});




