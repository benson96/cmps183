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
    return dict()

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

def getSelf():
    logged_in = auth.user is not None
    user = None;
    if(logged_in):
        user = dict(
            id = auth.user.id,
            first = auth.user.first_name,
            last = auth.user.last_name
        )

    return response.json(dict(
        user=user,
        logged_in = logged_in
    ))

def getImages():
    images = []
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    who = request.vars.who
    list = db(db.user_images.created_by == who).select(limitby=(start_idx,end_idx+1),orderby=~db.user_images.created_on)
    for i, r in enumerate(list):
        if i < end_idx - start_idx:
            t = dict(
                image_src = r.image_url,
                price = r.price,
                id = r.id,
                created_by = r.created_by
            )
            images.append(t)
    return response.json(dict(
        images=images
    ))

def getUsers():
    users = []
    list  = db().select(db.auth_user.ALL)
    for i, r in enumerate(list):
        t = dict(
                first = r.first_name,
                last = r.last_name,
                id = r.id,
            )
        users.append(t)
    return response.json(dict(
        users=users
    ))


@auth.requires_signature()
@auth.requires_login()
def AddImage():
    id = db.user_images.insert(
        created_by = auth.user,
        image_url = request.vars.url,
        price = request.vars.price
    )
    post = db.user_images(id)
    new = dict(
        created_by = auth.user,
        image_src = request.vars.img,
        price = request.vars.price
    )
    return response.json(dict(new=new))

def Set():
    q = ((db.user_images.created_by == auth.user) &
    (db.user_images.id == request.vars.id))
    CurrentPost=db(q).select().first()
    CurrentPost.update_record(price=request.vars.price)
    #redirect(URL('default', 'index'))
    return "ok"

def purchase():

    import stripe
    # Your secret key.
    stripe.api_key = myconf.get('stripe.private_key')
    try:
        # Creates the charge.
        token = json.loads(request.vars.transaction_token)
        amount = float(request.vars.amount)
        charge = stripe.Charge.create(
            amount=int(amount * 100),
            currency="usd",
            source=token['id'],
            description="Purchase",
        )
    except:
        logger.info("The card has been declined.")
        return "nok"
    return "ok"
