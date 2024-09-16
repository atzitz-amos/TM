function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let CANCEL_FUNCTIONS = [];

function showTutorialOn(element, content, noNext = null) {
    let tutorial = document.querySelector(".tutorial");
    tutorial.classList.add("visible")
    tutorial.style.setProperty("--tutorial-arrow-left", "50%");
    tutorial.querySelector(".tutorial-content").innerHTML = content;

    if (noNext) {
        TUTORIAL_NEXT_CALLBACK = noNext;
    } else {
        TUTORIAL_NEXT_CALLBACK = stepTutorial;
    }

    tutorial.classList.remove("arrow-top");
    tutorial.classList.remove("arrow-bottom");
    if (!element) {
        tutorial.style.left = window.innerWidth / 2 - tutorial.clientWidth / 2 + "px";
        tutorial.style.top = window.innerHeight / 2 - tutorial.clientHeight / 2 + "px";
        return;
    }

    let bbox = element.getBoundingClientRect();
    let remainingSpace = window.innerHeight - bbox.bottom;

    let direction = "top";
    if (remainingSpace < tutorial.clientHeight + 50) {
        direction = "bottom";
    }
    tutorial.classList.add("arrow-" + direction);
    tutorial.style.left = bbox.x + bbox.width / 2 - tutorial.clientWidth / 2 + "px";
    tutorial.style.top = direction === "top" ? bbox.bottom + 10 + "px" : bbox.top - tutorial.clientHeight - 10 + "px";

    let tbbox = tutorial.getBoundingClientRect();
    if (tbbox.x < 10) {
        tutorial.style.left = "10px";
        tutorial.style.setProperty("--tutorial-arrow-left", (bbox.x + bbox.width / 2 - 10) + "px");
    } else if (tbbox.right > window.innerWidth - 10) {
        tutorial.style.left = window.innerWidth - tbbox.width - 10 + "px";
        tutorial.style.setProperty("--tutorial-arrow-left", (bbox.x + bbox.width / 2 - (window.innerWidth - tbbox.width - 10)) + "px");
    }
}

function preventAllClicksExcept(element, callbackOut, callbackIn) {
    let c = function (event) {
        console.log("Called", element);
        if (document.querySelector(".tutorial").contains(event.target)) return;
        if (!element || !element.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();

            if (callbackOut) callbackOut();
        } else if (callbackIn) {
            callbackIn();
        }
    };
    document.body.addEventListener("click", c, {capture: true});

    let cancelFunc = () => {
        document.body.removeEventListener("click", c, {capture: true});
        CANCEL_FUNCTIONS.pop(CANCEL_FUNCTIONS.indexOf(cancelFunc));
    };
    CANCEL_FUNCTIONS.push(cancelFunc);
    return cancelFunc;
}

function shakeTutorial() {
    setTimeout(() => {
        let tutorial = document.querySelector(".tutorial");
        tutorial.classList.add("shake");
        setTimeout(() => {
            tutorial.classList.remove("shake");
        }, 500);
    }, 100);

}


function suppressTutorial() {
    let tutorial = document.querySelector(".tutorial");
    tutorial.classList.remove("visible")
    CANCEL_FUNCTIONS.forEach(f => f());
}

