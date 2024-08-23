import json
import sqlite3
from xml.etree import ElementTree as ET

from TM.parser import Parser

CONFIG_JSON = json.load(open("resources/data/config/config.json", "r"))
TRANSLATIONS_FILEPATH = "resources/data/config/translations.xml"


def setup_themes(conn):
    themes = CONFIG_JSON["config.themes"]
    conn.executemany(
        "INSERT OR IGNORE INTO themes(id, name, resource_audio_path, resource_image_path) VALUES (?, ?, ?, ?)",
        [(x["id"], x["name"], x["resources.audio"], x["resources.image"]) for x in themes])


def setup_languages(conn):
    languages = CONFIG_JSON["config.supportedLanguages"]
    conn.executemany("INSERT OR IGNORE INTO languages(id, name, code, resource_flag_path) VALUES (?, ?, ?, ?)",
                     [(x["id"], x["name"], x["code"], x["resources.flag"]) for x in languages])


def setup_translations(path):
    conn = sqlite3.connect(path)
    root = ET.parse(TRANSLATIONS_FILEPATH)
    results = []
    for element in root.findall("entry"):
        for value in element.findall("target"):
            results.append(
                (int(element.attrib["source-id"]), value.attrib["lang"], value.text.strip(), value.attrib["resource-audio"]))
    conn.executemany(
        "INSERT OR IGNORE INTO translations(source_id, target_id, literal, resource_audio_path) VALUES (?, ?, ?, ?)",
        results)
    conn.commit()
    conn.close()


def setup(path, hard=False):
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = 1")

    if hard:
        conn.execute("DROP TABLE IF EXISTS translations")
        conn.execute("DROP TABLE IF EXISTS sentences_variations")
        conn.execute("DROP TABLE IF EXISTS source_sentences")
        conn.execute("DROP TABLE IF EXISTS themes")
        conn.execute("DROP TABLE IF EXISTS students")
        conn.execute("DROP TABLE IF EXISTS languages")

    conn.execute("""CREATE TABLE IF NOT EXISTS students(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        language TEXT NOT NULL,
        FOREIGN KEY(language) REFERENCES languages(code)
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS themes(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        resource_audio_path TEXT,
        resource_image_path TEXT
    )""")

    conn.execute("""CREATE TABLE IF NOT EXISTS languages(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        resource_flag_path TEXT
    )""")

    conn.execute("""CREATE TABLE IF NOT EXISTS sentences_variations(
        source_id INTEGER,
        literal TEXT NOT NULL,
        FOREIGN KEY(source_id) REFERENCES source_sentences(id)
            )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS source_sentences(
        id INTEGER PRIMARY KEY UNIQUE,
        theme_id INTEGER,
        s_type INTEGER NOT NULL,
        literal TEXT NOT NULL,
        FOREIGN KEY(theme_id) REFERENCES themes(id)
            )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS translations(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id TEXT NOT NULL,
        literal TEXT NOT NULL,
        resource_audio_path TEXT,
        FOREIGN KEY(source_id) REFERENCES source_sentences(id)
    )""")

    setup_themes(conn)
    setup_languages(conn)

    conn.commit()
    conn.close()

    parser = Parser("resources/data/config/data.xml")
    parser.to_db(db_path=path)

    setup_translations(path)
