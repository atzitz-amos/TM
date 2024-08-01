let recorder;
let stream;
let hk;
let chunks = [];

const __defaultHash = "questions";
const __animationsMap = animationsMap({
    'questions->answers': animateQuestionsToAnswers,
    'answers->questions': animateAnswersToQuestions,
});

async function prepareRecorder() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = await navigator.mediaDevices.getUserMedia({audio: true});
        return [stream, new MediaRecorder(stream)];
    } else {
        alert("Application doesn't have permission to record audio. Some functionalities might be missing.");
    }
}

function record(e) {
    chunks.push(e.data);

    console.log(e);
}

function recoverAudio(cks) {
    const blob = new Blob(cks, {type: "audio/ogg"});
    const http = new XMLHttpRequest();

    const fd = new FormData();
    fd.set("audio", blob);
    http.open("POST", "/api/recognize");
    http.onreadystatechange = () => {
    };
    http.send(fd);

    chunks = [];
}

window.addEventListener("load", async () => {
    let el = document.querySelector(".footer-main-button");

    [stream, recorder] = await prepareRecorder();
    recorder.ondataavailable = record;

    hk = hark(stream);
    hk.on("stopped_speaking", () => {
        console.log("stopped speaking");
        el.style.removeProperty("color")
        setTimeout(() => {
            hk.suspend();
            recorder.stop();
            recoverAudio(chunks);
        }, 1000);  // Wait for the last chunk to be recorded
    });
    el.addEventListener("click", e => {
        if (recorder.state !== "recording") {
            recorder.start(1000);
            hk.resume();
            el.style.color = "red";
        }
    });

    let qEl = document.getElementById("content-questions");
    qEl.style.height = qEl.getBoundingClientRect().height + "px";
    qEl.style.width = qEl.getBoundingClientRect().width + "px";
    document.getElementById("content-answers").style.height = qEl.getBoundingClientRect().height + "px";
    document.getElementById("content-answers").style.width = qEl.getBoundingClientRect().width + "px";
}, true);