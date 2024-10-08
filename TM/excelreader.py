import json
import os
import xml.etree.ElementTree as ET
from collections import defaultdict
from time import time

import openpyxl

LANG_CODES = {
    'ab': 'Abkhaze',
    'aa': 'Afar',
    'af': 'Afrikaans',
    'ak': 'Akan',
    'sq': 'Albanais',
    'am': 'Amharique',
    'ar': 'Arabe',
    'an': 'Aragonais',
    'hy': 'Arménien',
    'as': 'Assamais',
    'av': 'Avar',
    'ae': 'Avestique',
    'ay': 'Aymara',
    'az': 'Azerbaïdjanais',
    'bm': 'Bambara',
    'ba': 'Bachkir',
    'eu': 'Basque',
    'be': 'Biélorusse',
    'bn': 'Bengali',
    'bh': 'Bihari',
    'bi': 'Bichelamar',
    'bs': 'Bosniaque',
    'br': 'Breton',
    'bg': 'Bulgare',
    'my': 'Birman',
    'ca': 'Catalan; Valencien',
    'ch': 'Chamorro',
    'ce': 'Tchétchène',
    'ny': 'Chichewa; Chewa; Nyanja',
    'zh': 'Chinois',
    'cv': 'Tchouvache',
    'kw': 'Cornique',
    'co': 'Corse',
    'cr': 'Cree',
    'hr': 'Croate',
    'cs': 'Tchèque',
    'da': 'Danois',
    'dv': 'Divehi; Maldivien',
    'nl': 'Néerlandais',
    'dz': 'Dzongkha',
    'en': 'Anglais',
    'eo': 'Espéranto',
    'et': 'Estonien',
    'ee': 'Éwé',
    'fo': 'Féroïen',
    'fj': 'Fidjien',
    'fi': 'Finnois',
    'fr': 'Français',
    'ff': 'Peul',
    'gl': 'Galicien',
    'ka': 'Géorgien',
    'de': 'Allemand',
    'el': 'Grec moderne',
    'gn': 'Guarani',
    'gu': 'Gujarati',
    'ht': 'Haïtien',
    'ha': 'Haoussa',
    'he': 'Hébreu (moderne)',
    'hz': 'Herero',
    'hi': 'Hindi',
    'ho': 'Hiri Motu',
    'hu': 'Hongrois',
    'ia': 'Interlingua',
    'id': 'Indonésien',
    'ie': 'Interlingue',
    'ga': 'Irlandais',
    'ig': 'Igbo',
    'ik': 'Inupiaq',
    'io': 'Ido',
    'is': 'Islandais',
    'it': 'Italien',
    'iu': 'Inuktitut',
    'ja': 'Japonais',
    'jv': 'Javanais',
    'kl': 'Kalaallisut',
    'kn': 'Kannada',
    'kr': 'Kanouri',
    'ks': 'Cachemiri',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'ki': 'Kikuyu, Gikuyu',
    'rw': 'Kinyarwanda',
    'ky': 'Kirghiz, Kirghize',
    'kv': 'Komi',
    'kg': 'Kongo',
    'ko': 'Coréen',
    'ku': 'Kurde',
    'kj': 'Kwanyama, Kuanyama',
    'la': 'Latin',
    'lb': 'Luxembourgeois',
    'lg': 'Luganda',
    'li': 'Limbourgeois',
    'ln': 'Lingala',
    'lo': 'Lao',
    'lt': 'Lituanien',
    'lu': 'Luba-Katanga',
    'lv': 'Letton',
    'gv': 'Mannois',
    'mk': 'Macédonien',
    'mg': 'Malgache',
    'ms': 'Malais',
    'ml': 'Malayalam',
    'mt': 'Maltais',
    'mi': 'Maori',
    'mr': 'Marathi (Marāṭhī)',
    'mh': 'Marshallais',
    'mn': 'Mongol',
    'na': 'Nauruan',
    'nv': 'Navajo, Navaho',
    'nb': 'Norvégien Bokmål',
    'nd': 'Ndebele du Nord',
    'ne': 'Népalais',
    'ng': 'Ndonga',
    'nn': 'Norvégien Nynorsk',
    'no': 'Norvégien',
    'ii': 'Nuosu',
    'nr': 'Ndebele du Sud',
    'oc': 'Occitan',
    'oj': 'Ojibwé, Ojibwa',
    'cu': 'Vieux-slave',
    'om': 'Oromo',
    'or': 'Oriya',
    'os': 'Ossète',
    'pa': 'Panjabi, Pendjabi',
    'pi': 'Pali',
    'fa': 'Persan',
    'pl': 'Polonais',
    'ps': 'Pachto, Pushto',
    'pt': 'Portugais',
    'qu': 'Quechua',
    'rm': 'Romanche',
    'rn': 'Kirundi',
    'ro': 'Roumain, Moldave',
    'ru': 'Russe',
    'sa': 'Sanskrit (Saṁskṛta)',
    'sc': 'Sarde',
    'sd': 'Sindhi',
    'se': 'Sami du Nord',
    'sm': 'Samoan',
    'sg': 'Sango',
    'sr': 'Serbe',
    'gd': 'Gaélique écossais',
    'sn': 'Shona',
    'si': 'Singhalais',
    'sk': 'Slovaque',
    'sl': 'Slovène',
    'so': 'Somali',
    'st': 'Sotho du Sud',
    'es': 'Espagnol; Castillan',
    'su': 'Soundanais',
    'sw': 'Swahili',
    'ss': 'Swati',
    'sv': 'Suédois',
    'ta': 'Tamoul',
    'te': 'Télougou',
    'tg': 'Tadjik',
    'th': 'Thaï',
    'ti': 'Tigrigna',
    'bo': 'Tibétain',
    'tk': 'Turkmène',
    'tl': 'Tagalog',
    'tn': 'Tswana',
    'to': 'Tongien',
    'tr': 'Turc',
    'ts': 'Tsonga',
    'tt': 'Tatar',
    'tw': 'Twi',
    'ty': 'Tahitien',
    'ug': 'Ouïghour',
    'uk': 'Ukrainien',
    'ur': 'Ourdou',
    'uz': 'Ouzbek',
    've': 'Venda',
    'vi': 'Vietnamien',
    'vo': 'Volapük',
    'wa': 'Wallon',
    'cy': 'Gallois',
    'wo': 'Wolof',
    'fy': 'Frison occidental',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'za': 'Zhuang, Chuang',
    'zu': 'Zoulou'
}


