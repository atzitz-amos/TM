document.onreadystatechange = function (e) {
    document.querySelectorAll('.page').forEach((page) => {
        setInterval(() => {
            page.contentWindow.document.body.style.width = window.visualViewport.width + "px";
            page.contentWindow.document.body.style.height = window.visualViewport.height + "px";
        }, 1000);

        page.contentWindow.window.transition = function (to) {
            console.log("Transitioning from " + page.id + " to " + to);
        };
    });
};