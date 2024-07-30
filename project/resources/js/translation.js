let recorder;
let chunks = [];

async function prepareRecorder() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return new MediaRecorder(await navigator.mediaDevices.getUserMedia({audio: true}));
    } else {
        alert("Application doesn't have permission to record audio. Some functionalities might be missing.");
    }
}

function record(e) {
    chunks.push(e.data);
}

function recoverAudio(cks) {
    const blob = new Blob(cks);
}

window.onload = async () => {
    recorder = await prepareRecorder();
    recorder.ondataavailable = record;

    document.querySelector(".footer-main-button").addEventListener("click", e => {
        if (recorder.state === "recording") {
            recorder.stop();
            recoverAudio(chunks);
            e.target.style.removeProperty("color");
        } else {
            recorder.start(1000);
            e.target.style.color = "red";
        }
    });
};