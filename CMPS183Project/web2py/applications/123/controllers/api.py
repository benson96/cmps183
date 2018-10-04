import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

def build_picture_url(i):
    return URL('api', 'show_image', vars=dict(picture_id=i), user_signature=True)
    
@auth.requires_signature(hash_vars=False)
def get_pictures():
    print 'get_user_images'

    start_idx = int(request.vars.start_idx) if request.vars.start_idx is not None else 0
    end_idx = int(request.vars.end_idx) if request.vars.end_idx is not None else 0
    pictures = []
    has_more = False
    rows = db().select(db.picture.ALL, limitby=(start_idx, end_idx + 1))
    for i, r in enumerate(rows):
        if i < end_idx - start_idx:
            t = dict(
                id = r.id,
                created_on = r.created_on,
                created_by = r.created_by,
                picture_url =  build_picture_url(r.id),
            )
            pictures.append(t)
        else:
            has_more = True
    logged_in = auth.user is not None
    return get_url.json(dict(
        pictures=pictures,
        logged_in=logged_in,
        has_more=has_more,
    ))
    
@auth.requires_signature()
def get_insertion_id():
    insertion_id = web2py_uuid()
    return get_url.json(dict(
        insertion_id=insertion_id
    ))
    
@auth.requires_signature()
def add_picture():
    """Received the metadata for a new track."""
    # Inserts the track information.
    print 'add_picture'
    t_id = db.picture.insert(
    picture_url=request.vars.picture_url
    )
    q=(db.picture.id==t_id)
    rows=db(q).select()
    obj=rows.first()
    # Then, updates the uploaded track to point to this track.
    # Also, to clean up, remove tracks that do not belong to anyone.
    # Returns the track info.  Building the dict should likely be done in
    # a shared function, but oh well.
    return response.json(dict(picture=dict(
        id = t_id,
        user_email=obj.user_email,
        created_by=obj.created_by,
        created_on=obj.created_on,
        picture_url = obj.picture_url
    )))

@auth.requires_signature()
def show_picture():
    picture_id = int(request.vars.picture_id)
    t = db(db.picture_data.picture_id == track_id).select().first()
    if t is None:
        return HTTP(404)

def upload_picture():
    "Uploads the file related to a track"
    logger.info("_signature: %r", request.vars._signature)
    logger.info("Picture insertion id: %r", request.vars.insertion_id)
    # First, we delete other incomplete uploads.
    db(db.picture_data.picture_id == None).delete()
    logger.info("Uploaded a file of type %r" % request.vars.file.type)
    if not request.vars.file.type.startswith('audio'):
        raise HTTP(500)
    # Inserts the new track.
    insertion_id = db.picture_data.insert(
        picture_id=None, # We don't know it yet.
        original_filename=request.vars.file.filename,
        insertion_id=request.vars.insertion_id,
    )
    return response.json(dict(
        insertion_id=insertion_id
    ))

def cleanup():
    """Removes incomplete uploads."""
    db(db.picture_data.picture_id == None).delete()