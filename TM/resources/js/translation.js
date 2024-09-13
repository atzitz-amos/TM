let recorder;
let stream;

let audioAnalyser;
let pcmData;

let hk;
let chunks = [];

let areSoundbarsReady = false;

const __defaultHash = "questions";
const __animationsMap = animationsMap({
    'questions->answers': animateQuestionsToAnswers, 'answers->questions': animateAnswersToQuestions,
});

const DEFAULT_TRANSLATIONS_BOX_CONTENT = "Appuyez sur le microphone pour d&eacute;marrer l&apos;enregistrement...";
const ERROR_TRANSLATIONS_BOX_CONTENT = "Je n'ai pas compris... Pouvez-vous répéter?";
const WAITING_TRANSLATIONS_BOX_CONTENT = "En attente...";

/**
 *  UTILS */
function getQueryStringArgument(name) {
    let url = window.location.search;
    let params = new URLSearchParams(url);
    return params.get(name);
}

function translate(id) {
    let http2 = new XMLHttpRequest();
    http2.open("POST", "/api/translate?id=" + id + "&target=" + getQueryStringArgument("lang"));
    http2.onreadystatechange = () => {
        if (http2.readyState === 4 && http2.status === 200) {
            let json = JSON.parse(http2.responseText);
            window.location.href = "/choose_picto.html?target=" + getQueryStringArgument("lang") + "&theme=" + getQueryStringArgument("theme") + "&literal=" + json.literal + "&audio-url=" + json.resource_audio_path + "&gender=" + getQueryStringArgument("gender") + "&theme=" + getQueryStringArgument("theme");
        }
    }
    http2.send();
}

/**
 *  RECORDING */
async function prepareRecorder() {
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            let stream = await navigator.mediaDevices.getUserMedia({audio: true});

            let ctx = new AudioContext();
            let mediaNode = ctx.createMediaStreamSource(stream);
            let analyser = ctx.createAnalyser();
            mediaNode.connect(analyser);
            pcmData = new Float32Array(analyser.fftSize);

            return [stream, new MediaRecorder(stream), analyser];
        } else {
            alert("Application doesn't have permission to record audio. Some functionalities might be missing.");
        }
    } catch {
        alert("Application doesn't have permission to record audio. Some functionalities might be missing.");
    }
    return [null, null];
}

function record(e) {
    chunks.push(e.data);

    console.log(e);
}

function cancelRotatingAnims() {
    rotatingAnims.forEach(x => x.cancel());
    rotatingAnims = [];

    document.querySelectorAll(".anim-bar").forEach((bar, i) => {
        bar.style.removeProperty("transform");
        bar.style.removeProperty("transform-origin");
        bar.style.translate = initialBarPositions[i][0] + "px " + initialBarPositions[i][1] + "px";
    });
}

function recoverAudio(cks) {
    if (!stream) return;
    const blob = new Blob(cks, {type: "audio/ogg"});
    const http = new XMLHttpRequest();

    const fd = new FormData();
    fd.set("audio", blob);
    http.open("POST", "/api/recognize");
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            const div = document.createElement("div");
            div.className = "translations-suggestions"
            document.querySelector(".section-header").innerHTML = "";
            document.querySelector(".section-header").appendChild(div);

            JSON.parse(http.responseText).forEach(el => {
                let x = document.createElement("span");
                x.textContent = el["source.literal"];
                div.appendChild(x);

                x.addEventListener("click", () => translate(el["source.id"]));
            });

            if (rotatingAnims) {
                cancelRotatingAnims();
            }
        } else if (http.readyState === 4) {
            document.querySelector(".section-header").innerHTML = ERROR_TRANSLATIONS_BOX_CONTENT;
            if (rotatingAnims) {
                cancelRotatingAnims();
            }
        }
    };

    http.send(fd);
}