def read_excel(file_path):
    t = time()

    print("\u001b[38;5;14mReading excel file...")
    wb = openpyxl.load_workbook(open(file_path, "rb"))
    sheet = wb.active

    """ Source """
    print("\u001b[38;5;7mLoading source sentences...")
    table = sheet.tables["source"]
    if not table:
        print("Table 'source' not found in the file", file=sys.stderr)
        sys.exit(1)
    ref = table.ref.split(":")

    if len(sheet[ref[0]:ref[1]][0]) < 5:
        print("Table must have minimum 5 columns: ID, Type, Theme, Question, 1st translation, "
              "[2nd translation ...]", file=sys.stderr)
        sys.exit(1)

    data = {}
    translations_columns = [x.name for x in table.tableColumns[4:]]
    themes = set()
    for row in sheet[ref[0]:ref[1]][1:]:
        data[row[0].value] = [cell.value for cell in row[:4]]
        data[row[0].value].append({k: row[i + 4].value for i, k in enumerate(translations_columns)})
        themes.add(row[2].value)

        if row[1].value not in "QA":
            raise ValueError("Invalid value for Type column. Must be either 'Q' or 'A'")

    print("\u001b[38;5;7mLoaded data from source table:\n\ttarget_languages =", translations_columns, "\n\tthemes =",
          list(themes))
    print("\u001b[38;5;7mFound", len(data), "entries")

    """ Variants """
    table = sheet.tables["variants"]
    if not table:
        return list(themes), data, []

    ref = table.ref.split(":")
    if len(sheet[ref[0]:ref[1]][0]) != 3:
        print("Variants table must have exactly 3 columns: Id, Source sentence, Variant sentence", file=sys.stderr)
        sys.exit(1)
    variants = defaultdict(list)

    for row in sheet[ref[0]:ref[1]][1:]:
        variants[row[0].value].append(row[2].value)

    print("\u001b[38;5;7mLoading of variants complete")
    print("\u001b[38;5;7mFound", len(variants), "variants")

    print("\u001b[38;5;14mExcel file read in", round(time() - t, 2), "seconds")
    return list(themes), translations_columns, data, variants


def _find_data_by_id(tree, id_):
    return None if not (v := tree.findall(f".//config[id='{id_}']/..")) else v[0]


def _find_translation_by_id(tree, id_):
    return None if not (v := tree.findall(f".//entry[@source-id='{id_}']")) else v[0]


def prepare_data_entry(id_, type_, theme, src):
    if type_ == "Q":
        element = ET.Element("question")
    else:
        element = ET.Element("answer")

    config = ET.SubElement(element, "config")
    el_id = ET.SubElement(config, "id")
    el_id.text = str(id_)
    el_theme = ET.SubElement(config, "theme")
    el_theme.text = theme
    el_literal = ET.SubElement(config, "literal")
    el_literal.text = src

    ET.SubElement(element, "source")

    return element


