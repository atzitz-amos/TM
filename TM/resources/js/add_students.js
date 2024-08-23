window.addEventListener("load", () => {
    let f0 = document.querySelector("#f0 .input-form-input");
    let f1 = document.querySelector("#f1 .input-form-input");
    let f2 = document.querySelector("#f2 .input-form-input");

    document.querySelectorAll(".input-option").forEach((element) => {
        element.addEventListener("click", () => {
            let id = element
                .parentElement  // .form-options
                .parentElement  // .input-form
                .id;

            let f = document.querySelector(`#${id} .input-form-input`);
            f.value = element.textContent;
            f.parentElement.classList.remove("invalid");

            if (f === f1) {
                let b = document.querySelector(".box-icon");
                if (element.textContent === "Féminin") {
                    b.classList.remove("box-M");
                    b.classList.add("box-F");
                } else {
                    b.classList.remove("box-F");
                    b.classList.add("box-M");
                }
            }

            element.parentElement.parentElement.classList.add("non-empty");
        });
    });

    f0.addEventListener("input", () => {
        document.querySelector(".box-name").textContent = f0.value;
        f0.parentElement.classList.remove("invalid");
    });

    document.querySelectorAll(".input-form-input").forEach((element) => {
        element.addEventListener("click", () => {
            if (element.parentElement.classList.contains("opened")) {
                element.blur();
            } else {
                element.parentElement.classList.add("opened");
            }
        });

        element.addEventListener("blur", () => {
            console.log("1");
            element.parentElement.classList.remove("opened");
        });
    });

    document.querySelector(".add-button").addEventListener("click", () => {
        let invalid = false;
        f0.parentElement.classList.remove("invalid");
        f1.parentElement.classList.remove("invalid");
        f2.parentElement.classList.remove("invalid");
        // noinspection SillyAssignmentJS
        f0.offsetWidth = f0.offsetWidth;  // Trigger reflow
        if (f0.value === "") {
            f0.parentElement.classList.add("invalid");
            invalid = true;
        }
        if (f1.value === "") {
            f1.parentElement.classList.add("invalid");
            invalid = true;
        }
        if (f2.value === "") {
            f2.parentElement.classList.add("invalid");
            invalid = true;
        }


        if (!invalid) {
            document.querySelector(".input-forms-container").submit();
        }
    });
}, true);