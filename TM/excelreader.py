import os
import xml.etree.ElementTree as ET
from collections import defaultdict

import openpyxl


def read_excel(file_path):
    wb = openpyxl.load_workbook(open(file_path, "rb"))
    sheet = wb.active

    """ Source """
    table = sheet.tables["source"]
    if not table:
        raise ValueError("Table 'source' not found in the file")
    ref = table.ref.split(":")

    if len(sheet[ref[0]:ref[1]][0]) < 5:
        raise ValueError("Table must have minimum 5 columns: ID, Type, Theme, Question, 1st translation, "
                         "[2nd translation ...]")

    data = {}
    translations_columns = [x.name for x in table.tableColumns[4:]]
    themes = set()
    for row in sheet[ref[0]:ref[1]][1:]:
        data[row[0].value] = [cell.value for cell in row[:4]]
        data[row[0].value].append({k: row[i + 4].value for i, k in enumerate(translations_columns)})
        themes.add(row[2].value)

        if row[1].value not in "QA":
            raise ValueError("Invalid value for Type column. Must be either 'Q' or 'A'")

    """ Variants """
    table = sheet.tables["variants"]
    if not table:
        return list(themes), data, []

    ref = table.ref.split(":")
    if len(sheet[ref[0]:ref[1]][0]) != 3:
        raise ValueError("Variants table must have exactly 3 columns: Id, Source sentence, Variant sentence")
    variants = defaultdict(list)

    for row in sheet[ref[0]:ref[1]][1:]:
        variants[row[0].value].append(row[2].value)

    return list(themes), data, variants


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

    source = ET.SubElement(element, "source")
    el_v = ET.SubElement(source, "v")
    el_v.text = src

    return element


def write_xml(src_path, data, overwrite_data=True, overwrite_translations=True):
    themes, data, variants = data

    tree_data = ET.parse(os.path.join(src_path, "data.xml"))
    tree_translations = ET.parse(os.path.join(src_path, "translations.xml"))

    tree_data_root = tree_data.getroot().find("src")
    tree_translations_root = tree_translations.getroot()

    for (id_, type_, theme, src, translations) in data.values():
        element = _find_data_by_id(tree_data_root, str(id_))
        if element is None:
            tree_data_root.append(
                prepare_data_entry(
                    id_,
                    type_,
                    str(themes.index(theme)),
                    variants[id_][0] if id_ in variants else src
                )
            )
        elif overwrite_data:
            element.clear()
            element.extend(
                prepare_data_entry(
                    id_,
                    type_,
                    str(themes.index(theme)),
                    variants[id_][0] if id_ in variants else src
                ).findall("./*")
            )
            element.tag = "question" if type_ == "Q" else "answer"

        if id_ in variants and len(variants[id_]) > 1:
            source = element.find("source")
            for v in variants[id_][1:]:
                v_el = ET.Element("v")
                v_el.text = v
                source.append(v_el)

        tr_element = _find_translation_by_id(tree_translations_root, str(id_))
        if not tr_element:
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

                tr_target.set("resource-audio", f"/audio/translations/{lang}/{id_}.mp3")

    tree_data.write(os.path.join(src_path, "data.xml"), encoding="utf-8")
    tree_translations.write(os.path.join(src_path, "translations.xml"), encoding="utf-8")

    print("Data successfully written to data.xml, with themes list: ", {i: k for i, k in enumerate(themes)})
    print("Translations successfully written to translations.xml")


if __name__ == '__main__':
    write_xml(
        "./resources/data/config/",
        read_excel("resources/data/data.xlsx"),
        overwrite_data=True,
        overwrite_translations=True
    )
