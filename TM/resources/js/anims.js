let current = "language";
let isAnimating = false;
let scheduled = [];


window.addEventListener('load', () => {
    current = window.location.hash.slice(1) || __defaultHash;  // __defaultHash should be defined by the page itself
    setTimeout(() => {
        prepareCursor();

        if (__defaultHash === "language")
            document.getElementById("content-language").style.left = "150%";
        else
            document.getElementById("content-questions").style.left = "150%";
        document.getElementById("content-" + current).style.left = "0";  // No animation when first loading page

        if (current === "add-students") {
            document.getElementById("content-add-students").style.clipPath = "circle(130% at calc(75% + 80px) calc(100% - 80px))";
            document.getElementById("content-add-students").style.background = "white";
        }
    }, 500);
}, true);

function restoreScheduled() {
    if (scheduled.length > 0) {
        isAnimating = true;
        let callback = scheduled.shift();
        callback(() => {
            restoreScheduled();
            isAnimating = false;
        });
    }
}

function reloadFromHash() {
    let newCurrent = window.location.hash.slice(1);
    console.log(current, "->", newCurrent);

    let x = __animationsMap[current];
    if (x && x[newCurrent]) {
        let anim = x[newCurrent];
        if (isAnimating) {
            scheduled.push(callback => anim(400, callback));
        } else {
            isAnimating = true;
            anim(400, () => {
                isAnimating = false;
                restoreScheduled();
            });
        }
    } else {
        if (isAnimating) {
            scheduled.push(callback => animateDefault(newCurrent, callback));
        }
        animateDefault(newCurrent, () => restoreScheduled());
    }
    current = newCurrent;
}

window.addEventListener("hashchange", () => {
    reloadFromHash();
}, true);

prepareCursor = function () {
    const cursor = document.querySelector('.footer-svg path');
    const svgBBox = document.querySelector('.footer-svg #path-1').getBoundingClientRect();
    const elementBBox = (current === "language" || current === "questions") ? document.querySelector(`.footer-left-button`).getBoundingClientRect() : document.querySelector(`.footer-right-button`).getBoundingClientRect();
    cursor.style.d = `path("M 0 0 H ${elementBBox.width}")`;

    let left = elementBBox.left - svgBBox.left;
    let top = elementBBox.top - svgBBox.top + elementBBox.height;

    cursor.style.translate = `${left}px ${top}px`;

    window.location.hash = current;
}