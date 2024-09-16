document.addEventListener("click", e => {
    let current = e.target;
    while (current && current.nodeType !== "body" && !current.classList.contains("speakable"))
        current = current.parentElement;

    if (!current || !current.classList.contains("speakable") || !current.dataset.audio_url) return;
    let audio = new Audio("/resources" + current.dataset.audio_url);
    audio.play();
    audio.onended = () => triggerTutorialHook("speaking_ended");

    triggerTutorialHook("speaking_started");
});