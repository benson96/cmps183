// This is the js for the default/index.html view.

var app = function () {

    var self = {};

    Vue.config.silent = false; // show all warnings
    var enumerate = function (v) { var k = 0; return v.map(function (e) { e._idx = k++; }); };
    // Extends an array
    self.extend = function (a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    function get_memo_url(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return initial_memo_url + "?" + $.param(pp);
    }

    self.get_memo = function () {
        // The URL is initial_data_url
        $.getJSON(
            get_memo_url(0, 10),
            function (data) {           
                self.vue.has_more = data.has_more;
                self.vue.user_email = data.user_email;
                new_memo=[];
                for (var i=0; i < data.memos.length; i++) {
                    if (data.memos[i].user_email == self.vue.user_email || data.memos[i].is_public) {
                        new_memo.push(data.memos[i]);
                    }
                }
                self.vue.checklist = new_memo;
                enumerate(self.vue.checklist);
            }
        );
    };

    self.get_more = function () {
        var num_tracks = self.vue.checklist.length;
        $.getJSON(get_memo_url(num_tracks, num_tracks + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.checklist, data.memos);
            enumerate(self.vue.checklist);
        });
    };

    self.submit_button = function () {
        // Submits the track info.
        // This is the last step of the track insertion process.
        $.post(add_memo_url,
            {
                title: self.vue.form_title,
                memo: self.vue.form_memo
            },
            function (data) {
                self.get_memo();
                enumerate(self.vue.checklist);
                self.vue.form_title = "";
                self.vue.form_memo = "";
            });
        $(".form").hide();
        self.vue.is_adding_memo = false;
    };

    self.edit_submit_button = function (track_idx) {
        // Submits the track info.
        // This is the last step of the track insertion process.

        $.post(edit_memo_url,
            {
                memo_id: self.vue.checklist[track_idx].id,
                title: self.vue.form_title,
                memo: self.vue.form_memo
            },
            function () {
                self.toggle_edit_status(track_idx);
                self.get_memo();
                //enumerate(self.vue.checklist); 
                self.vue.is_editing = false;
                self.vue.form_title = "";
                self.vue.form_memo = "";
            });

    };

    self.toggle_edit_status = function (track_idx) {
        $.post(toggle_edit_url,
            { memo_id: self.vue.checklist[track_idx].id },
            function () {
                self.get_memo();
            }
        )
        self.vue.is_editing = true;
    };

    self.toggle_public = function (track_idx) {
        $.post(toggle_public_url,
            { memo_id: self.vue.checklist[track_idx].id },
            function () {
                self.get_memo();
            }
        )
    };

    self.delete_track = function (track_idx) {
        $.post(delete_memo_url,
            { memo_id: self.vue.checklist[track_idx].id },
            function () {
                self.vue.checklist.splice(track_idx, 1);
                enumerate(self.vue.checklist);
            }
        )
    };
    self.cancel_add = function () {
        $(".form").hide();
        self.vue.is_adding_memo = false;
    };
    self.cancel_edit = function (track_idx) {
        self.toggle_edit_status(track_idx);
        self.get_memo();
        //enumerate(self.vue.checklist); 
        self.vue.is_editing = false;
    };

    self.add_memo_button = function () {
        // This button is used to start the add of a new track; begins with upload.
        // Show the Dropzone plugin.
        $(".form").show();
        // The button to add a track has been pressed.
        self.vue.is_adding_memo = true;
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            checklist: [],
            has_more: false,
            is_adding_memo: false,
            form_title: "",
            form_memo: "",
            is_editing: false,
            user_email: null
        },
        methods: {
            add_memo_button: self.add_memo_button,
            edit_memo_button: self.edit_memo_button,
            submit_button: self.submit_button,
            edit_submit_button: self.edit_submit_button,
            delete_track: self.delete_track,
            edit_track: self.edit_track,
            cancel_add: self.cancel_add,
            toggle_edit_status: self.toggle_edit_status,
            toggle_public: self.toggle_public,
            cancel_edit: self.cancel_edit,
            get_more: self.get_more,
        }

    });
    self.get_memo();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function () { APP = app(); });
