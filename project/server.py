import os

import flask

app = flask.Flask(__name__)

path = r'./resources'
allowed_files = []

for root, _, files in os.walk(path):
    for file in files:
        allowed_files.append(file)

print(allowed_files)


@app.route("/resources/<scope>/<name>")
def res(scope, name):
    try:
        if scope not in ["css", "js", "image"] or name not in allowed_files:
            return flask.abort(403)
        with open(f"{path}/{scope}/{name}", "r", encoding="utf-8") as o:
            try:
                data = o.read()
            except UnicodeDecodeError:
                with open(f"{path}/{scope}/{name}", "rb") as ob:
                    data = ob.read()

        content_type = "text/" + scope
        if scope == "js":
            content_type = "text/javascript"
        r = flask.Response(data, 200)
        r.headers["Content-Type"] = "; ".join([content_type, "charset=utf-8"])
        return r
    except Exception:
        return flask.abort(403)


@app.route("/")
@app.route("/index.html")
def index():
    return flask.render_template("index.html")


@app.route("/choose_gender.html")
def choose_gender():
    return flask.render_template("choose_gender.html")


@app.route("/choose_theme.html")
def choose_theme():
    return flask.render_template("choose_theme.html")


@app.route("/translation.html")
def translation():
    return flask.render_template("translation.html")


app.run(host="0.0.0.0")
