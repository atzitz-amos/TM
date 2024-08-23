document.addEventListener("click", e => {
    let current = e.target;
    while (!current.classList.contains("speakable") && current.nodeType !== "body")
        current = current.parentElement;
    if (!current.classList.contains("speakable") || !current.dataset.audio_url) return;
    let audio = new Audio("/resources" + current.dataset.audio_url);
    audio.play();
});