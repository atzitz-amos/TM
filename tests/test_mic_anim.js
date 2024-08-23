const barHeight = 20;
const barWidth = 10;

let positions = [];

function prepareAnimBars() {
    let svgEl = document.querySelector(".mic-anim-svg");
    let bars = document.querySelectorAll(".anim-bar");

    let svgBBox = svgEl.getBoundingClientRect();

    let gap = (svgBBox.width - barWidth * bars.length) / (bars.length + 2);
    let x = gap + barWidth;

    for (let bar of bars) {
        bar.style.d = `path("M0,0 V${barHeight}")`;
        bar.style.translate = `${x}px ${svgBBox.height + barHeight / 2}px`;
        positions.push([x, svgBBox.height + barHeight / 2]);

        x += barWidth + gap;
    }
}

window.addEventListener("load", () => {
    prepareAnimBars();
}, true);


function animateAnimBarsEnter(duration) {
    let svgBBox = document.querySelector(".mic-anim-svg").getBoundingClientRect();

    document.querySelectorAll(".anim-bar").forEach((bar, i) => {
        let [x, _] = positions[i];

        bar.animate([{}, {
            d: `path("M0,0 V${barHeight / 2 + svgBBox.height / 2}")`,
            offset: 0.5
        }, {
            translate: `${x}px ${svgBBox.height / 2 - barHeight / 2}px`,
            d: `path("M0,0 V${barHeight}")`
        }], {
            duration: duration,
            fill: "forwards",
            delay: i * (duration / 6),
            easing: "cubic-bezier(0.895, 0.030, 0.685, 0.220)"
        });
    });
}


function animateAnimBarsBasedOnSound(value) {
    console.log(value);
}