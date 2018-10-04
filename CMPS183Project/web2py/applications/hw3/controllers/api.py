# Here go your api methods.

def get_memo():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    memos = []
    has_more = False
    rows = db().select(db.checklist.ALL, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            t = dict(
                id = r.id,
                title = r.title,
                memo = r.memo,
                is_editing = r.is_editing,
                is_public = r.is_public,
                user_email = r.user_email,
            )
            memos.append(t)
        else:
            has_more = True
    if auth.user is not None:
    	email = auth.user.email
    else:
    	email = ''
    logged_in = auth.user is not None 
    return response.json(dict(
        memos=memos,
        has_more=has_more,
        user_email=email,
    ))


@auth.requires_signature()
def add_memo():
    """Received the metadata for a new track."""
    # Inserts the track information.
    t_id = db.checklist.insert(
        title = request.vars.title,
        memo = request.vars.memo
    )
    # Then, updates the uploaded track to point to this track.
    # db(db.track_data.id == request.vars.insertion_id).update(track_id=t_id)
    # db(db.track_data.id == request.vars.insertion_id).update(track_id=t_id)
    # Returns the track info.  Building the dict should likely be done in
    # a shared function, but oh well.
    return response.json(dict(memo=dict(
        id = t_id,
        title = request.vars.title,
        memo = request.vars.memo,
    )))


@auth.requires_signature()
def edit_memo():
    """Received the metadata for a new track."""
    # Inserts the track information.
    db(db.checklist.id == request.vars.memo_id).select().first().update_record(
        title = request.vars.title,
        memo = request.vars.memo
    )
    return "ok"


@auth.requires_signature()
def toggle_edit_status():
    if db(db.checklist.id == request.vars.memo_id).select().first().is_editing == False:
        db(db.checklist.id == request.vars.memo_id).select().first().update_record(
            is_editing = True
        )
    else:
        db(db.checklist.id == request.vars.memo_id).select().first().update_record(
            is_editing = False
        )
    return "ok"


@auth.requires_signature()
def toggle_public():
    if db(db.checklist.id == request.vars.memo_id).select().first().is_public == False:
        db(db.checklist.id == request.vars.memo_id).select().first().update_record(
            is_public = True
        )
    else:
        db(db.checklist.id == request.vars.memo_id).select().first().update_record(
            is_public = False
        )
    return "ok"


@auth.requires_signature()
def delete_memo():
    "Deletes a track from the table"
    db(db.checklist.id == request.vars.memo_id).delete()
    # The next line is likely useless, as this is taken care by SQL deletion cascading.
    return "ok"
