# Here go your api methods.

import random
import requests


def index():
    pass
	
def get_memos():
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    # We just generate a lot of of data.
    memos = []
    has_more = False
    rows = db().select(db.checklist.ALL, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            m = dict(
				id=r.id,
				title=r.title,
				memo=r.memo,
                editing=r.editing,
                is_public=r.is_public,
                user_email=r.user_email
            )

            memos.append(m)
        else:
            has_more = True

    logged_in = auth.user_id is not None
    if logged_in:
        current_login = auth.user.email
    else:
        current_login = "not_an_email"
    return response.json(dict(
        memos=memos,
        logged_in=logged_in,
        has_more=has_more,
        current_login=current_login
    ))
	
@auth.requires_signature()
def add_memo():
    m_id = db.checklist.insert(
        title=request.vars.title,
        memo=request.vars.memo
    )
    m = db.checklist(m_id)
    return response.json(dict(checklist=m))
	
@auth.requires_signature()
def del_memo():
    db(db.checklist.id == request.vars.memo_id).delete()
    return "ok"
    
@auth.requires_signature()

def edit():
    #logger.info("The user has set a new value: %r" % request.vars.my_string)
    #logger.info("editing?: %r" % request.vars.editing)
    #m_id = db(db.checklist.id == request.vars.memo_id)
    #logger.info("The user has set a new value: %r" % m_id)
    #m_id.update_record(memo=request.vars.memo)
    #temp = m_id.editing
    #m_id.update_record(editing=not temp)
    if request.vars.memo_id is not None:
        q = (db.checklist.id == request.vars.memo_id)
        tf = db(q).select().first()
        tf.update_record(title = request.vars.title)
        tf.update_record(memo = request.vars.memo)
    return "ok"
    
@auth.requires_signature()	
def toggle_public():
    if request.vars.memo_id is not None:
        q = (db.checklist.id == request.vars.memo_id)
        tf = db(q).select().first()
        value = tf.is_public
        tf.update_record(is_public = not value)
    return "ok"

