from bottle import get, route, run, template, view, static_file

@get('/index')
def index():
    return "Welcome to CMPS 183!"

@get('/greet/<name>')
def greet(name):
    return template('greet_template', name=name)

@view('greet_template')
@get('/sayhi/<name>')
def greet(Andrew):
    return dict(name=name)

# Our cat web page
@get('/cats')
def cats():
    return template('cats_template')

# Let's add some code to serve jpg images from our static images directory.
@route('/images/<filename:re:.*\.jpg>')
def serve_image(filename):
    return static_file(filename, root='images', mimetype='image/jpg')

@route('/images/<filename:re:.*\.png>')
def serve_image(filename):
    return static_file(filename, root='images', mimetype='image/png')

# Code for serving css stylesheets from /css directory.
@route('/css/<filename:re:.*.css>')
def serve_css(filename):
    return static_file(filename, root='css', mimetype='text/css')

@route('/')
def news():
	return static_file('news.html', root='html', mimetype='text/html')


run(reloader=True, host='localhost', port=8060)