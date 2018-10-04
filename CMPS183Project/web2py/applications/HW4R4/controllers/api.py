import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Saves URL of a newly uploaded image
@auth.requires_login()
@auth.requires_signature()
def set_image_url():
	db.user_images.insert(image_url = request.vars.image_url)
	return HTTP(200)

# Gets images from a user by ID
def get_user_imaes():
	images = db(db.user_images.created_by == int(request.vars.user_id)).select(orderby=~db.user_images.created_on)
	#TO DO: limitby=(start_idx, end_idx + 1),
	return response.json(dict(images = images))

# Gets a list of all the current users
def get_user_list():
	# Don't want to leek user emails or other sensitive information, so only select some fields
	users = db().select(db.auth_user.id, db.auth_user.last_name, db.auth_user.first_name)
	return response.json(dict(users = users))
