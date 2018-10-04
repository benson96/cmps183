# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.


import datetime

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)

db.define_table('user_images',
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id),
                Field('image_url'),
                Field('price', 'float') 
                )


db.define_table('customer_order',
                Field('order_date', default=datetime.datetime.utcnow()),
                Field('customer_info', 'blob'),
                Field('transaction_token', 'blob'),
                Field('cart', 'blob')
)

# Let's define a secret key for stripe transactions.
from gluon.utils import web2py_uuid
if session.hmac_key is None:
    session.hmac_key = web2py_uuid()