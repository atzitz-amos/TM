let current = "language";
let isAnimating = false;
let scheduled = [];


function animFooterRight(duration, callback = null) {
    const mainBBox = document.querySelector('.footer-main-border').getBoundingClientRect();
    const svgBBox = document.querySelector('.footer-svg').getBoundingClientRect();
    const path1 = document.querySelector('.footer-svg #path-1');
    const path2 = document.querySelector('.footer-svg #path-2');
    const elementBBox = document.querySelector(`.footer-language-button`).getBoundingClientRect();
    const otherBBox = document.querySelector(`.footer-students-button`).getBoundingClientRect();

    const r = mainBBox.width / 2;
    let cursorWidth = elementBBox.width;
    let tp = elementBBox.top + elementBBox.height;
    let y = -(mainBBox.top + mainBBox.height / 2 - tp);

    let dx = Math.cos(Math.asin(y / r)) * r;
    let sx = mainBBox.left + r - dx - svgBBox.left;
    let rx = r - 2 * dx;
    let ry = (mainBBox.height + y - 12) / 2;

    path2.style.translate = `${sx - 6}px ${tp - svgBBox.top - 6}px`;
    path2.style.d = `path("M 0 0 A ${rx} ${ry} 0 0 1 ${mainBBox.width} 0")`;

    // let c = Math.sqrt(Math.pow(cursorWidth, 2) + Math.pow(Math.sqrt(Math.pow(r, 2) - Math.pow(r - cursorWidth, 2)), 2))
    // let a = Math.acos(1 - Math.pow(c, 2) / (2 * Math.pow(r, 2))) * 180 / Math.PI;

    let a = (cursorWidth / (Math.PI * r)) * 360;

    let anim1 = path1.animate([{}, {
        translate: `${sx - cursorWidth}px ${tp - svgBBox.top}px`
    }], {
        duration: duration, fill: "forwards", easing: "cubic-bezier(0.585, -0.200, 0.980, 0.335)"
    });  // Move p1

    let anim2 = path1.animate([{
        translate: `${sx - cursorWidth}px ${tp - svgBBox.top}px`
    }, {
        d: `path("M 0 0 H 0")`, translate: `${sx}px ${tp - svgBBox.top}px`
    }], {
        duration: duration * 0.5, delay: duration, fill: "forwards", easing: "ease-out"
    });  // Shrink p1

    let anim3 = path2.animate([{
        strokeDasharray: `0 0 0 360`
    }, {
        strokeDasharray: `0 0 ${a} ${360 - a}`
    }], {
        duration: duration * 0.5, delay: duration, fill: "forwards", easing: "ease-out"
    });  // Expand p2

    let anim4 = path2.animate([{
        strokeDasharray: `0 0 ${a} ${360 - a}`
    }, {
        strokeDasharray: `0 180 ${a} ${360 - a}`
    }], {
        duration: duration, delay: 1.5 * duration, fill: "forwards", easing: "ease-in"
    });  // Rotate p2

    anim4.onfinish = () => {
        anim1.cancel();
        anim2.cancel();
        path1.style.translate = `${sx - 2 * rx + 12}px ${tp - svgBBox.top}px`;
        path1.style.d = `path("M 0 0 H 0")`;

        let anim6 = path1.animate([{}, {
            d: `path("M 0 0 H ${otherBBox.width}")`, translate: `${sx - 2 * rx + 16}px ${tp - svgBBox.top}px`
        }], {
            duration: 0.5 * duration, fill: "forwards", easing: "linear"
        });  // Expand p1

        let anim7 = path1.animate([{
            translate: `${sx - 2 * rx + 16}px ${tp - svgBBox.top}px`
        }, {
            translate: `${otherBBox.left - svgBBox.left}px ${otherBBox.top - svgBBox.top + otherBBox.height}px`
        }], {
            duration: 0.5 * duration,
            delay: 0.5 * duration,
            fill: "forwards",
            easing: "cubic-bezier(0.250, 0.250, 0.540, 1.260)"
        });  // Move p1

        anim7.onfinish = () => {
            anim3.cancel();
            anim4.cancel();
            anim5.cancel();
            anim6.cancel();
            anim7.cancel();

            path1.style.d = `path("M 0 0 H ${otherBBox.width}")`;
            path1.style.translate = `${otherBBox.left - svgBBox.left}px ${otherBBox.top - svgBBox.top + otherBBox.height}px`;

            if (callback) {
                callback();
            }
        };
    };

    let anim5 = path2.animate([{
        strokeDasharray: `0 200 ${a} ${360 - a}`
    }, {
        strokeDasharray: `0 360 0 0`
    }], {
        duration: duration * 0.5, delay: 2.5 * duration, fill: "forwards", easing: "linear"
    });  // Shrink p2
}

