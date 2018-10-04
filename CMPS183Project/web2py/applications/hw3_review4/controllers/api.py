# These are the controllers for your ajax api.


def get_checklists():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    # We just generate a lot of of data.
    checklists = []
    has_more = False

    rows = db().select(db.checklist.ALL, orderby=~db.checklist.updated_on, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        # print r
        if i < end_idx - start_idx:
            t = dict(
                id=r.id,
                user_email=r.user_email,
                title=r.title,
                memo=r.memo,
                updated_on=r.updated_on,
                is_public=r.is_public,
            )
            checklists.append(t)
        else:
            has_more = True
    logged_in = auth.user_id is not None
    return response.json(dict(
        checklists=checklists,
        logged_in=logged_in,
        has_more=has_more,
    ))


@auth.requires_signature()
def add_checklist():
    user_email = auth.user.email or None
    p_id = db.checklist.insert(memo=request.vars.memo, title=request.vars.title)
    p = db.checklist(p_id)
    checklist = dict(
        id=p.id,
        user_email=p.user_email,
        title=p.title,
        memo=p.memo,
        updated_on=p.updated_on,
        is_public=p.is_public,
    )
    print p
    return response.json(dict(checklist=checklist))


@auth.requires_signature()
def edit_checklist():
    checklist = db(db.checklist.id == request.vars.id).select().first()
    checklist.update_record(memo=request.vars.memo)
    checklist.update_record(title=request.vars.title)
    print checklist
    return dict()


@auth.requires_signature()
def del_checklist():
    db(db.checklist.id == request.vars.checklist_id).delete()
    return "ok"

@auth.requires_signature()
def toggle_public():
    checklist = db(db.checklist.id == request.vars.id).select().first()
    if checklist.is_public is False:
        checklist.update_record(is_public=True)
    else:
        checklist.update_record(is_public=False)
