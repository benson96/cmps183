import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

#api methods, here we go

#called by get_user_images(); returns a dict
def get_user_dict(user_id, first_name):
	#rows of the current user's images; this will appear first in the "users" array
	images = db(db.user_images.created_by == user_id).select()

	#array of all images posted by a given user
	#array is empty if no images are posted
	image_arr = []
	if images is not None:
		for i in images:
			#prepend (recent images placed first)
			image_arr.insert(0, i.image_url)

	return dict(
		id=user_id,
		first_name=first_name,
		images=image_arr
	)

#get function
def get_user_images():
	#first our invariant, user shouldn't get anything if not logged in
	if auth.user is None:
		return response.json(dict(
			users=None,
			my_id=None
		))
	#now to define the variables we'll return
	my_id = auth.user.id
	my_name = auth.user.first_name

	
	#an array of dicts; each element represents a user
	#described more fully in default_index.js
	users = []

	#first user is current logged-in user
	users.append(get_user_dict(my_id, my_name))

	#now we query the database for all users who are not current user--
	user_rows = db(db.auth_user.id != my_id).select()
	#--then rinse and repeat
	if user_rows is not None:
		for u in user_rows:
			users.append(get_user_dict(u.id, u.first_name))

	return response.json(dict(
		users=users,
		my_id=my_id
	))

#add function
#who says it has to be complicated?
@auth.requires_signature()
def add_image():
	db.user_images.insert(
		created_by=request.vars.user_id,
		image_url=request.vars.image
	)
	return "ok"