import itertools
import os.path
import sqlite3

from tensorflow.python.ops.gen_training_ops import SparseApplyProximalGradientDescent


def predict(text):
    # TODO
    return [{
        "id": 0,
        "theme.id": 0,
        "source.literal": "As-tu besoin d'aller aux toilettes?",
        "confidence": 0.9,

        "__temp.textValue": text
    }]


# noinspection PyUnresolvedReferences
def build_model(db_path, hard=False):
    import keras
    import tensorflow as tf
    from keras.src.layers import GlobalAveragePooling1D
    from tensorflow.keras.layers import TextVectorization, Embedding, Dense

    def prepare(max_tokens=100, output_length=25):
        cursor = sqlite3.connect(db_path).cursor()
        cursor.execute("SELECT * FROM source_sentences")
        source_sentences_list = cursor.fetchall()

        result = {}
        source_sentences = [None] * len(source_sentences_list)

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
                if i < len(v) // 5:
                    test_data[0].append(el)
                    test_data[1].append([0 if i != k else 1 for i in range(len(source_sentences))])
                else:
                    train_data[0].append(el)
                    train_data[1].append([0 if i != k else 1 for i in range(len(source_sentences))])

        train_data = [tf.constant(train_data[0]), tf.constant(train_data[1])]
        test_data = [tf.constant(test_data[0]), tf.constant(test_data[1])]

        train_data = tf.data.Dataset.from_tensor_slices((train_data[0], train_data[1]))

        return (text_vectorizer,
                train_data.batch(1),
                test_data,
                source_sentences)

    def make_and_train_model(vectorizer_layer, train, test, labels):
        if os.path.exists("resources/data/model/training/model.keras"):
            print("Found existing model, loading weights")
            return keras.models.load_model("resources/data/model/training/model.keras")

        model = keras.Sequential([
            vectorizer_layer,
            Embedding(len(vectorizer_layer.get_vocabulary()), 512, mask_zero=True),
            GlobalAveragePooling1D(),
            Dense(256, activation='sigmoid'),
            Dense(128, activation='sigmoid'),
            Dense(len(labels))
        ])

        model.compile(optimizer="adam",
                      loss=keras.losses.CategoricalCrossentropy(from_logits=True),
                      metrics=['accuracy'])

        model.fit(train, validation_data=test, epochs=10)
        model.summary()

        print("evaluate:", model.evaluate(*test))

        model.save("resources/data/model/training/model.keras")
        return model

    if hard:
        try:
            os.remove("resources/data/model/training/model.keras")
        except FileNotFoundError:
            pass

    vlayer, tr, tst, lbls = prepare()
    return [make_and_train_model(vlayer, tr, tst, lbls), tr, tst, lbls]


if __name__ == "__main__":
    import tensorflow as tf

    md, train_set, test_set, labels = build_model("resources/data/db.db")
    prediction = ["Tu veux que je te change?"]
    pr = md.predict(tf.convert_to_tensor(prediction))
    _, md_predict = tf.math.top_k(pr, k=3)
    print(f"Prediction on: `{prediction[0]}`, for labels {labels} \n\t=", md_predict, "\n\t= ",
          labels[md_predict[0, 0]], "\n\t=", labels[md_predict[0, 1]], "\n\t=", labels[md_predict[0, 2]])
