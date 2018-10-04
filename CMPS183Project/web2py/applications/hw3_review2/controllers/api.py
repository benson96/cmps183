# These are the controllers for your ajax api.

#A good portion of these functions come from link and are modified for the assignment
#https://piazza.com/class/jf2geiytvic7ao?cid=301

def get_posts():
    """This controller is used to get the posts.  Follow what we did in lecture 10, to ensure
    that the first time, we get 4 posts max, and each time the "load more" button is pressed,
    we load at most 4 more posts."""
    # Implement me!
    print "Made it to the get posts api"
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    # We just generate a lot of of data.
    posts = []
    has_more = False

    rows = db().select(db.post.ALL, orderby=~db.post.created_on, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        print r
        if i < end_idx - start_idx:
            t = dict(
                id=r.id,
                user_email=r.user_email,
                title=r.title,
                content=r.post_content,
                is_public=r.is_public,
                created_on=r.created_on,
                updated_on=r.updated_on
            )
            print("HERER MAN") 
            print(t)
            print(t['is_public'])
            if(t['is_public'] == True):
                    posts.append(t)
            elif(auth.user_id is not None): 
                if (t['user_email'] == auth.user.email): 
                    posts.append(t)
        else:
            has_more = True
    logged_in = auth.user_id is not None
    return response.json(dict(
        posts=posts,
        logged_in=logged_in,
        has_more=has_more,
    ))


# Note that we need the URL to be signed, as this changes the db.
@auth.requires_signature()
def add_post():
    """Here you get a new post and add it.  Return what you want."""
    # Implement me!
    user_email = auth.user.email or None
    p_id = db.post.insert(post_content=request.vars.content, title=request.vars.content2)
    p = db.post(p_id)
    post = dict(
            id=p.id,
            user_email=p.user_email,
            title=p.title,
            content=p.post_content,
            is_public = p.is_public,
            created_on=p.created_on,
            updated_on=p.updated_on

    )
    #post = db(db.post.id == request.vars.id).select().first()
    #post.update_record(title = request.vars.content2)
    print("ADD_POST") 
    print p
    return response.json(dict(post=post))


@auth.requires_signature()
def edit_post():
    post = db(db.post.id == request.vars.id).select().first()
    post.update_record(post_content = request.vars.post_content, title=request.vars.post_title)
    #post.update_record(post=request.vars.post_content)
    print("editing post") 

    print post
    return dict()

@auth.requires_signature()
def toggle_post():
    print("well i got here, post below")
    post = db(db.post.id == request.vars.id).select().first()
    print post
    if post.is_public is False:
        post.update_record(is_public = True)
    else:
        post.update_record(is_public = False)
    #post.update_record(is_public = not post.is_public)
    print("post2")
    print post
    print ("TOGGLED IS_PUBLIC")
    #redirect(URL('default', 'index'))
    #return response.json(dict(post=post))
    return dict()




@auth.requires_signature()
def del_post():
    """Used to delete a post."""
    # Implement me!
    db(db.post.id == request.vars.post_id).delete()
    return "ok"

