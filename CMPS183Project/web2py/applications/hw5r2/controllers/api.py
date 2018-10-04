import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

@auth.requires_login()
def get_images():
    user_email = request.vars.user_email
    rows = db((db.user_images.user_email == user_email)).select(db.user_images.ALL) 
    
    user_images = []
    for i, r in enumerate(rows):
        user_image = dict(
            image_url = r.image_url,
            user_email = r.user_email,
            created_on = r.created_on,
            created_by = r.created_by,
            price = r.price,
            in_cart = r.in_cart,
            id = r.id,
        )
        user_images.append(user_image)
        
    return response.json(dict(user_images=user_images,
    ))

    
    
    
@auth.requires_login()
def get_user_list():
    logged_in = auth.user_id is not None

    if logged_in:
        auth_email = auth.user.email
        
    user_list = [] 
    for r in db(db.auth_user.id > 0).select():
        user = dict(
            email = r.email,
            first_name = r.first_name,
            last_name = r.last_name,
        )
        user_list.append(user)
        
    return response.json(dict(user_list=user_list, logged_in = logged_in
    ))

@auth.requires_signature()
def set_price():
    rows = db().select(db.user_images.ALL) 
    return dict()
    
    
def get_user_images():
    rows = db().select(db.user_images.ALL) 
    
    user_images = []
    for i, r in enumerate(rows):
            user_image = dict(
                image_url = r.image_url,
                user_email = r.user_email,
                created_on = r.created_on,
                created_by = r.created_by,
                price = r.price,
                in_cart = r.in_cart,
                id = r.id,
            )
            user_images.append(user_image)
            
    return response.json(dict(user_images=user_images,
    ))

@auth.requires_login()
@auth.requires_signature()
def add_image():
    image_id = db.user_images.insert(
        image_url = request.vars.image_url,
        price = request.vars.price,
    )
    
    #taken from piazza
    im = db.user_images(image_id)
    user_images = dict(
        id=image_id,
        image_url=request.vars.image_url
    )

    return response.json(dict(user_images=user_images
    ))

def toggle_cart():
    user_image = db(db.user_images.id == request.vars.image_id).select().first()
    user_image.update_record(in_cart = request.vars.in_cart)
    return dict()
