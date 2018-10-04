import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

# @auth.requires_login()
def get_user_images():
    print ("arrived in python")
    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0    
    
    user_images = []
    has_more = False

    if auth.user is not None:
        rows = db(db.user_images.created_by == request.vars.created_by).select(db.user_images.image_url, orderby=~db.user_images.created_on, limitby=(start_idx, end_idx+1))
    
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            user_images.append(r)
        else:
            has_more = True

    print (str(user_images))
    print (str(len(user_images)))    
    return response.json(dict(
        user_images = user_images,
        has_more = has_more
    ))


# @auth.requires_login()
def upload_image():
    print ("Received url: " + request.vars.image_url)
    db.user_images.insert(
        image_url = request.vars.image_url
    )

    return "ok"
        # return response.json(dict(user_images=dict(
        #     image_url = request.vars.image_url
        # )))

def get_users():
    users = []
    # print ("auth.user.id = " + auth.user.id)
    if auth.user:
        print ("auth.user.id is not None")
        rows = db(db.auth_user.id != auth.user.id).select()

        for r in rows:
        
            d = dict(
                first_name = r.first_name,
                last_name = r.last_name,
                email = r.email,
                id = r.id
            )

            print (str(d))
            users.append(d)

        print (len(users))


        return response.json(dict(
            users = users
        ))
    else:
        print ("auth.user.id is None")
        return response.json("ok")
    