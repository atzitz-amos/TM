window.addEventListener("load", () => {
    let hash = window.location.hash.slice(1);
    if (!hash) {
        window.location.href = "./index.html";
    }
    document.querySelector(".taskbar-current-language").textContent = hash;

    document.querySelectorAll(".box").forEach(box => {
        box.addEventListener("click", () => {
            window.location.href = "./choose_theme.html#" + hash + "-" + box.dataset.gender;
        });
    });
}, true);