function getSoundLevel() {
    audioAnalyser.getFloatTimeDomainData(pcmData);
    let sumSquares = 0.0;
    for (const amplitude of pcmData) {
        sumSquares += amplitude * amplitude;
    }
    return Math.sqrt(sumSquares / pcmData.length);
}


/**
 *  SOUND ANIMATIONS */
const barHeight = 20;
const maxBarHeight = 50;
const barWidth = 10;

let initialBarPositions = [];
let barsAnimationThresholds = [];
let barsAnimationIterationCount = 0;

let rotatingAnims = [];

function setupSoundbars() {
    let svgEl = document.querySelector(".mic-anim-svg");
    let bars = document.querySelectorAll(".anim-bar");

    let svgBBox = svgEl.getBoundingClientRect();

    let gap = (svgBBox.width - barWidth * bars.length) / (bars.length + 2);
    let x = gap + barWidth;

    for (let bar of bars) {
        bar.style.d = `path("M0,0 V${barHeight}")`;
        bar.style.translate = `${x}px ${svgBBox.height + barHeight / 2}px`;
        initialBarPositions.push([x, svgBBox.height + barHeight / 2]);

        x += barWidth + gap;

        barsAnimationThresholds.push(Math.random());
    }
}

function animateSoundbarsEnter(duration) {
    let svgBBox = document.querySelector(".mic-anim-svg").getBoundingClientRect();

    document.querySelectorAll(".anim-bar").forEach((bar, i) => {
        let [x, _] = initialBarPositions[i];

        let h = svgBBox.height - barHeight - 50;
        let animation = bar.animate([{}, {
            d: `path("M0,0 V${h}")`, offset: 0.5
        }, {
            translate: `${x}px ${h}px`, d: `path("M0,0 V${barHeight}")`
        }], {
            duration: duration,
            fill: "forwards",
            delay: i * (duration / 6),
            easing: "cubic-bezier(0.895, 0.030, 0.685, 0.220)"
        });
        animation.onfinish = () => {
            animation.cancel();
            bar.style.translate = `${x}px ${h}px`;
            areSoundbarsReady = true;
        };
    });

}

function animateSoundbarsRotation(duration) {
    let svgBBox = document.querySelector(".mic-anim-svg").getBoundingClientRect();

    let angle = 3 / 2;
    let midW = svgBBox.width / 2 - barWidth;

    let x = Math.cos(angle * Math.PI) * midW + barWidth * 2;
    let y = Math.sin(angle * Math.PI) * midW;

    document.querySelectorAll(".anim-bar").forEach((bar, i) => {
        let y0 = svgBBox.height - barHeight - 50;
        let anim1 = bar.animate([{}, {
            translate: `${x}px ${y0 + y}px`, d: `path("M0,0 V4")`
        }], {
            duration: duration,
            fill: "forwards",
            delay: i * (duration / 3),
            easing: "cubic-bezier(0.250, 0.100, 0.250, 1.000)"
        });
        anim1.onfinish = () => {
            anim1.cancel();
            bar.style.translate = `${x}px ${y0 + y}px`;
            bar.style.d = `path("M0 0 V4")`;

            bar.style.transformOrigin = "40px 0";

            rotatingAnims.push(bar.animate([{transform: "rotate(0deg)"}, {transform: "rotate(360deg)"},], {
                duration: 1000, iterations: Infinity
            }));
        };
    });
}


function animateSoundbarsBasedOnSound() {
    if (areSoundbarsReady) {
        if (barsAnimationIterationCount > 5) {
            barsAnimationIterationCount = 0;
            for (let i = 0; i < initialBarPositions.length; i++) barsAnimationThresholds[i] = Math.random();
        }
        let value = getSoundLevel();
        document.querySelectorAll(".anim-bar").forEach((bar, i) => {
            let h = (barHeight + (maxBarHeight - barHeight) * (value * (1 + barsAnimationThresholds[i] * 2)) * 10)
            bar.style.d = `path("M0 0 V${h}")`;
            console.log("x");
            bar.style.transform = `translate(0, ${-h / 2}px)`;
        });
        barsAnimationIterationCount++;
    }
    requestAnimationFrame(animateSoundbarsBasedOnSound);
}


