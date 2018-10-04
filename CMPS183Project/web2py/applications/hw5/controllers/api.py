import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

def add_image():
	print 'add_image'
	m_id = db.user_images.insert(
		image_url = request.vars.image_url,
		price = request.vars.price
	)
	q = (db.user_images.id == m_id)
	rows = db(q).select()
	obj = rows.first()
	return response.json(dict(image=dict(
		id = m_id,
		user_email = obj.user_email,
		created_by = obj.created_by,
		created_on = obj.created_on,
		image_url = obj.image_url,
		price = obj.price
	)))

def get_user_images():
	print 'get_user_images'
	# q = (db.user_images.created_by == request.get_vars.id)
	rows = db(db.user_images).select(orderby=~db.user_images.created_on)
	img_list = []
	for i, r in enumerate(rows):
		t = dict(
			id = r.id,
			user_email = r.user_email,
			created_by = r.created_by,
			created_on = r.created_on,
			image_url = r.image_url,
			price = r.price
		)
		img_list.append(t)
	return response.json(dict(img_list=img_list))

def update_image():
	print 'update_image'
	q = (db.user_images.id == request.vars.id)
	rows = db(q).update(price=request.vars.price)
	return

def purchase():
	"""Ajax function called when a customer orders and pays for the cart."""
	# Creates the charge.
	import stripe
	print 'a'
	# Your secret key.
	stripe.api_key = 'sk_test_vzXz03VzvvyXeCNeoGHfVZ3C'
	print 'b'
	token = request.vars.transaction_token
	print 'c'
	amount = float(request.vars.amount)
	print 'd'
	try:
		charge = stripe.Charge.create(
			amount=int(amount * 100),
			currency="usd",
			source=token,
			description="Purchase",
		)
	except stripe.error.CardError as e:
		logger.info("The card has been declined.")
		logger.info("%r" % traceback.format_exc())
		return response.json(dict(result="nok"))
	return response.json(dict(result="nok"))