def write_xml(src_path, data, overwrite_data=True, overwrite_translations=True):
    t = time()
    print(
        f"\u001b[38;5;14mWriting data to XML, overwrite-data={overwrite_data}, overwrite-translations={overwrite_translations}...")
    themes, languages, data, variants = data

    tree_data = ET.parse(os.path.join(src_path, "data.xml"))
    tree_translations = ET.parse(os.path.join(src_path, "translations.xml"))

    tree_data_root = tree_data.getroot().find("src")
    tree_translations_root = tree_translations.getroot()

    num_variants_overwritten = 0
    num_translations_overwritten = 0

    for (id_, type_, theme, src, translations) in data.values():
        element = _find_data_by_id(tree_data_root, str(id_))
        if element is None:
            element = prepare_data_entry(id_, type_, str(themes.index(theme)), src)
            tree_data_root.append(element)
        elif overwrite_data:
            num_variants_overwritten += 1
            element.clear()
            element.extend(
                prepare_data_entry(
                    id_,
                    type_,
                    str(themes.index(theme)),
                    src
                ).findall("./*")
            )
            element.tag = "question" if type_ == "Q" else "answer"

        if id_ in variants and len(variants[id_]) >= 1:
            source = element.find("source")
            for v in variants[id_]:
                v_el = ET.Element("v")
                v_el.text = v
                source.append(v_el)

        tr_element = _find_translation_by_id(tree_translations_root, str(id_))
        if tr_element is None:
            tr_element = ET.SubElement(tree_translations_root, "entry")
            tr_element.set("source-id", str(id_))
        if overwrite_translations:
            tr_element.clear()
            tr_element.set("source-id", str(id_))
        for lang, text in translations.items():
            if not text:
                continue
            tr_target = tr_element.find(f"target[@lang='{lang}']")
            if tr_target is None:
                tr_target = ET.SubElement(tr_element, "target")
                tr_target.set("lang", lang)
                tr_target.text = text
            elif overwrite_translations:
                num_translations_overwritten += 1
                tr_target.clear()
                tr_target.set("lang", lang)
                tr_target.text = text
            tr_target.set("resource-audio", f"/audio/translations/{lang}/{id_}.mp3")

    config = {
        "config.supportedLanguages": [],
        "config.themes": []
    }
    for theme in themes:
        config["config.themes"].append({
            "id": themes.index(theme),
            "name": theme,
            "resources.audio": f"/audio/theme/{themes.index(theme)}.mp3",
            "resources.image": f"/image/theme/{themes.index(theme)}.png"
        })

    for lang in languages:
        config["config.supportedLanguages"].append({
            "id": languages.index(lang),
            "name": LANG_CODES[lang.lower()],
            "code": lang,
            "resources.flag": f"/image/flag_{lang.lower()}.png"
        })

    json.dump(config, open(os.path.join(src_path, "config.json"), "w"))

    tree_data.write(os.path.join(src_path, "data.xml"), encoding="utf-8")
    tree_translations.write(os.path.join(src_path, "translations.xml"), encoding="utf-8")

    print("\u001b[38;5;7mJSON config successfully written to config.json")
    print("\u001b[38;5;7mData successfully written to data.xml,", num_variants_overwritten, "variants overwritten")
    print("\u001b[38;5;7mTranslations successfully written to translations.xml,", num_translations_overwritten,
          "\u001b[38;5;7mtranslations overwritten")

    print("\u001b[38;5;14mAll data was successfully written in", round(time() - t, 2), "seconds,",
          len(data) + len(variants),
          "entries written")


if __name__ == '__main__':
    import sys

    args = sys.argv[1:]
    if len(args) == 1 and args[0] == "--help":
        print("Usage: excelreader.exe <path to excel file> <path to config folder> [--overwrite-data] "
              "[--overwrite-translations]")
        sys.exit(0)
    print("\u001b[1m\u001b[38;5;2mStarting...\u001b[0m")
    t = time()
    if len(args) < 2 or args[1].startswith("--"):
        if len(args) == 0 or args[0].startswith("--"):
            args.insert(0, r"C:\Users\amosa\OneDrive\IdeaProjects\TM\TM\resources\data\config\data.xlsx")
            print(f"\u001b[38;5;3mNo arguments provided for excel file, using default value '{args[0]}'")
        args.insert(1, r"C:\Users\amosa\OneDrive\IdeaProjects\TM\TM\resources\data\config")
        print(f"\u001b[38;5;3mNo arguments provided for config folder, using default value '{args[1]}'")
    write_xml(
        args[1],
        read_excel(args[0]),
        overwrite_data="--overwrite-data" in args,
        overwrite_translations="--overwrite-translations" in args
    )
    print("\u001b[1m\u001b[38;5;2mCompleted,", round(time() - t, 2), "seconds elapsed\u001b[0m")
