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

    self.toggleform = function() {
        if(self.vue.is_editing){
            self.cancelmemoedit();
        }
        self.vue.adding_memo = !self.vue.adding_memo;
        console.log("Toggling adding_memo to " + self.vue.adding_memo);
    }

    self.add_memo = function() {
        console.log("Adding a Memo: (" + self.vue.memo_title + ", " + self.vue.memo_content + ").");
        $.post(add_memo_url,
            {
                title: self.vue.memo_title,
                content: self.vue.memo_content,
                insertion_id: self.insertion_id
            },
            self.vue.memo_title = "",
            self.vue.memo_content = "")

        self.toggleform();
        self.get_memos();
        home_url //reload page??? no vue doing this for me???
        console.log("Defaulting Vue values: (" + self.vue.memo_title + ", " + self.vue.memo_content + ")/.");
    }

    self.editmemo = function(memo_idx) {
        if(self.vue.adding_memo){
            self.vue.adding_memo = false;
        }
        console.log("Editing Memo (this is value in table): " + self.vue.memos[memo_idx].id);
        console.log("memo idx (value in js array): " + memo_idx);
        self.vue.memo_edit_content = self.vue.memos[memo_idx].memo;
        self.vue.memo_edit_title = self.vue.memos[memo_idx].title;
        self.vue.editing_index = memo_idx;
        self.vue.is_editing = true;
        home_url
    }

    self.submitmemoedit = function(memo_idx) {
        console.log("Submitting memo edit.")
        //call an update in api.py
        $.post(edit_submit_url,
            {
                updated_title: self.vue.memo_edit_title,
                updated_content: self.vue.memo_edit_content,
                memo_id: self.vue.memos[memo_idx].id
            },
            function(data) {
//                console.log("Updated database index: " + data.updated_id);
            })
        self.vue.memo_edit_content = '';
        self.vue.memo_edit_title = '';
        self.vue.editing_index = -1;
        self.vue.is_editing = false;
        self.get_memos();
    }

    self.cancelmemoedit = function() {
        console.log("Cancelling memo edit.")
        //Default local values
        self.vue.memo_edit_content = '';
        self.vue.memo_edit_title = '';
        self.vue.editing_index = -1;
        self.vue.is_editing = false;
    }

    self.toggle_public = function(memo_idx) {
        $.post(toggle_public_url,
            {
                memo_id: self.vue.memos[memo_idx].id,
                new_value: !(self.vue.memos[memo_idx].is_public)
            },
            function(data) {

            })
        self.get_memos();
    }

    self.deletememo = function(memo_idx) {
        console.log('Deleting ' + self.vue.memos[memo_idx].id);
        console.log("memoS before delete: " + self.vue.memos);
        $.post(delete_url,
            { memo_id: self.vue.memos[memo_idx].id },
            function () {
                self.vue.memos.splice(memo_idx, 1);
                enumerate(self.vue.memos);
            }
        )
        console.log("memoS after delete: " + self.vue.memos);
    }

    self.get_memos = function() {
        $.getJSON(get_memos_url(0, 10), function (data) {
            console.log("get_memos: (" + data.memos.title + ", " + data.memos.memo + ").");
            console.log("memoS: " + data.memos);
            self.vue.memos = data.memos;
            self.vue.has_more = data.has_more;
            self.vue.logged_in_user = data.logged_in_user;
            enumerate(self.vue.memos);
        });
    }

    function get_memos_url(start_idx, end_idx) {
        console.log("start idx: " + start_idx + "  end idx: " + end_idx);
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return memos_url + "?" + $.param(pp);
    }

    self.get_more_memos = function(){
        var num_memos = self.vue.memos.length;
        $.getJSON(get_memos_url(num_memos, num_memos + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.memos, data.memos);
            enumerate(self.vue.memos);
        });
    }

    // Complete as needed.
    //HERE's WHERE THE VUE IS SET UP
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            const_string: 'asdfasdfasdf',
            adding_memo: false,
            memo_title: '',
            memo_content: '',
            memo_edit_title: '',
            memo_edit_content: '',
            memos: [],
            has_more: false,
            is_editing: false,
            editing_index: -1,
            logged_in_user: '',
            is_memo_owner: false
        },
        methods: {
            toggleform: self.toggleform,
            add_memo: self.add_memo,
            get_memos: self.get_memos,
            submitmemoedit: self.submitmemoedit,
            cancelmemoedit: self.cancelmemoedit,
            editmemo: self.editmemo,
            toggle_public: self.toggle_public,
            deletememo: self.deletememo,
            get_more_memos: self.get_more_memos
        }

    });

    self.get_memos();

    //Everything div that doesn't use a v-if needs a .show().
    $("#uploader_div").show();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
