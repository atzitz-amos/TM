import json
import os
import sqlite3

import flask
import pydub
import speech_recognition as sr

from project import model

app = flask.Flask(__name__)

path = r'./resources'
allowed_files = []

for root, _, files in os.walk(path):
    for file in files:
        allowed_files.append(file)

print(allowed_files)

CONFIG_JSON = json.load(open("./resources/data/config.json", "r"))
DB_PATH = "./resources/data/db.db"
base_conn = sqlite3.connect(DB_PATH)
base_conn.execute("""CREATE TABLE IF NOT EXISTS students(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    language TEXT NOT NULL
)""")
base_conn.commit()
base_conn.close()

TEMP_FILE_COUNT = 0


def query_db(query, args=(), one=False):
    cur = sqlite3.connect(DB_PATH).cursor()
    cur.execute(query, args)
    r = [dict((cur.description[i][0], value) \
              for i, value in enumerate(row)) for row in cur.fetchall()]
    cur.connection.close()
    return (r[0] if r else None) if one else r


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


@app.route("/api/languages/supported")
def supported_languages():
    return CONFIG_JSON["config.supportedLanguages"]


@app.route("/api/themes/")
def themes():
    return CONFIG_JSON["config.themes"]


@app.route("/api/students", methods=["GET", "POST"])
def students():
    conn = sqlite3.connect(DB_PATH)
    if flask.request.method == "GET":
        return query_db("SELECT * FROM students")
    elif flask.request.method == "POST":
        name = flask.request.form.get("name")
        gender = flask.request.form.get("gender")
        language = flask.request.form.get("language")

        if not name or gender not in ("M", "F") or not (
                lang := next(x for x in CONFIG_JSON["config.supportedLanguages"] if x["name"] == language)):
            return flask.abort(400)

        print(name, gender, lang)
        conn.execute("INSERT INTO students(name, gender, language) VALUES (?, ?, ?)", (name, gender, lang["code"]))
        conn.commit()
        conn.close()
        return flask.redirect("/index.html#students")


@app.route("/api/recognize", methods=["POST"])
def recognize():
    audio = flask.request.files["audio"]
    if not audio:
        return flask.abort(400)
    audio.save("./resources/temp/audio.ogg")
    pydub.AudioSegment.from_file("./resources/temp/audio.ogg").export('./resources/temp/audio.wav', format="wav")
    r = sr.Recognizer()
    with sr.AudioFile("./resources/temp/audio.wav") as source:
        data = r.record(source)
    result = model.predict(r.recognize_google(data, language="fr-FR"))

    # Free up the space
    audio.close()
    os.remove("./resources/temp/audio.ogg")
    os.remove("./resources/temp/audio.wav")

    return result


app.run(host="0.0.0.0")
