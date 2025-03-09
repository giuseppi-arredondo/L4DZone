window.addEventListener('scroll', function() {
    var header = document.querySelector('header');

    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

function showOverlay(section) {
    var overlay = document.getElementById('overlay');
    var contents = document.querySelectorAll('.overlay-content');
    overlay.classList.add('show');
    
    contents.forEach(content => content.classList.remove('show'));

    document.getElementById(section).classList.add('show');
}

function closeOverlay() {
    document.getElementById('overlay').classList.remove('show');
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeOverlay();
    }
});

document.getElementById('overlay').addEventListener('click', function(event) {
    if (event.target === this) {
        closeOverlay();
    }
});
