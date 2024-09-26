import os
import sqlite3

import flask
import pydub
import speech_recognition as sr
from pydub.exceptions import CouldntDecodeError
from speech_recognition import UnknownValueError

from TM import model, config

app = flask.Flask(__name__)

path = r'.\resources'
allowed_files = []

for root, _, files in os.walk(path):
    root = root.split(os.path.sep)[3:]
    for file in files:
        allowed_files.append(os.path.join(*root, file).replace("\\", "/"))

print(allowed_files)

DB_PATH = "./resources/data/db.db"

should_setup = False
should_rebuild_audio = False
should_retrain = False
if should_setup:  # Set to false after first run to remove the necessity of another configuration
    config.setup(DB_PATH, hard=True, rebuild_audio=should_rebuild_audio)

AI_MODEL = model.build_model(DB_PATH, hard=should_retrain)

TEMP_FILE_COUNT = 0


def query_db(query, args=(), one=False):
    cur = sqlite3.connect(DB_PATH).cursor()
    cur.execute(query, args)
    r = [dict((cur.description[i][0], value)
              for i, value in enumerate(row)) for row in cur.fetchall()]
    cur.connection.close()
    return (r[0] if r else None) if one else r


@app.route("/resources/<scope>/<path:name>")
def res(scope, name):
    try:
        if scope not in ["css", "js", "image", "audio"] or name not in allowed_files:
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
        if scope == "audio":
            content_type = "audio/mpeg"
        r = flask.Response(data, 200)
        r.headers["Content-Type"] = "; ".join([content_type, "charset=utf-8"])
        return r
    except Exception:
        return flask.abort(403)


@app.route("/")
@app.route("/index.html")
def index():
    return flask.render_template("index.html")


@app.route("/about.html")
def about():
    return flask.render_template("about.html")


@app.route("/choose_gender.html")
def choose_gender():
    return flask.render_template("choose_gender.html")


@app.route("/choose_theme.html")
def choose_theme():
    return flask.render_template("choose_theme.html")


@app.route("/translation.html")
def translation():
    return flask.render_template("translation.html")


@app.route("/choose_picto.html")
def choose_picto():
    return flask.render_template("choose_picto.html")


@app.route("/api/languages/supported")
def supported_languages():
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM languages")
        return [dict(zip(["id", "name", "code", "resources.flag"], x)) for x in cursor.fetchall()]
    finally:
        conn.close()


@app.route("/api/languages/query")
def query_languages():
    q = flask.request.args.get("q")
    print(q)
    if not (lang := query_db("SELECT * FROM languages WHERE code = ?", (q,), one=True)):
        return flask.abort(400)
    return lang


@app.route("/api/themes/")
def themes():
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM themes")
        return [dict(zip(["id", "name", "resources.audio", "resources.image"], x)) for x in cursor.fetchall()]
    finally:
        conn.close()


@app.route("/api/themes/query")
def query_themes():
    q = flask.request.args.get("id")
    print(q)
    if not (theme := query_db("SELECT * FROM themes WHERE id = ?", (q,), one=True)):
        return flask.abort(400)
    return theme


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
                lang := query_db("SELECT code FROM languages WHERE name = ?", (language,), one=True)):
            return flask.abort(400)

        conn.execute("INSERT INTO students(name, gender, language) VALUES (?, ?, ?)", (name, gender, lang["code"]))
        conn.commit()
        conn.close()
        return flask.redirect("/index.html#students")


@app.route("/api/sentences")
def get_sentences():
    q = flask.request.args.get("q")
    theme = flask.request.args.get("theme")
    if not q:
        return query_db(
            "SELECT * FROM source_sentences" if not theme else "SELECT * FROM source_sentences WHERE theme_id = ?",
            (theme,))
    type_ = flask.request.args.get("type")
    if not type_ or not theme:
        return flask.abort(400)
    results = {}
    for i in query_db("SELECT source_id FROM sentences_variations WHERE literal LIKE ?", (f"%{q}%",)):
        i = i["source_id"]
        if i in results:
            results[i][0] += 1
        else:
            if r := query_db("SELECT * FROM source_sentences WHERE s_type=? AND theme_id=? AND id=?",
                             (type_, theme, int(i)),
                             one=True):
                results[i] = [1, r]
    return [x[1][1] for x in sorted(results.items(), key=lambda x: x[0])]


@app.route("/api/recognize", methods=["POST"])
def recognize():
    audio = flask.request.files["audio"]
    if not audio:
        return flask.abort(400)
    audio.save("./resources/temp/audio.ogg")
    try:
        pydub.AudioSegment.from_file("./resources/temp/audio.ogg").export('./resources/temp/audio.wav', format="wav")
    except CouldntDecodeError:
        return flask.abort(400)
    r = sr.Recognizer()
    with sr.AudioFile("./resources/temp/audio.wav") as source:
        data = r.record(source)
    try:
        result = model.predict(DB_PATH, AI_MODEL, r.recognize_google(data, language="fr-FR"))
    except UnknownValueError:
        return flask.abort(400)

    # Free up the space
    audio.close()
    os.remove("./resources/temp/audio.ogg")
    os.remove("./resources/temp/audio.wav")

    return result


@app.route("/api/translate", methods=["POST"])
def translate():
    id_ = flask.request.args.get("id")
    target = flask.request.args.get("target")
    if not id_ or not target:
        return flask.abort(400)
    json_res = query_db("SELECT * FROM translations WHERE source_id=? AND target_id=?", (id_, target),
                        one=True) or flask.abort(400)
    json_res["s_type"] = query_db("SELECT s_type FROM source_sentences WHERE id=?", (id_,), one=True)["s_type"]
    return json_res


app.run()