const TUTORIALS = [
    () => {
        window.location.href = "/#language";
        let dialog = document.createElement("div");
        dialog.classList.add("tutorial-dialog");
        document.body.append(dialog);
        let title = document.createElement("h1");
        title.innerText = "Bienvenue dans le tutoriel";
        dialog.append(title);
        let p = document.createElement("p");
        p.innerText = "Bienvenue sur DuoMots, un outil pour faciliter les échanges entre un enseignant de primaire et ses élèves allophones.\n\nSouhaitez-vous un tour guidé de l'application afin de vous familiarisez avec le fonctionnement de l'application ?";
        dialog.append(p);
        let buttons = document.createElement("div");
        buttons.classList.add("tutorial-buttons");
        dialog.append(buttons);
        let yes = document.createElement("button");
        yes.innerText = "Allons-y !";
        yes.addEventListener("click", stepTutorial);
        let no = document.createElement("button");
        no.innerText = "Non merci";
        no.addEventListener("click", () => {
            document.body.removeChild(dialog);
            tutorialCurrentStep = -1;
            setCookie("tutorialCurrentStep", tutorialCurrentStep, 1);
        });
        let dontaskagain = document.createElement("button");
        dontaskagain.innerText = "Ne plus me demander";
        dontaskagain.addEventListener("click", () => {
            tutorialCurrentStep = -1;
            setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
            document.body.removeChild(dialog);
        });
        buttons.appendChild(yes);
        buttons.appendChild(no);
        buttons.appendChild(dontaskagain);

    },
    () => {
        let dialog = document.querySelector(".tutorial-dialog");
        if (dialog) document.body.removeChild(dialog);

        let callbackOut = () => {
            shakeTutorial();
            document.querySelector(".tutorial-content").innerText = "Cliquez ici pour sélectionner la langue.";
        };

        showTutorialOn(document.querySelector("#content-language .box[data-lang='DE']"), "Imaginons que vous conversiez avec un de vos élève. La première étape consiste à choisir la langue vers laquelle vous aller traduire.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector("#content-language .box[data-lang='DE']"), callbackOut, () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/choose_gender.html#DE";
        let callbackOut = () => {
            shakeTutorial();
            document.querySelector(".tutorial-content").innerText = "Cliquer ici pour sélectionner le sexe de l'élève.";
        };

        showTutorialOn(document.querySelector(".box[data-gender='M']"), "Ensuite, il faut indiquer le sexe de l'élève avec lequel vous conversez.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".box[data-gender='M']"), callbackOut, () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        let cancel = preventAllClicksExcept(null, () => {
        });
        showTutorialOn(null, "Ces étapes peuvent être néanmoins répétitive, l'élève parlant en fin de compte toujours la même langue et étant toujours du même sexe. DuoMots inclut donc une fonctionnalité pour automatiser ces deux étapes.", () => {
            cancel();
            stepTutorial();
        });
        document.querySelector(".tutorial-next").innerText = "Retourner à l'accueil";
    },
    () => {
        window.location.href = "/#language";
        document.querySelector(".tutorial-next").innerHTML = "Suivant <i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i><i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i>";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".footer-right-button"), "Cliquz ici pour accéder à l'onglet \"&Eacute;l&egrave;ves\"", callbackOut);
        };
        showTutorialOn(document.querySelector(".footer-right-button"), "DuoMots vous permet de conserver une liste de vos élèves allophones. Cliquez ici pour y accéder.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".footer-right-button"), callbackOut, () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/#students";
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            let callbackOut = () => {
                shakeTutorial();
                showTutorialOn(document.querySelector(".add-button:not(.add-student-button)"), "Cliquez ici pour ajouter un élève.", callbackOut);
            };
            showTutorialOn(document.querySelector(".add-button:not(.add-student-button)"), "Vous pouvez ajouter un élève en cliquant ici.", callbackOut);
            let cancel = preventAllClicksExcept(document.querySelector(".add-button:not(.add-student-button)"), callbackOut, () => {
                cancel();
                stepTutorial();
            });
        }, 1500);
    },
    () => {
        window.location.href = "/#add-students";
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            let cancel = preventAllClicksExcept(null, () => {
                cancel();
                stepTutorial();
            });
            showTutorialOn(null, "Indiquez le nom de l'élève, la langue qu'il parle et son sexe, puis confirmez en cliquant sur le bouton +.", () => {
                cancel();
                stepTutorial();
            });
        }, 1500);
    },
    () => {
        window.location.href = "/#add-students";
        document.querySelector(".tutorial").classList.remove("visible");
        let listener = () => {
            let f0 = document.querySelector("#f0 .input-form-input");
            let f1 = document.querySelector("#f1 .input-form-input");
            let f2 = document.querySelector("#f2 .input-form-input");
            if (f0.value === "" || f1.value === "" || f2.value === "") {
                return;
            }
            document.querySelector(".add-student-button").removeEventListener("click", listener, true);
            stepTutorial();
        };
        document.querySelector(".add-student-button").addEventListener("click", listener, true);
    },
    () => {
        window.location.href = "/#students";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector("#students-list .box"), "Cliquez ici", callbackOut);
        };
        showTutorialOn(document.querySelector("#students-list .box"), "Cliquez sur l'élève pour remplir automatiquement la langue et son sexe.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector("#students-list .box"), callbackOut, () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/choose_theme.html#DE-M";
        let cancel = preventAllClicksExcept(null, () => {
            cancel();
            stepTutorial();
        });
        showTutorialOn(null, "Choisir un élève vous permet ainsi d'accéder directement à cette page sans passer par les étapes de sélection de la langue et du sexe.", () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/choose_theme.html#DE-M";
        showTutorialOn(document.querySelector(".header"), "À chaque fois que l'icône d'un haut-parleur apparaît, vous pouvez cliquer dessus pour écouter le mot ou la phrase.", () => {
            cancel();
            stepTutorial();
        });
        let cancel = preventAllClicksExcept(null, () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/choose_theme.html#DE-M";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".header"), "Cliquez ici pour écouter la phrase.", callbackOut);
        };
        showTutorialOn(document.querySelector(".header"), "Cette phrase demande à l'élève de choisir ce qu'il voulait dire. Commencez toujours par cliquer sur cette phrase pour la lire à haute voix et que l'élève comprenne ce qu'il doit faire.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".header"), callbackOut, () => {
            cancel();
        });
    },
    () => {
        window.location.href = "/choose_theme.html#DE-M";
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            showTutorialOn(null, "Dans le cadre d'une vrai utilisation, vous passeriez maintenant le téléphone à l'élève pour qu'il puisse choisir ce qu'il voulait dire. Pour ce tutoriel, vous jouerez également le rôle de l'élève.");
            let pane = document.createElement("div");
            pane.classList.add("tutorial-pane");
            document.body.appendChild(pane);
        }, 1000);
    },
    () => {
        let pane = document.querySelector(".tutorial-pane");
        if (pane) document.body.removeChild(pane);
        window.location.href = "/choose_theme.html#DE-M";
        let callbackOut = () => {
            shakeTutorial();
            document.querySelector(".tutorial-content").innerText = "Dans le cadre du tutoriel, appuyer sur ce thème.";
        };
        showTutorialOn(document.getElementById("0"), "L'élève peut maintenant choisir parmi les thèmes, à l'aide des images, le thème s'approchant le plus de ce qu'il voulait dire.", callbackOut);
        let cancel = preventAllClicksExcept(document.getElementById("0"), callbackOut, () => {
            cancel();
        });
    },
    () => {
        window.location.href = "/choose_theme.html#DE-M";
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            document.getElementById("0").classList.add("active-theme");
            let callbackOut = () => {
                shakeTutorial();
                showTutorialOn(document.querySelector(".confirm-button"), "Cliquer ici pour confirmer le thème.", callbackOut);
            };
            showTutorialOn(document.querySelector(".confirm-button"), "Le thème est lu à haute voix. Vous ou l'élève pouvez cliquer ici pour confirmer le thème ou bien choisir un autre thème en cliquant sur une autre image.", callbackOut);
            let cancel = preventAllClicksExcept(document.querySelector(".confirm-button"),
                callbackOut,
                () => {
                    cancel();
                    stepTutorial();
                });
        }, 1000);
    },
    () => {
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#questions";
        let cancel = preventAllClicksExcept(null, () => {
            cancel();
            stepTutorial();
        });
        showTutorialOn(document.getElementById("content-questions"), "Bienvenue dans l'interface principale de DuoMots. Ici se trouve la liste des questions appartenant au thème choisi.", () => {
            cancel();
            stepTutorial();
        });
    },
    () => {
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#questions";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".footer-right-button"), "Cliquez ici pour afficher les réponses.", callbackOut);
        };
        showTutorialOn(document.querySelector(".footer-right-button"), "Pour affichez les réponses au lieu des questions, cliquez ici.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".footer-right-button"),
            callbackOut,
            () => {
                cancel();
                stepTutorial();
            });
    },
    () => {
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#answers";
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            showTutorialOn(document.getElementById("content-answers"), "Ici se trouve la liste des réponses que vous pouvez donner à l'élève une fois que vous avez identifié son problème.");
            let cancel = preventAllClicksExcept(null, () => {
                cancel();
                stepTutorial();
            });
        }, 1500);
    },
    () => {
        if (window.location.pathname === "/choose_picto.html") return;
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#answers";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".content-answers .item"), "Cliquez sur cette phrase", callbackOut);
        };
        showTutorialOn(document.querySelector(".content-answers .item"), "Vous pouvez cliquer sur une des phrases pour la traduire.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".content-answers .item"),
            callbackOut,
            () => {
                cancel();
            });
    },
    () => {
        if (window.location.pathname !== "/choose_picto.html") {
            tutorialCurrentStep--;
            setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
            return reupdateTutorial();
        }
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.getElementById("0"), "Cliquez ici", callbackOut);
        }
        showTutorialOn(document.getElementById("0"), "La phrase est maintenant lue à haute voix. Repassez le téléphone à votre élève, celui-ci répond maintenant à la réponse de l'enseignant au moyen des pictogrammes, soit par <i>Je comprends</i> soit par <i>Je ne comprends pas</i>.", callbackOut);
        let cancel = preventAllClicksExcept(document.getElementById("0"),
            callbackOut,
            () => {
                cancel();
                stepTutorial();
            }
        );
    },
    () => {
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#answers";
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".footer-left-button"), "Cliquez ici", callbackOut);
        };
        showTutorialOn(document.querySelector(".footer-left-button"), "Revenez maintenant sur la liste des questions.", callbackOut);
        let cancel = preventAllClicksExcept(document.querySelector(".footer-left-button"),
            callbackOut,
            () => {
                cancel();
                stepTutorial();
            }
        );
    },
    () => {
        document.querySelector(".tutorial").classList.remove("visible");
        setTimeout(() => {
            let callbackOut = () => {
                shakeTutorial();
                showTutorialOn(document.querySelector(".footer-main-button"), "Cliquez ici pour activer la reconnaissance vocale.", callbackOut);
            }
            showTutorialOn(document.querySelector(".footer-main-button"), "Pour rendre le processus plus rapide, DuoMots supporte également la reconnaissance vocale. Cliquez ici pour mettre en route l'enregistrement.", callbackOut);
            let cancel = preventAllClicksExcept(document.querySelector(".footer-main-button"),
                callbackOut,
                () => {
                    cancel();
                    stepTutorial();
                }
            );
        }, 1000);
    },
    () => {
        window.location.href = "/translation.html?lang=DE&gender=M&theme=0#questions";
        showTutorialOn(null, "Dites quelque chose. Limitez-vous à des questions simples, non composées, auxquelles on peut toujours répondre par oui ou par non. Par exemple, demandez: <i>As-tu mal à la tête?</i> au lieu de <i>Tu as des douleurs vers la tête, la nuque?</i>.", () => {
        });
        triggerRecordingIfNotStarted();
    },
    () => {
        let element = document.querySelector(".translations-suggestions span");
        if (!element) {
            tutorialCurrentStep--;
            setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
            return reupdateTutorial();
        }
        let callbackOut = () => {
            shakeTutorial();
            showTutorialOn(document.querySelector(".translations-suggestions span"), "Cliquez ici pour traduire.", callbackOut);
        };
        showTutorialOn(document.querySelector(".translations-suggestions span"), "DuoMots pense avoir reconnu ce que vous vouliez dire. Si votre phrase était trop complexe et/ou trop différente de celle dans la base de donnée, il est possible que la phrase n'ait pas été bien reconnue. Dans ce cas, vous pouvez reprendre l'enregistrement en cliquant sur le microphone. Pour l'instant cliquez sur cette option pour la traduire.", callbackOut);
        let cancel = preventAllClicksExcept(
            document.querySelector(".translations-suggestions span"),
            callbackOut,
            () => {
                cancel();
                stepTutorial();
            });
    },
    () => {
        suppressTutorial();

        document.querySelector(".tutorial").classList.remove("visible");
        let dialog = document.createElement("div");
        dialog.classList.add("tutorial-dialog");
        document.body.append(dialog);
        let title = document.createElement("h1");
        title.innerText = "Fin du tutoriel";
        dialog.append(title);
        let p = document.createElement("p");
        p.innerText = "Vous avez terminé le tutoriel. Vous pouvez le relancer à tout moment en cliquant sur l'icône en forme de point d'interrogation en haut à droite.";
        dialog.append(p);
        let buttons = document.createElement("div");
        buttons.classList.add("tutorial-buttons");
        dialog.append(buttons);
        let ok = document.createElement("button");
        ok.innerText = "OK";
        ok.addEventListener("click", () => {
            document.body.removeChild(dialog);
            tutorialCurrentStep = -1;
            setCookie("tutorialCurrentStep", tutorialCurrentStep, 1);
            window.location.href = "/";
        });
        buttons.appendChild(ok);
    }
];
let tutorialCurrentStep = parseInt(getCookie("tutorialCurrentStep")) || 0;

