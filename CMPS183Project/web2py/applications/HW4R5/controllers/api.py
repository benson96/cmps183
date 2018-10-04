import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

@auth.requires_signature()
def login_state():
    return response.json(dict(
        logged_in=(auth.user != None)
    ))

@auth.requires_signature()
def get_users():
    me = db(db.auth_user.id == auth.user.id).select()
    users = db(db.auth_user.id != auth.user.id).select()
    return response.json(dict(
        me=me,
        users=users
    ))

@auth.requires_signature()
def get_images():
    images = db(db.images.user_id == request.vars.id).select()
    return response.json(dict(
        images=images
    ))

@auth.requires_signature()
def add_image():
    m_id = db.images.insert(
        user_id=request.vars.id,
        get_url=request.vars.get_url
    )
    m = db.images(m_id)
    return response.json(dict(image=m))