function animFooterLeft(duration, callback) {
    const mainBBox = document.querySelector('.footer-main-border').getBoundingClientRect();
    const svgBBox = document.querySelector('.footer-svg').getBoundingClientRect();
    const path1 = document.querySelector('.footer-svg #path-1');
    const path2 = document.querySelector('.footer-svg #path-2');
    const langBBox = document.querySelector(`.footer-language-button`).getBoundingClientRect();
    const studentsBBox = document.querySelector(`.footer-students-button`).getBoundingClientRect();

    const r = mainBBox.width / 2;
    let cursorWidth = langBBox.width;
    let tp = langBBox.top + langBBox.height;
    let y = -(mainBBox.top + mainBBox.height / 2 - tp);

    let dx = Math.cos(Math.asin(y / r)) * r;
    let sx = mainBBox.left + r - dx - svgBBox.left;
    let rx = r - 2 * dx;
    let ry = (mainBBox.height + y - 12) / 2;

    path2.style.translate = `${sx - 6}px ${tp - svgBBox.top - 6}px`;
    path2.style.d = `path("M 0 0 A ${rx} ${ry} 0 0 1 ${mainBBox.width} 0")`;

    // let c = Math.sqrt(Math.pow(cursorWidth, 2) + Math.pow(Math.sqrt(Math.pow(r, 2) - Math.pow(r - cursorWidth, 2)), 2))
    // let a = Math.acos(1 - Math.pow(c, 2) / (2 * Math.pow(r, 2))) * 180 / Math.PI;

    let a = (cursorWidth / (Math.PI * r)) * 360;

    let anim1 = path1.animate([{
        translate: `${studentsBBox.left - svgBBox.left}px ${studentsBBox.top - svgBBox.top + studentsBBox.height}px`
    }, {
        translate: `${sx - 2 * rx + 16}px ${tp - svgBBox.top}px`
    },], {
        duration: duration, fill: "forwards", easing: "cubic-bezier(0.585, -0.200, 0.980, 0.335)"
    });  // Move p1

    let anim2 = path1.animate([{
        d: `path("M 0 0 H ${studentsBBox.width}")`, translate: `${sx - 2 * rx + 16}px ${tp - svgBBox.top}px`
    }, {
        d: `path("M 0 0 H 0")`
    },], {
        duration: duration * 0.5, delay: duration, fill: "forwards", easing: "ease-out"
    });  // Shrink p1

    let anim3 = path2.animate([{
        strokeDasharray: `0 360 0 0`
    }, {
        strokeDasharray: `0 200 ${a} ${360 - a}`
    }], {
        duration: duration * 0.5, delay: duration, fill: "forwards", easing: "ease-out"
    });  // Expand p2

    let anim4 = path2.animate([{
        strokeDasharray: `0 180 ${a} ${360 - a}`
    }, {
        strokeDasharray: `0 0 ${a} ${360 - a}`
    }], {
        duration: duration, delay: 1.5 * duration, fill: "forwards", easing: "ease-in"
    });  // Rotate p2

    anim4.onfinish = () => {
        anim1.cancel();
        anim2.cancel();
        path1.style.translate = `${sx}px ${tp - svgBBox.top}px`;
        path1.style.d = `path("M 0 0 H 0")`;

        let anim6 = path1.animate([{}, {
            d: `path("M 0 0 H ${langBBox.width}")`, translate: `${sx - cursorWidth}px ${tp - svgBBox.top}px`
        }], {
            duration: 0.5 * duration, fill: "forwards", easing: "linear"
        });  // Expand p1


        let anim7 = path1.animate([{
            translate: `${sx - cursorWidth}px ${tp - svgBBox.top}px`
        }, {
            translate: `${langBBox.left - svgBBox.left}px ${langBBox.top - svgBBox.top + langBBox.height}px`
        }], {
            duration: 0.5 * duration,
            delay: 0.5 * duration,
            fill: "forwards",
            easing: "cubic-bezier(0.250, 0.250, 0.540, 1.260)"
        });  // Move p1

        anim7.onfinish = () => {
            anim3.cancel();
            anim4.cancel();
            anim5.cancel();
            anim6.cancel();
            anim7.cancel();

            path1.style.d = `path("M 0 0 H ${langBBox.width}")`;
            path1.style.translate = `${langBBox.left - svgBBox.left}px ${langBBox.top - svgBBox.top + langBBox.height}px`;

            if (callback) {
                callback();
            }
        };
    };

    let anim5 = path2.animate([{
        strokeDasharray: `0 0 ${a} ${360 - a}`
    }, {
        strokeDasharray: `0 0 0 360`
    }], {
        duration: duration * 0.5, delay: 2.5 * duration, fill: "forwards", easing: "linear"
    });  // Shrink p2
}

