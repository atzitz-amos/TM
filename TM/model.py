import itertools
import sqlite3


def predict(text):
    # TODO
    return [{
        "id": 0,
        "theme.id": 0,
        "source.literal": "As-tu besoin d'aller aux toilettes?",
        "confidence": 0.9,

        "__temp.textValue": text
    }]


def build_model(db_path):
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
        model = keras.Sequential([
            vectorizer_layer,
            Embedding(len(vectorizer_layer.get_vocabulary()), 64, mask_zero=True),
            GlobalAveragePooling1D(),
            Dense(64, activation='relu'),
            Dense(len(labels), activation='softmax')
        ])

        tensorflow_callback = keras.callbacks.TensorBoard(log_dir="./logs")

        model.compile(optimizer='adam',
                      loss=tf.losses.BinaryCrossentropy(from_logits=True),
                      metrics=['accuracy'])

        model.fit(train, validation_data=test, epochs=10, callbacks=[tensorflow_callback])
        model.summary()

        return model

    vlayer, tr, tst, lbls = prepare()
    return [make_and_train_model(vlayer, tr, tst, lbls), tr, tst, lbls]


if __name__ == "__main__":
    import tensorflow as tf

    md, train_set, test_set, labels = build_model("resources/data/db.db")
    prediction = ["J'aime les pommes"]
    print(f"Prediction on: `{prediction[0]}`, for labels {labels} \n\t= ", md.predict(tf.convert_to_tensor(prediction)))
