const views = { loader: document.getElementById('view-loader'), auth: document.getElementById('view-auth'), app: document.getElementById('view-app'), profile: document.getElementById('view-profile') };
let currentUser = { name: 'Ahmed', karma: 120, items: ['Power Drill'], history: ['Camping Tent'] };

function switchView(hide, show) {
  hide.classList.remove('active'); hide.classList.add('hidden');
  show.classList.remove('hidden'); show.classList.add('active');
}

// Init Loading
window.onload = () => {
  document.getElementById('loading-progress').style.width = '100%';
  setTimeout(() => switchView(views.loader, views.auth), 2000);
};

// Login Logic
document.getElementById('auth-form').onsubmit = (e) => {
  e.preventDefault();
  switchView(views.auth, views.app);
};

// Profile Logic
function showProfile() {
  document.getElementById('profile-content').innerHTML = `
    <h2>${currentUser.name}</h2>
    <p>Points: ${currentUser.karma}</p>
    <h3>Owned: ${currentUser.items.join(', ')}</h3>
    <h3>History: ${currentUser.history.join(', ')}</h3>
  `;
  switchView(views.app, views.profile);
}