// + ------------------- +
// | ANIMATION FUNCTIONS |
// + ------------------- +
function animateLanguageToStudents(duration, callback) {
    let el = document.getElementById("content-students"), el2 = document.getElementById("content-language");
    let animEnter = el.animate([{}, {left: "0"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    let animExit = el2.animate([{left: "0"}, {left: "150%"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    animFooterRight(duration, () => {
        animEnter.cancel();
        el.style.left = "0";

        animExit.cancel();
        el2.style.left = "150%";
        callback();
    });
}

function animateStudentsToLanguage(duration, callback) {
    let el = document.getElementById("content-language"), el2 = document.getElementById("content-students");
    let animEnter = el.animate([{}, {left: "0"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    let animExit = el2.animate([{left: "0"}, {left: "-150%"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });

    animFooterLeft(duration, () => {
        animEnter.cancel();
        el.style.left = "0";

        animExit.cancel();
        el2.style.left = "-150%";
        callback();
    });
}

function animateLanguageToAddStudents(duration, callback) {
    let el = document.getElementById("content-add-students"), el2 = document.getElementById("content-language");
    let animEnter = el.animate([{}, {left: "0"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    let animExit = el2.animate([{left: "0"}, {left: "150%"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    animFooterRight(duration, () => {
        animEnter.cancel();
        el.style.left = "0";

        animExit.cancel();
        el2.style.left = "150%";
        callback();
    });
}

function animateStudentsToAddStudents(duration, callback) {
    let el = document.getElementById("content-add-students");
    el.style.transitionDuration = duration * 5 + "ms";
    el.style.transitionTimingFunction = "cubic-bezier(0.000, 1.240, 0.555, 0.925)";
    el.style.clipPath = "circle(130% at calc(75% + 80px) calc(100% - 80px))";
    el.style.background = "white";

    el.ontransitionend = () => {
        if (el.getAnimations().length === 0) {  // Skip first transition
            document.getElementById("content-students").style.left = "-150%";
            callback();
        }
    };
}

function animateAddStudentsToLanguage(duration, callback) {
    let el = document.getElementById("content-language"), el2 = document.getElementById("content-add-students");
    let animEnter = el.animate([{}, {left: "0"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });
    let animExit = el2.animate([{left: "0"}, {left: "-150%"}], {
        duration: duration * 3.5, easing: "cubic-bezier(0.580, -0.190, 0.000, 0.810)", fill: "forwards"
    });

    animFooterLeft(duration, () => {
        animEnter.cancel();
        el.style.left = "0";

        animExit.cancel();
        el2.style.left = "-150%";

        document.getElementById("content-add-students").style.clipPath = "circle(0% at calc(75% + 80px) ca§lc(100% - 80px))";
        document.getElementById("content-add-students").style.background = "#D9D9D9";
        callback();
    });
}

function animateAddStudentsToStudents(duration, callback) {
    let el = document.getElementById("content-add-students"), el2 = document.getElementById("content-students");
    el2.style.left = "0";
    el.style.transitionDuration = duration * 4 + "ms";
    el.style.transitionTimingFunction = "cubic-bezier(0.000, 1.240, 0.555, 0.925)";
    el.style.clipPath = "circle(0% at calc(75% + 80px) calc(100% - 80px))";
    el.style.background = "#D9D9D9";

    el.ontransitionend = () => {
        if (el.getAnimations().length === 0) {  // Skip first transition
            callback();
        }
    };
}

function animateDefault(to, callback) {
    document.getElementById("content-" + current).style.left = "-150%"
    document.getElementById("content-" + to).style.left = "0";
    callback();
}

// + ----------------------- +
// | END ANIMATION FUNCTIONS |
// + ----------------------- +


const animationsMap = (function (x) {
    let obj = {};
    for (let [key, value] of Object.entries(x)) {
        let [from_, to_] = key.split("->");
        if (!(from_ in obj)) obj[from_] = {};
        obj[from_][to_] = value
    }
    return obj;
})({
    "language->students": animateLanguageToStudents,
    "students->language": animateStudentsToLanguage,
    "students->add-students": animateStudentsToAddStudents,
    "language->add-students": animateLanguageToAddStudents,
    "add-students->language": animateAddStudentsToLanguage,
    "add-students->students": animateAddStudentsToStudents
});


window.addEventListener('load', () => {
    current = window.location.hash.slice(1) || "language";
    setTimeout(() => {
        prepareCursor();

        document.getElementById("content-language").style.left = "150%";
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

    let x = animationsMap[current];
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
    const elementBBox = current === "language" ? document.querySelector(`.footer-language-button`).getBoundingClientRect() : document.querySelector(`.footer-students-button`).getBoundingClientRect();
    cursor.style.d = `path("M 0 0 H ${elementBBox.width}")`;

    let left = elementBBox.left - svgBBox.left;
    let top = elementBBox.top - svgBBox.top + elementBBox.height;

    cursor.style.translate = `${left}px ${top}px`;

    window.location.hash = current;
}