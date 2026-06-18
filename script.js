// Navigation Helper
function showView(id) {
    document.querySelectorAll('.view-layer').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// 1. Loading Sequence
window.onload = () => {
    setTimeout(() => {
        document.getElementById('progress-bar').style.width = '100%';
    }, 100);
    setTimeout(() => showView('view-auth'), 2200);
};

// 2. Auth Logic
document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    showView('view-app');
};

// 3. Profile Navigation
document.getElementById('btn-profile').onclick = () => {
    document.getElementById('profile-details').innerHTML = `
        <p>Name: Ahmed</p>
        <p>Points: 120</p>
        <p>History: Drills, Tents</p>
    `;
    showView('view-profile');
};

document.getElementById('btn-back').onclick = () => showView('view-app');
