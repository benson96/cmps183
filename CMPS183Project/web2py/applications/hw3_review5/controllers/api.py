# Here go your api methods.

import datetime

#Add a memo
@auth.requires_signature()
def add_memo():
    print("ADD MEMOS")
    """Received the metadata for a new checklist."""
    print("Received metadata: (" + str(request.vars.title) + ", " + str(request.vars.content) + ").")
    # Inserts the checklist information.
    m_id = db.checklist.insert(
        title = request.vars.title,
        memo = request.vars.content,
        is_public = False
    )
    print("m_id: " + str(m_id));
    print("Database holds:\n" + str(db().select(db.checklist.ALL)))
    # Returns the checklist info.  Building the dict should likely be done in
    # a shared function, but oh well.
    return response.json(dict(checklist=dict(
        id = m_id,
        user_email = 'example@example.com',
        title = request.vars.title,
        content = request.vars.content,
        is_public = False,
        last_updated = datetime.datetime.utcnow()
    )))

@auth.requires_login()
def toggle_public():
    db(db.checklist.id == request.vars.memo_id).update(is_public=request.vars.new_value)
    return response.json(dict(
        new_ip=request.vars.new_value,
    ))

@auth.requires_login()
def edit_submit():
    print('Updating id ' + str(request.vars.memo_id) + "(" + request.vars.updated_title + ", " + request.vars.updated_content + ").")

    db(db.checklist.id == request.vars.memo_id).update(title=request.vars.updated_title)
    db(db.checklist.id == request.vars.memo_id).update(memo=request.vars.updated_content)

    return response.json(dict(
        updated_id=request.vars.memo_id,
    ))


def get_memos():
    print("GET MEMOS")
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    memos = []
    has_more = False
    rows = None

    if auth.user is not None:
        rows = db((auth.user.email == db.checklist.user_email) | (db.checklist.is_public == True)).select(db.checklist.ALL, limitby=(start_idx, end_idx + 1))
    else:
        rows = db(db.checklist.is_public == True).select(db.checklist.ALL, limitby=(start_idx, end_idx + 1))

    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            t = dict(
                id = r.id,
                owner_email = r.user_email,
                title = r.title,
                memo = r.memo,
                is_public = r.is_public,
                is_editing = False,
                update_on = r.updated_on,
            )
            print("Appending (" + r.title + ", " + r.memo + ").")
            memos.append(t)
        else:
            has_more = True

    logged_in_user = ''
    if auth.user is not None:
        logged_in_user = str(auth.user.email)
    return response.json(dict(
        memos=memos,
        logged_in_user=logged_in_user,
        has_more=has_more,
    ))

#deletes a memo
@auth.requires_login()
def delete_memo():
    "Deletes a memo from the table"
    db(db.checklist.id == request.vars.memo_id).delete()
    return "ok"#deletes a memo#deletes a memo

