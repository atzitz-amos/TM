function showMenu() {
    let bbox = document.querySelector('.taskbar-options').getBoundingClientRect();

    let menu = document.createElement('div');
    menu.className = 'taskbar-options-menu';
    let showAbout = document.createElement('div');
    showAbout.className = 'taskbar-option';
    showAbout.innerText = 'À propos';
    showAbout.addEventListener('click', () => window.location.href = "/about.html");
    menu.appendChild(showAbout);
    let showTutorial = document.createElement('div');
    showTutorial.className = 'taskbar-option';
    showTutorial.innerText = 'Tutoriel';
    showTutorial.addEventListener('click', () => {
        document.body.removeChild(menu);
        triggerTutorialHook("restart");
    });
    menu.appendChild(showTutorial);

    document.body.appendChild(menu);
    menu.style.top = bbox.bottom + 10 + 'px';
    menu.style.left = bbox.right - menu.clientWidth + 'px';
}

window.addEventListener('load', function () {
    document.querySelector(".taskbar-options").addEventListener('click', function () {
        let menu = document.querySelector(".taskbar-options-menu");
        if (menu) document.body.removeChild(menu)
        else showMenu();
    });

    document.body.addEventListener('click', function (e) {
        let menu = document.querySelector(".taskbar-options-menu");
        if (!menu) return;
        if (document.querySelector(".taskbar-options").contains(e.target) || menu.contains(e.target)) return;
        document.body.removeChild(menu)
    });
}, true);