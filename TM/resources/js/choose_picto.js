function getQueryStringArgument(name) {
    let url = window.location.search;
    let params = new URLSearchParams(url);
    return params.get(name);
}


function setupTaskbar() {
    let http = new XMLHttpRequest();
    http.open("GET", "/api/languages/query?q=" + getQueryStringArgument("target"));
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            let language = JSON.parse(http.responseText);
            document.querySelector(".taskbar-current-language").textContent = language.name;
        } else if (http.status === 400) {
            window.location.href = "./index.html";
        }
    };
    http.send();
    let http2 = new XMLHttpRequest();
    http2.open("GET", "/api/themes/query?id=" + getQueryStringArgument("theme"));
    http2.onreadystatechange = () => {
        if (http2.readyState === 4 && http2.status === 200) {
            document.querySelector(".taskbar-current-theme").textContent = JSON.parse(http2.responseText).name;
        } else if (http2.status === 400) {
            window.location.href = "./index.html";
        }
    };
    http2.send();
    document.querySelector(".taskbar-icon").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme");
    });
    document.querySelector(".footer-main-button").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme");
    });
}

function setupPicto() {
    if (getQueryStringArgument("type") === "1") {
        document.getElementById("1").querySelector(".box-icon-holder").innerHTML = "<i class='fas fa-question'></i>"
        document.getElementById("1").querySelector(".box-name").innerHTML = "Ich verstehe nicht";
        document.getElementById("1").querySelector(".box-name").style.fontSize = "3.5em";
    }
}

window.addEventListener("load", () => {
    setupTaskbar();
    setupPicto();

    document.querySelector(".header").textContent = getQueryStringArgument("literal");
    document.querySelector(".header").dataset.audio_url = getQueryStringArgument("audio-url");

    document.querySelector(".footer-left-button").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme") + "#questions";
    });

    document.querySelector(".footer-right-button").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme") + "#answers";
    });

    document.querySelectorAll(".box-container").forEach((box) => {
        box.addEventListener("click", () => {
            window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme") + "&literal=" + getQueryStringArgument("literal") + "&picto=" + box.id + "#questions";
        });
    });

    setTimeout(() => {
        document.querySelector(".header").click();
    }, 500)
});

