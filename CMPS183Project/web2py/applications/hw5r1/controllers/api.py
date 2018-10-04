import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
@auth.requires_login()
@auth.requires_signature()
def add_image():
    image_id = db.user_images.insert(
        image_url = request.vars.image_url,
        price = request.vars.price,
    )
    image = db.user_images(image_id)
    return response.json(dict(
        image = image
    ))

@auth.requires_login()
@auth.requires_signature()
def get_user_images():
    user_id = request.vars.id
    images = []
    for r in db(db.user_images.created_by == user_id).select():
        t = dict(
            id = r.id,
            created_on = r.created_on,
            created_by = r.created_by,
            image_url = r.image_url,
            price = r.price,
        )
        images.append(t)

    return response.json(dict(
        images = images
    ))

@auth.requires_login()
@auth.requires_signature()
def set_price():
    image_id = request.vars.image_id
    price = float(request.vars.price)
    db(db.user_images.id == image_id).update(price = price)
    return response.json(200)

def purchase():
    """Ajax function called when a customer orders and pays for the cart."""
    if not URL.verify(request, hmac_key=session.hmac_key):
        raise HTTP(500)
    # Creates the charge.
    import stripe
    import json
    # Your secret key.
    stripe.api_key = myconf.get('stripe.private_key')
    token = json.loads(request.vars.transaction_token)
    amount = float(request.vars.amount)
    try:
        charge = stripe.Charge.create(
            amount=int(amount * 100),
            currency="usd",
            source=token['id'],
            description="Purchase",
        )
    except stripe.error.CardError as e:
        logger.info("The card has been declined.")
        logger.info("%r" % traceback.format_exc())
        return "nok"
    return "ok"

@auth.requires_login()
@auth.requires_signature()
def get_users():
    users = []
    current_user = None
    for r in db(db.auth_user).select():
        t = dict(
            id = r.id,
            first_name = r.first_name,
            last_name = r.last_name,
            email = r.email,
        )
        if auth.user.id == r.id:
            current_user = t
        else:
            users.append(t)

    users.insert(0, current_user)
    return response.json(dict(
        users = users
    ))