function stopRecording() {
    let el = document.querySelector(".footer-main-button");
    el.style.removeProperty("color")
    areSoundbarsReady = false;
    setTimeout(() => {
        hk.suspend();
        recorder.stop();
        recoverAudio(chunks);
    }, 1000);  // Wait for the last chunk to be recorded

    animateSoundbarsRotation(300);
}

/**
 *  SETUP */
async function setupRecording() {
    let el = document.querySelector(".footer-main-button");

    [stream, recorder, audioAnalyser] = await prepareRecorder();
    if (!stream) return;
    recorder.ondataavailable = record;

    hk = hark(stream);
    hk.suspend();
    hk.on("stopped_speaking", () => {
        console.log("stopped speaking");
        stopRecording();
    });
    el.addEventListener("click", e => {
        if (recorder.state !== "recording") {
            chunks = [];
            recorder.start(1000);
            hk.resume();
            el.style.color = "red";
            document.querySelector(".section-header").textContent = WAITING_TRANSLATIONS_BOX_CONTENT;

            animateSoundbarsEnter(300);
            requestAnimationFrame(animateSoundbarsBasedOnSound);
        } else {
            stopRecording()
        }
    });
}

function setupAnimations() {
    let qEl = document.getElementById("content-questions");
    qEl.style.height = qEl.getBoundingClientRect().height + "px";
    qEl.style.width = qEl.getBoundingClientRect().width + "px";
    document.getElementById("content-answers").style.height = qEl.getBoundingClientRect().height + "px";
    document.getElementById("content-answers").style.width = qEl.getBoundingClientRect().width + "px";

    document.querySelector(".taskbar-icon").addEventListener("click", () => {
        window.history.go(-(hashchanges_count + 1));
    });
}

function buildSentencesList(sentences) {
    let questions = document.querySelector(".content-questions .content-list");
    let answers = document.querySelector(".content-answers .content-list");

    questions.innerHTML = "";
    answers.innerHTML = "";

    sentences.forEach(s => {
        let div = document.createElement("div");
        div.className = "item";
        div.id = s.id
        div.innerText = s.literal;
        if (s.s_type === 0) questions.appendChild(div); else answers.appendChild(div);

        div.addEventListener("click", () => translate(s.id));
    });
}

function setupSentencesList() {
    let http = new XMLHttpRequest();
    http.open("GET", "/api/sentences?theme=" + getQueryStringArgument("theme"));
    http.onreadystatechange = () => {
        if (http.readyState === 4 && http.status === 200) {
            buildSentencesList(JSON.parse(http.responseText));
        }
    }
    http.send();
}

function setupSearchBar() {
    document.querySelector(".search-bar-input").addEventListener("change", async e => {
        let http = new XMLHttpRequest();
        http.open("GET", "/api/sentences?theme=" + getQueryStringArgument("theme") + "&q=" + e.target.value + "&type=" + (current === "questions" ? 0 : 1));
        http.onreadystatechange = () => {
            if (http.readyState === 4 && http.status === 200) {
                buildSentencesList(JSON.parse(http.responseText));
            }
        };
        http.send();
    });
}

function setupTaskbar() {
    let http = new XMLHttpRequest();
    http.open("GET", "/api/languages/query?q=" + getQueryStringArgument("lang"));
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
}

window.addEventListener("load", async () => {
    if (!getQueryStringArgument("theme") || !getQueryStringArgument("gender") || !getQueryStringArgument("lang")) {
        window.location.href = "/index.html";
    }

    await setupRecording();
    setupAnimations();
    setupSentencesList();
    setupSearchBar();
    setupTaskbar();
    setupSoundbars();
}, true);