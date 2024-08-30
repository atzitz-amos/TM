import itertools
import json
import sqlite3
from collections import namedtuple, defaultdict
from xml.etree import ElementTree as ET


def parse_xml(xml_file):
    tree = ET.parse(xml_file)
    tree_decl = tree.find("decl")
    tree_src = tree.find("src")

    variables = {}
    questions = {}

    for var in tree_decl.findall('variable'):
        variables[var.find("name").text] = [x.text for x in var.find("source").findall("v")]
    for question in tree_src.findall('question'):
        config = question.find("config")
        questions[(config.find("id").text, config.find("theme").text, 0)] = [x.text for x in
                                                                             question.find("source").findall("v")]
    for answer in tree_src.findall('answer'):
        config = answer.find("config")
        questions[(config.find("id").text, config.find("theme").text, 1)] = [x.text for x in
                                                                             answer.find("source").findall("v")]

    return variables, questions


def parse_source(text):
    tokens = []
    i = 0
    while i < len(text):
        if text[i] in '$?()|':
            tokens.append(("token", text[i]))
        elif text[i] == "{":
            i += 1
            start = i
            while i < len(text) and text[i] != "}":
                i += 1
            tokens.append(("variable", text[start:i]))
        elif text[i] == '"':
            i += 1
            start = i
            while i < len(text) and text[i] != '"':
                i += 1
            tokens.append(("literal", text[start:i]))
        elif text[i] == " ":
            while i + 1 < len(text) and text[i + 1] == " ":
                i += 1
            tokens.append(("space", " "))
        i += 1

    cursor = 0

    def parse_body():
        nonlocal cursor
        body = [parse_stmt_group()]
        while cursor < len(tokens) and tokens[cursor] == ("token", "|"):
            cursor += 1
            body.append(parse_stmt_group())

        if len(body) <= 1:
            return ["group", body[0]]
        return ["choice", body]

    def parse_stmt_group():
        nonlocal cursor

        body = []

        while cursor < len(tokens) and tokens[cursor] != ("token", "|") and tokens[cursor] != ("token", ")"):
            match tokens[cursor]:
                case ("token", "("):
                    body.append(parse_group())
                case ("token", "$"):
                    body.append(parse_variable())
                case ("literal", lit):
                    body.append(parse_literal())
                case ("space", _):
                    cursor += 1
                    if cursor < len(tokens) and tokens[cursor] != ("token", "|") \
                            and tokens[cursor - 2] != ("token", "|"):
                        body.append(["space"])
                case _:
                    cursor += 1

        return body

    def parse_group():
        nonlocal cursor
        cursor += 1
        body = parse_body()
        cursor += 1

        return [*body, parse_alterations()]

    def parse_variable():
        nonlocal cursor
        cursor += 1

        assert tokens[cursor][0] == "variable"
        return ["variable", tokens[cursor][1], parse_alterations()]

    def parse_literal():
        nonlocal cursor
        cursor += 1

        return ["literal", tokens[cursor - 1][1], parse_alterations()]

    def parse_alterations():
        nonlocal cursor

        if cursor < len(tokens) and tokens[cursor] == ("token", "?"):
            cursor += 1
            return "?"

        return ""

    return parse_body()


Literal = namedtuple("Literal", ["value"])
Variable = namedtuple("Variable", ["choices"])


def remove_duplicate_spaces(x):
    while "  " in x:
        x = x.replace("  ", " ")
    return x


