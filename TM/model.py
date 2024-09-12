import itertools
import os.path
import sqlite3
from collections import defaultdict

import keras
from keras.src.layers import GlobalAveragePooling1D
from tensorflow.keras.layers import TextVectorization, Embedding, Dense
import tensorflow as tf

from TM.parser import _normalize


def predict(db_path, model, text):
    cursor = sqlite3.connect(db_path).cursor()
    cursor.execute("SELECT source_id FROM sentences_variations WHERE normalized = ?", (_normalize(text),))
    if (result := cursor.fetchone()) is not None:
        cursor.execute("SELECT * FROM source_sentences WHERE id = ?", (result[0],))
        v = cursor.fetchone()
        return [{
            "id": v[0],
            "theme.id": v[1],
            "source.literal": v[3],
            "confidence": 1,

            "raw": text
        }]

    vls, lbls = tf.math.top_k(model[0].predict(tf.convert_to_tensor([text])), k=3)

    cursor.execute("SELECT * FROM source_sentences WHERE id = ?", (int(lbls[0, 0].numpy()),))
    v0 = cursor.fetchone()
    cursor.execute("SELECT * FROM source_sentences WHERE id = ?", (int(lbls[0, 1].numpy()),))
    v1 = cursor.fetchone()
    cursor.execute("SELECT * FROM source_sentences WHERE id = ?", (int(lbls[0, 2].numpy()),))
    v2 = cursor.fetchone()

    return [{
        "id": v[0],
        "theme.id": v[1],
        "source.literal": v[3],
        "confidence": int(confid.numpy()),

        "raw": text
    } for confid, v in zip(vls[0], [v0, v1, v2])]


# noinspection PyUnresolvedReferences
def build_model(db_path, hard=False):
    def prepare(max_tokens=100, output_length=25):
        cursor = sqlite3.connect(db_path).cursor()
        cursor.execute("SELECT * FROM source_sentences")
        source_sentences_list = cursor.fetchall()

        result = {}
        source_sentences = {}

        for sentence in source_sentences_list:
            source_sentences[sentence[0]] = sentence[3]
            cursor.execute("SELECT literal FROM sentences_variations WHERE source_id = ?", (sentence[0],))
            result[sentence[0]] = [x[0] for x in cursor.fetchall()]

        text_vectorizer = TextVectorization(
            max_tokens=max_tokens,
            output_mode="int",
            output_sequence_length=output_length,
            split="whitespace",
            ngrams=None)
        text_vectorizer.adapt(tf.constant(list(itertools.chain.from_iterable(result.values()))))

        train_data, test_data = [[], []], [[], []]
        for k, v in result.items():
            for i, el in enumerate(v):
                if i < len(v) // 2:
                    test_data[0].append(el)
                    test_data[1].append([0 if i != k else 1 for i in range(len(source_sentences))])
                else:
                    train_data[0].append(el)
                    train_data[1].append([0 if i != k else 1 for i in range(len(source_sentences))])

        train_data_set = [tf.constant(train_data[0]), tf.constant(train_data[1])]
        test_data = [tf.constant(test_data[0]), tf.constant(test_data[1])]

        train_data_set = tf.data.Dataset.from_tensor_slices((train_data_set[0], train_data_set[1]))

        return (text_vectorizer,
                train_data_set.batch(1),
                train_data,
                test_data,
                source_sentences)

    def make_and_train_model(vectorizer_layer, train, test, labels):
        if os.path.exists("resources/data/model/training/model.keras"):
            print("Found existing model, loading weights")
            return keras.models.load_model("resources/data/model/training/model.keras")

        model = keras.Sequential([
            vectorizer_layer,
            Embedding(len(vectorizer_layer.get_vocabulary()), 128, mask_zero=True),
            GlobalAveragePooling1D(),
            Dense(128, activation='sigmoid'),
            Dense(len(labels), activation="softmax")
        ])

        model.compile(optimizer="adam",
                      loss=keras.losses.CategoricalCrossentropy(from_logits=True),
                      metrics=['accuracy'])

        model.fit(train, validation_data=test, epochs=20)
        model.summary()

        print("evaluate:", model.evaluate(*test))

        model.save("resources/data/model/training/model.keras")

        return model

    if hard:
        try:
            os.remove("resources/data/model/training/model.keras")
        except FileNotFoundError:
            pass

    vlayer, tr_set, tr, tst, lbls = prepare()
    return [make_and_train_model(vlayer, tr_set, tst, lbls), tr, tst, lbls]


if __name__ == "__main__":
    import tensorflow as tf

    md, train_set, test_set, labels = build_model("resources/data/db.db", False)

    correct = 0
    distribution = defaultdict(int)

    for x, y in zip(*train_set):
        pr = md.predict(tf.constant([x]))
        _, md_predict = tf.math.top_k(pr, k=1)
        print(f"Prediction on: `{x}`, for labels {labels} \n\t=", md_predict, "\n\t= ", labels[int(md_predict[0, 0])])

        iscorrect = y.index(1) == md_predict[0, 0]
        correct += int(iscorrect)
        if not iscorrect:
            distribution[labels[int(md_predict[0, 0])]] += 1

    print("\nCorrect percentage: ", correct / len(train_set[0]))
    print(distribution)
