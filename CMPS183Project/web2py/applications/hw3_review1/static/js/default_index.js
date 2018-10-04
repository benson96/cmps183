// This is the js for the default/index.html view.

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings


    // Function to return a link to where the memos can be retrieved from a data base
    function get_memos_url(start_index, end_index){
        var pp = {
            start_idx: start_index,
            end_idx: end_index
        };
        return memos_url + "?" + $.param(pp);
    }


    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };


    // Toggles the availabiltiy of an add memo button
    self.add_memo_button = function () {
        // The button to add a track has been pressed.
        if(self.vue.logged_in){
            self.vue.is_adding_memo = !self.vue.is_adding_memo;
        }
    };


    // Opens and inits the edit UI using vue.js
    self.edit_memos = function(memo_id){
        var idx = null;
        for (var i = 0; i < self.vue.memos.length; i++) {
            if (self.vue.memos[i].id === memo_id) {
                // If I set this to i, it won't work, as the if below will
                // return false for items in first position.
                idx = i + 1;
                break;
            }
        }
        if (idx) {
            old_text = self.vue.memos[idx-1].memo_text;     // Stores old values if canceld
            old_title = self.vue.memos[idx-1].title;
            self.vue.form_edit_title = self.vue.memos[idx-1].title;     //Sets the new text to the edit text
            self.vue.form_edit_text = self.vue.memos[idx-1].memo_text;
            self.vue.memos[idx-1].is_being_edited = true;               //Sets the UI to to be edited
            //console.log(self.vue.memos[idx-1].is_being_edited);         // Log for debugging
            $("#vue-div").show();
        }
    }


    // Submits the edits to the data base
    self.submit_edit = function(memo_id){
        $.post(edit_memos_url,
            {
                memo_id: memo_id,
                title: self.vue.form_edit_title,
                memo_text: self.vue.form_edit_text
            },
            // Lambda function to set the memo fields to the edit texts
            function () {
                console.log(memo_id)
                var idx = null;
                for (var i = 0; i < self.vue.memos.length; i++) {
                    if (self.vue.memos[i].id === memo_id) {
                        // If I set this to i, it won't work, as the if below will
                        // return false for items in first position.
                        idx = i + 1;
                        break;
                    }
                }
                if (idx) {
                    self.vue.memos[idx-1].memo_text = self.vue.form_edit_text;
                    self.vue.memos[idx-1].title = self.vue.form_edit_title;
                    self.vue.memos[idx-1].is_being_edited = false;
                }
            }
        )

    }


    // Returns the Edit UI and restores old values
    self.cancel_edit = function(memo_id){
        var idx = null;
        console.log("Cancel Called");
        for (var i = 0; i < self.vue.memos.length; i++) {
            if (self.vue.memos[i].id === memo_id) {
                // If I set this to i, it won't work, as the if below will
                // return false for items in first position.
                idx = i + 1;
                break;
            }
        }
        if (idx) {
            self.vue.memos[idx-1].title = old_title;
            self.vue.memos[idx-1].memo_text = old_text;
            self.vue.form_edit_text = self.vue.memos[idx-1].memo_text;
            self.vue.memos[idx-1].is_being_edited = false;
            $("#vue-div").show();
        }
    }


    // Function to add a memo using the API.py url links
    self.add_memo = function () {
    // The submit button to add a track has been added.
    $.post(add_memos_url,
        {
            title: self.vue.form_title,
            memo_text: self.vue.form_text,
        },
        function (data) {
            $.web2py.enableElement($("#add_track_submit"));
            self.get_memos();
            self.vue.form_text = "";
            self.vue.form_title = "";
            self.vue.memos.unshift(data.mem);
        });
        self.add_memo_button();                 // Restore add button
        $("#vue-div").show();                   // Reload page
    };


    // Deletes a memo from the UI and the database using the Delete function from the api.py link
    self.delete_memo = function(memo_id) {
        $.post(del_memos_url,
            {
                memo_id: memo_id
            },
            function () {
                console.log(memo_id)
                var idx = null;
                for (var i = 0; i < self.vue.memos.length; i++) {
                    if (self.vue.memos[i].id === memo_id) {
                        // If I set this to i, it won't work, as the if below will
                        // return false for items in first position.
                        idx = i + 1;
                        break;
                    }
                }
                if (idx) {
                    self.vue.memos.splice(idx - 1, 1);
                }
            }
        )
    };


    // Switches the memo from private to public and back, both in the data base and in the UI
    self.toggle_memo = function(memo_id){
    $.post(toggle_memos_url,
            {
                memo_id: memo_id
            },
            function () {
                var idx = null;
                for (var i = 0; i < self.vue.memos.length; i++) {
                    if (self.vue.memos[i].id === memo_id) {
                        // If I set this to i, it won't work, as the if below will
                        // return false for items in first position.
                        idx = i +1;
                        break;
                    }
                }
                if (idx) {
                    if(self.vue.memos[idx-1].is_public){
                    self.vue.memos[idx-1].is_public= false;
                    }else{
                        self.vue.memos[idx-1].is_public=true;
                    }
                    console.log("Post TOGGGLE in JS :" + self.vue.memos[idx-1].is_public)
                }
            }
        )
    }


    // Retrieves the Next 10 memos upon user requests
    self.get_more = function(){
        var num_memos = self.vue.memos.length
        $.getJSON(get_memos_url(num_memos,num_memos + 10), function (data){
            self.vue.has_more = data.has_more;
            self.extend(self.vue.memos, data.memos);
        });
    }


    // Retrieves a Query of memos
    self.get_memos = function (){
        $.getJSON(get_memos_url(0,10), function(data){
            self.vue.memos = data.memos;
            self.vue.logged_in = data.logged_in;
            self.vue.has_more = data.has_more;
        });
    }


    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_text: null,
            form_title: null,
            form_edit_text: null,
            form_edit_title: null,
            old_text: '',
            olt_title: '',
            memos: [],
            logged_in: false,
            is_adding_memo: false,
            has_more: false
        },
        methods: {
            add_memo_button: self.add_memo_button,
            get_more: self.get_more,
            get_memos: self.get_memos,
            add_memo: self.add_memo,
            delete_memo: self.delete_memo,
            toggle_memo: self.toggle_memo,
            edit_memos: self.edit_memos,
            submit_edit: self.submit_edit,
            cancel_edit: self.cancel_edit
        }

    });

    self.get_memos();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
