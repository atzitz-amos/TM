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
        window.history.back();
    });

}

window.addEventListener("load", () => {
    setupTaskbar();

    document.querySelector(".header").textContent = getQueryStringArgument("literal");

    document.querySelector(".footer-left-button").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme") + "#questions";
    });

    document.querySelector(".footer-right-button").addEventListener("click", () => {
        window.location.href = "/translation.html?lang=" + getQueryStringArgument("target") + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme") + "#answers";
    });
});

