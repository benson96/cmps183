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
    // Enumaterates an array
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    function get_checklists_url(start_idx, end_idx) {
        console.log("I am in the get checklists url method");
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return checklists_url + "?" + $.param(pp);
    }

    self.get_checklists = function () {
        var checklist_len = self.vue.checklists.length;
        $.getJSON(get_checklists_url(checklist_len, checklist_len+10), function (data) {
            self.vue.checklists = data.checklists;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.checklists)
        })
    };

    self.add_checklist_button = function () {
        if(self.vue.logged_in)
          self.vue.is_adding_checklist = !self.vue.is_adding_checklist;
    };

    self.add_checklist = function () {
        $.post(add_checklist_url,
            {
                memo: self.vue.form_memo,
				title: self.vue.form_title,
            },
            function (data) {
                $.web2py.enableElement($("#add_checklist_submit"));
                self.vue.checklists.unshift(data.checklist);
                if (self.vue.checklists.length > 10) {
                    self.vue.has_more = true;
                }
                enumerate(self.vue.checklists)
                self.vue.is_adding_checklist = !self.vue.is_adding_checklist;
                self.vue.form_memo = "";
				self.vue.form_title = "";
            });
    };

    self.get_more = function () {
        var num_checklists = self.vue.checklists.length;
        $.getJSON(get_checklists_url(num_checklists, num_checklists + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.checklists, data.checklists);
            enumerate(self.vue.tracks)
        });
    };

    self.edit_checklist_submit = function () {
        $.post(edit_checklist_url,
            {
                memo: self.vue.edit_memo,
				title: self.vue.edit_title,
                id: self.vue.edit_id
            },
            function (data) {
                $.web2py.enableElement($("#edit_checklist_submit"));
                self.vue.editing = !self.vue.editing;
            });
    };
    self.edit_checklist = function(checklist_id) {
        console.log("yes");
        self.vue.editing = !self.vue.editing;
        self.vue.edit_id = checklist_id;
    };

    self.cancel_edit = function () {
        self.vue.editing = !self.vue.editing;
        self.vue.edit_id = 0;

    };

    self.delete_track = function(checklist_id) {
        $.post(del_checklist_url,
            {
                checklist_id: checklist_id
            },
            function () {
                var idx = null;
                enumerate(self.vue.checklists)
                for (var i = 0; i < self.vue.checklists.length; i++) {
                    if (self.vue.checklists[i].id === checklist_id) {
                        idx = i + 1;
                        break;
                    }
                }
                if (idx) {
                    self.vue.checklists.splice(idx - 1, 1);
                    if (self.vue.checklists.length < 11) {
                        self.vue.has_more = false;
                    }
                }
            }
        )
    };

    self.toggle_public = function (checklist_idx) {
        var checklist = self.vue.checklists[checklist_idx];
        checklist.is_public = !checklist.is_public;
        $.post(toggle_public_url,
            {id: checklist.id},
            function () {}
            )
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            checklists: [],
            get_more: false,
            logged_in: false,
            editing: false,
            is_adding_checklist: false,
            has_more: false,
            form_memo: null,
            edit_memo: null,
			form_title: null,
            edit_title: null,
            edit_id: 0,
            show: true
        },
        methods: {
            get_more: self.get_more,
            add_checklist_button: self.add_checklist_button,
            add_checklist: self.add_checklist,
            delete_track: self.delete_track,
            edit_checklist: self.edit_checklist,
            edit_checklist_submit: self.edit_checklist_submit,
            cancel_edit: self.cancel_edit,
            toggle_public: self.toggle_public
        }


    });

    self.get_checklists();
    $("#vue-div").show();
    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});




