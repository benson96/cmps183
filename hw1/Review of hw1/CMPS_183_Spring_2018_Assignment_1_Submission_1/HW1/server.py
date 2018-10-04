from bottle import route, get, run, template, static_file


@get('/')
def news():
    return template('news')


@route('/images/<filename>')
def server_static(filename):
    return static_file(filename, root='images')


@route('/styles/<filename:re:.*\.css>')
def server_static(filename):
    return static_file(filename, root='styles')


run(host='localhost', port=8080, debug=True)
