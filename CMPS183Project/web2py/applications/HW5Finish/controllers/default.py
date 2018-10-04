
import json

def index():
    """This is the home page."""
    if auth.user is not None:
        email = auth.user.email
        logged_in = 'true'
    else:
        email = ''
        logged_in = 'false'

    user_list = []
    rows = db(db.auth_user).select()
    for i, r in enumerate(rows):
        t = dict(
            id = r.id,
            first_name = r.first_name,
            last_name = r.last_name,
            email = r.email
        )
        user_list.append(t)

    user_list_json = json.dumps(user_list, separators=(',',':'))
    print(user_list_json)
    return dict(logged_in=logged_in, email=email, user_id=auth.user_id, user_list_json=user_list_json)

def user():

    return dict(form=auth())


@cache.action()
def download():

    return response.download(request, db)


def call():

    return service()

