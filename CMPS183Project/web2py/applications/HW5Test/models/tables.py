import datetime

def get_user_email():
    return auth.user.email if auth.user else None

db.define_table('user_images',
                Field('user_email', default = get_user_email()),
                Field('created_on', 'datetime', default = request.now),
                Field('created_by', 'reference auth_user', default = auth.user_id),
                Field('image_url'),
                Field('price', 'float', default = 0),
                )

db.user_images.image_url.writable = True
db.user_images.image_url.readable = True
