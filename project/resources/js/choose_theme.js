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
});