function reupdateTutorial() {
    if (tutorialCurrentStep === -1) {
        return suppressTutorial();
    } else if (tutorialCurrentStep !== 0) {
        document.querySelector(".tutorial-current-step").innerText = tutorialCurrentStep + " / " + (TUTORIALS.length - 1);
    }
    return TUTORIALS[tutorialCurrentStep]();
}

function stepTutorial() {
    if (tutorialCurrentStep === -1) {
        return suppressTutorial();
    }
    console.log("Step", tutorialCurrentStep);
    tutorialCurrentStep++;
    setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
    reupdateTutorial();
}

let TUTORIAL_NEXT_CALLBACK = stepTutorial;


window.addEventListener("load", function () {
    let tutorial = document.querySelector(".tutorial");

    let main = document.createElement("div");
    main.classList.add("tutorial-main");
    tutorial.appendChild(main);
    let buttons = document.createElement("div");
    buttons.classList.add("tutorial-buttons");
    tutorial.appendChild(buttons);

    let close = document.createElement("button");
    close.classList.add("tutorial-close");
    close.innerText = "[X]";
    close.addEventListener("click", () => {
        suppressTutorial();
        tutorialCurrentStep = -1;
        setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
    });
    main.appendChild(close);
    let content = document.createElement("p");
    content.classList.add("tutorial-content");
    main.appendChild(content);

    let next = document.createElement("button");
    next.classList.add("tutorial-next");
    next.innerHTML = "Suivant <i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i><i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i>";
    next.addEventListener("click", e => {
        TUTORIAL_NEXT_CALLBACK(e)
    });
    buttons.appendChild(next);
    let currentStep = document.createElement("span");
    currentStep.classList.add("tutorial-current-step");
    buttons.appendChild(currentStep);

    setTimeout(() => reupdateTutorial(), 1000);
}, true);


function triggerTutorialHook(hook) {
    if (tutorialCurrentStep === -1 && hook !== "restart") return;
    if (hook === "speaking_started") {
        if (tutorialCurrentStep === 11) {
            showTutorialOn(document.querySelector(".header"), "<i class='fas fa-volume-up'></i>", () => shakeTutorial());
        } else if (tutorialCurrentStep === 13) {
            showTutorialOn(document.getElementById("0"), "<i class='fas fa-volume-up'></i>", () => shakeTutorial());
        }

    } else if (hook === "speaking_ended") {
        stepTutorial();
    } else if (hook === "recording_success" && tutorialCurrentStep === 22) {
        stepTutorial()
    } else if (hook === "recording_failure" && tutorialCurrentStep === 22) {
        shakeTutorial();
        showTutorialOn(null, "Désolé, je n'ai pas compris ce que vous avez dit. Essayez de parler plus clairement.", () => {
        });
    } else if (hook === "restart") {
        tutorialCurrentStep = 0;
        setCookie("tutorialCurrentStep", tutorialCurrentStep, 365);
        reupdateTutorial();
    }
}