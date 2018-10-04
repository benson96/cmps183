# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

# -------------------------------------------------------------------------
# This is a sample controller
# - index is the default action of any application
# - user is required for authentication and authorization
# - download is for downloading files uploaded in the db (does streaming)
# -------------------------------------------------------------------------
import json

def index():
    """This is the home page."""
    if auth.user is not None:
        email = auth.user.email
        logged_in = 'true'
    else:
        email = ''
        logged_in = 'false'

    user_list = []
    rows = db(db.auth_user).select()
    for i, r in enumerate(rows):
        t = dict(
            id = r.id,
            first_name = r.first_name,
            last_name = r.last_name,
            email = r.email
        )
        user_list.append(t)

    user_list_json = json.dumps(user_list, separators=(',',':'))
    print(user_list_json)
    return dict(logged_in=logged_in, email=email, user_id=auth.user_id, user_list_json=user_list_json)

def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/retrieve_password
    http://..../[app]/default/user/change_password
    http://..../[app]/default/user/bulk_register
    use @auth.requires_login()
        @auth.requires_membership('group name')
        @auth.requires_permission('read','table name',record_id)
    to decorate functions that need access control
    also notice there is http://..../[app]/appadmin/manage/auth to allow administrator to manage users
    """
    return dict(form=auth())


@cache.action()
def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


def call():
    """
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    """
    return service()
