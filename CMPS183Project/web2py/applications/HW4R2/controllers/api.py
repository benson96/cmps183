import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

use_literal_word_you_for_profile_name = False

def row_as_image_dictionary(row_from_images_table):
    return dict(
        image_src = row_from_images_table.image_url,
        img_uploader = row_from_images_table.created_by
    )

def get_image_by_id_helper(id):
    return db(db.user_images.id == id).select().first()

@auth.requires_login()
@auth.requires_signature()
def add_image():
    img_url = request.vars.img_url
    if img_url is None:
        raise NotImplementedException
    created_id = db.user_images.insert(
        image_url = img_url
    )
    row = get_image_by_id_helper(created_id)
    return response.json(dict(
        added_image_dict = row_as_image_dictionary(row)
    ))


def get_images():
    request_user_id = request.vars.user_id
    retrieved_image_dict_list = []
    if not request_user_id:
        if auth.user:
            request_user_id = auth.user_id
    if request_user_id:
        #TODO: Check equality here
        rows = db(db.user_images.created_by == request_user_id).select(orderby=~db.user_images.created_on)
        #If necessary, limit using: , limitby=(start_of_range, end_of_range + 1)
        #Enumerate here if necessary
        for row in rows:
            retrieved_image_dict_list.append(row_as_image_dictionary(row))
    my_profile_bool = int(request_user_id) is int(auth.user_id) if auth.user else False
    return response.json(dict(
        image_dict_list = retrieved_image_dict_list,
        user_id = request_user_id,
        my_profile = my_profile_bool
    ))


def row_as_user_dictionary(row_from_auth_table, you=False):
    if you:
        return dict(
            id=row_from_auth_table.id,
            firstname="You",
            lastname=""
        )
    return dict(
        id = row_from_auth_table.id,
        firstname = row_from_auth_table.first_name,
        lastname = row_from_auth_table.last_name
    )
    
def get_site_users():
    users = []
    you = db(db.auth_user.id == auth.user_id).select().first()
    if you:
        users.append(row_as_user_dictionary(you, use_literal_word_you_for_profile_name))
    everyone_else = db(db.auth_user.id != auth.user_id).select(orderby=db.auth_user.last_name)
    #& more than one image under their id
    for user_row in everyone_else:
        users.append(row_as_user_dictionary(user_row))
    return response.json(dict(
        users_dict_list = users
    ))
    