let getInitials = function (name) {
    let parts = name.split(' ')
    let initials = ''
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].length > 0 && parts[i] !== '') {
            initials += parts[i][0]
        }
    }
    return initials.length <= 2 ? initials : initials[0] + initials[initials.length - 1]
}

// Configure the animations
let __defaultHash = "language";
let __animationsMap = animationsMap({
    "language->students": animateLanguageToStudents,
    "students->language": animateStudentsToLanguage,
    "students->add-students": animateStudentsToAddStudents,
    "language->add-students": animateLanguageToAddStudents,
    "add-students->language": animateAddStudentsToLanguage,
    "add-students->students": animateAddStudentsToStudents
});

function loadLanguages() {
    let http = new XMLHttpRequest();
    http.open("GET", "/api/languages/supported");
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            let languages = JSON.parse(http.responseText);
            let container = document.querySelector(".language-list");
            container.innerHTML = "";
            languages.forEach((language) => {
                let box = document.createElement("div");
                box.classList.add("box");
                box.dataset.lang = language.code;
                let box_icon_holder = document.createElement("div");
                box_icon_holder.classList.add("box-icon-holder");
                let box_icon = document.createElement("div");
                box_icon.classList.add("box-icon");
                box_icon.style.backgroundImage = `url(/resources/${language['resources.flag']})`;
                let box_name = document.createElement("div");
                box_name.classList.add("box-name");
                box_name.textContent = language.name;

                box_icon_holder.appendChild(box_icon);
                box.appendChild(box_icon_holder);
                box.appendChild(box_name);
                container.appendChild(box);

                box.addEventListener("click", () => {
                    window.location.href = `./choose_gender.html#${language.code}`;
                });
            });
        }
    };
    http.send();
}

function loadStudents() {
    let http = new XMLHttpRequest();
    http.open("GET", "/api/students");
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            let students = JSON.parse(http.responseText);
            let container = document.querySelector("#students-list");
            students.forEach((student) => {
                let box = document.createElement("div");
                box.classList.add("box");
                let box_icon_holder = document.createElement("div");
                box_icon_holder.classList.add("box-icon-holder");
                let box_icon = document.createElement("div");
                box_icon.classList.add("box-icon");
                box_icon.classList.add("box-" + student.gender);
                let box_icon_name = document.createElement("div");
                box_icon_name.classList.add("box-icon-content");
                box_icon_name.style.fontSize = "24em";
                box_icon_name.textContent = getInitials(student.name).toUpperCase();
                let box_name = document.createElement("div");
                box_name.classList.add("box-name");
                box_name.textContent = student.name;

                box_icon.appendChild(box_icon_name);
                box_icon_holder.appendChild(box_icon);
                box.appendChild(box_icon_holder);
                box.appendChild(box_name);
                container.appendChild(box);


                box.addEventListener("click", () => {
                    window.location.href = `/choose_theme.html#${student.language}-${student.gender}`
                })
            }, true);
        }
    };
    http.send();
}

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
                let b = document.querySelector("#content-add-students .box-icon");
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
        console.log(f0.value)
        document.querySelector("#content-add-students .box-name").textContent = f0.value;
        document.querySelector("#content-add-students .box-icon-content").textContent = getInitials(f0.value).toUpperCase();
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
            element.parentElement.classList.remove("opened");
        });
    });

    document.querySelector(".add-student-button").addEventListener("click", () => {
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
            f1.value = f1.value === "Féminin" ? "F" : "M";
            document.querySelector(".input-forms-container").submit();
        }
    });

    loadStudents();

    loadLanguages();
});