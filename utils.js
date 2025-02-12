


export function requestFullScreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
        document.documentElement.msRequestFullscreen();
    }
}

export function checkFullscreen() {
    const overlay = document.getElementById('overlay');
    if (document.fullscreenElement) {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.remove('hidden');
    }
}