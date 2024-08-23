window.addEventListener("load", () => {
    let hash = window.location.hash.slice(1);
    let http = new XMLHttpRequest();
    http.open("GET", "/api/languages/query?q=" + hash);
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            let language = JSON.parse(http.responseText);
            document.querySelector(".taskbar-current-language").textContent = language.name;
        } else if (http.status === 400) {
            window.location.href = "./index.html";
        }
    };
    http.send();

    document.querySelector(".taskbar-current-language").textContent = hash;
    document.querySelectorAll(".box").forEach(box => {
        box.addEventListener("click", () => {
            window.location.href = "./choose_theme.html#" + hash + "-" + box.dataset.gender;
        });

    });
}, true);