class Parser:
    def __init__(self, filename):
        self.variables, self.questions = parse_xml(filename)

    def parse(self):
        """ Parse into a highly recursive AST, or kind of 'cause I don't want to write classes """
        questions = {}
        variables = {}
        for key, value in self.questions.items():
            questions[key] = [parse_source(x) for x in value]
        for key, value in self.variables.items():
            variables[key] = [parse_source(x) for x in value]

        return questions, variables

    def collapse_(self, src_data, src_variables):
        def collapse_obj(x):
            match x:
                case ["group", b, alt]:
                    return collapse_group(b, alt)
                case ["choice", b, alt]:
                    return collapse_choice(b, alt)
                case ["variable", n, alt]:
                    return [collapse_variable(n, alt)]
                case ["literal", lit, alt]:
                    return [collapse_literal(lit, alt)]
                case ["space"]:
                    return [Literal(" ")]
                case _:
                    raise ValueError("Invalid source")

        def collapse_group(src, alt=""):
            r = []

            for x in src:
                r.extend(collapse_obj(x))

            if alt == "?":
                return [Variable([r, Literal(value="")])]
            return r

        def collapse_choice(src, a=""):
            if a == "?":
                return Variable([collapse_group(x) for x in src] + [Literal(value="")])
            return [Variable([collapse_group(x) for x in src])]

        def collapse_variable(name, alt):
            if alt == "?":
                return Variable([src_variables] + [Literal(value="")])
            return Variable(src_variables[name])

        def collapse_literal(lit, alt):
            if alt == "?":
                return Variable([lit, Literal(value="")])
            return Literal(lit)

        if not len(src_data):
            return ""
        if src_data[0] == "group":
            return collapse_group(src_data[1])
        elif src_data[0] == "choice":
            return collapse_choice(src_data[1])
        else:
            raise ValueError("Invalid source")

    def transform_to_string(self, result):
        varcounter = 0
        variables = defaultdict(list)

        def to_string(s):
            nonlocal varcounter, variables

            used_vars = {}
            r = ""
            for x in s:
                if isinstance(x, Literal):
                    r += x.value
                elif isinstance(x, Variable):
                    variables[f"var{varcounter}"] = [to_string(y) for y in x.choices]
                    r += "{var" + str(varcounter) + "}"
                    used_vars[f"var{varcounter}"] = variables[f"var{varcounter}"]
                    varcounter += 1
            return r, used_vars

        return to_string(result), variables

    def expand(self, string, src_vars):
        """ Expand all the variables into a single list """

        def expand_single(val, present_vars: dict[str, list]):
            z = defaultdict(list)
            for key, value in present_vars.items():
                for v in value:
                    z[key].extend(expand_single(*v))

            res = []

            for i, x in enumerate(itertools.product(*z.values())):
                res.append(val.format(**dict(zip(z.keys(), x))))
            return res

        return [remove_duplicate_spaces(x) for x in expand_single(*string)]

    def build_source(self, s, var):
        return self.expand(*self.transform_to_string(self.collapse_(s, var)))

    def build(self):
        """ Flatten the parsed questions array into formatted strings """
        src_questions, src_variables = self.parse()
        result = {}
        variables = {}

        for name, body in src_variables.items():
            variables[name] = [self.collapse_(x, src_variables) for x in body]

        for name, body in src_questions.items():
            result[name] = list(itertools.chain.from_iterable([self.build_source(x, variables) for x in body]))

        return result

    def to_json(self):
        result = self.build()
        root = []

        for key, value in result.items():
            root.append({
                "id": int(key[0]),
                "theme.id": int(key[1]),
                "source.literal": value[0],
                "source.variants": value
            })
        return json.dumps({"data.questions": root})

    def to_db(self, db_path):
        result = self.build()
        conn = sqlite3.connect(db_path)

        for key, values in result.items():
            try:
                conn.execute("INSERT INTO source_sentences(id, theme_id, s_type, literal) VALUES (?, ?, ?, ?)",
                             (int(key[0]), int(key[1]), int(key[2]), values[0]))
                conn.executemany("INSERT INTO sentences_variations(source_id, literal) VALUES (?, ?)",
                                 [(int(key[0]), v) for v in values])
            except sqlite3.IntegrityError:
                pass
        conn.commit()
        conn.close()


if __name__ == '__main__':
    parser = Parser("resources/data/config/data.xml")
    print(parser.to_json())
