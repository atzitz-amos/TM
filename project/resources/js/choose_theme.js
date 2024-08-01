let lang, gender;

window.addEventListener('load', function () {
    let hash = window.location.hash.slice(1);
    [lang, gender] = hash.split('-');
    if (!lang || !gender) {
        window.location.href = "./index.html";
    }
    document.querySelector(".taskbar-current-language").textContent = lang;

    document.querySelectorAll(".box-container").forEach(x => {
        x.addEventListener('click', function (e) {
            let current = document.querySelector(".active-theme");
            if (current && current !== x) {
                current.classList.remove('active-theme');
            }

            x.classList.toggle('active-theme');
        });
    });

    document.querySelector(".confirm-button").addEventListener('click', function () {
        window.location.href = `./translation.html?lang=${lang}&gender=${gender}&theme=${document.querySelector(".active-theme").id}`
    });

    let http = new XMLHttpRequest();
    http.open('GET', `/api/themes/`, true);
    http.onreadystatechange = function () {
        if (http.readyState === 4 && http.status === 200) {
            let data = JSON.parse(http.responseText);
            let container = document.querySelector(".theme-list");
            data.forEach(theme => {
                let box_container = document.createElement('div');
                box_container.classList.add('box-container');
                box_container.id = theme.id;
                let box = document.createElement('div');
                box.classList.add('box');
                box.classList.add("translatable");
                let box_icon_holder = document.createElement('div');
                box_icon_holder.classList.add('box-icon-holder');
                if (theme['resources.image'].startsWith('fa://')) {
                    let i = document.createElement('i');
                    i.classList.add('fas');
                    i.classList.add(theme['resources.image'].slice(5));
                    box_icon_holder.appendChild(i);
                } else {
                    box_icon_holder.style.backgroundImage = `url(${theme['resources.image']})`;
                }
                let box_name = document.createElement('div');
                box_name.classList.add('box-name');
                box_name.textContent = theme['name'];

                box.onclick = () => {
                    let current = document.querySelector(".active-theme");
                    if (current && current !== box_container) {
                        current.classList.remove('active-theme');
                    }

                    box_container.classList.toggle('active-theme');
                }

                box.appendChild(box_name);
                box.appendChild(box_icon_holder);
                box_container.appendChild(box);
                container.appendChild(box_container);
            });
        }
    };
    http.send();
});