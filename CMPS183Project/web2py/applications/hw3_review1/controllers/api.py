# Here go your api methods.


# Code to retrieve the first 10 items in the data base
def get_memos():
    """
    Code to get a defined number of memos from the memo data base, and
    to transfer the memos to the UI structure
    :return:
    """
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    memos = []
    has_more = False

    # Selects the public memos if there is no user logged on, public + users memos if else
    if(auth.user == None):
        rows = db((db.checklist.is_public=='True')).select()
    else:
        rows = db((db.checklist.is_public == 'True') | (db.checklist.user_email == auth.user.email)).select()

    # Transfers the Memo data base to the vue.js
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:

            # Checks to see if the user who is logged on made the memo
            made_by_user = False
            if(auth.user != None):
                if(auth.user.email == r.user_email):
                    made_by_user = True

            t = dict(
                id=r.id,
                memo_text=r.memo_text,
                title=r.title,
                is_public=r.is_public,
                email=r.user_email,
                made_by_user=made_by_user,
                is_being_edited=False

            )
            memos.append(t)
        else:
            has_more = True
    # Updates the logged in values
    logged_in = auth.user is not None
    return response.json(dict(

        memos=memos,
        logged_in=logged_in,
        has_more=has_more,
    ))


@auth.requires_login()
@auth.requires_signature()
def add_memos():
    """
    Method to add a single memo to the data base
    :return: Json storage of a dictionary with the memo stored values in the data base
    """

    # Generate a new db entry corisponding to the new memo
    t_id = db.checklist.insert(
        title = request.vars.title,
        memo_text = request.vars.memo_text,
        is_public = False
    )
    t = db.checklist(t_id)
    print(t)
    return response.json(dict(mem=t))


@auth.requires_login()
@auth.requires_signature()
def del_memos():
    """
    Method to delete memos from the data base using a simple query
    :return:
    """
    print(request.vars.memo_id)
    db(db.checklist.id == request.vars.memo_id).delete()
    return "ok"


@auth.requires_login()
@auth.requires_signature()
def tog_memos():
    """
    Method to switch the is public value to relate to the public feild of the memos
    :return:
    """
    myset = db(db.checklist.id == request.vars.memo_id).select()
    if(myset[0].is_public):
        db(db.checklist.id == request.vars.memo_id).update(is_public='False')
    else:
        db(db.checklist.id == request.vars.memo_id).update(is_public='True')
    myset = db(db.checklist.id == request.vars.memo_id).select()        # Sets the new value to the opposite of the old value
    print(myset[0])
    return "toggled"


@auth.requires_login()
@auth.requires_signature()
def edit_memos():
    """
    Method to edit a current memo in the data base
    This just updates the values to the new ones the user wants
    :return:
    """
    myset = db(db.checklist.id == request.vars.memo_id).select()
    db(db.checklist.id == request.vars.memo_id).update(memo_text=request.vars.memo_text)
    db(db.checklist.id == request.vars.memo_id).update(title=request.vars.title)
    myset = db(db.checklist.id == request.vars.memo_id).select()
    print(myset[0])
    return "Edited Memos"