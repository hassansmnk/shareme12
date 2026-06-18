// --- 1. MOCK DATABASE & STATE ENGINE ---
const DEFAULT_USERS = [
  { id: 'u1', name: 'Ahmed', karma: 120, avatar: 'A', email: 'ahmed@shareme.app' },
  { id: 'u2', name: 'Sara', karma: 485, avatar: 'S', email: 'sara@shareme.app' }
];

const DEFAULT_ITEMS = [
  { id: 'i1', name: 'Makita Power Drill', category: 'Tools', ownerId: 'u1', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'i2', name: 'Sony Alpha A7III', category: 'Electronics', ownerId: 'u2', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 'i3', name: 'Camping Tent', category: 'Leisure', ownerId: 'u2', status: 'Borrowed', borrowerId: 'u1', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'i4', name: 'Electric Scooter', category: 'Vehicles', ownerId: 'u2', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' }
];

let db = { users: [], items: [] };
let currentUser = null;
let currentTab = 'explore';
let currentCategory = 'All';
let authMode = 'login'; // 'login' or 'signup'

// --- 2. DOM ELEMENTS ---
const views = {
  loader: document.getElementById('view-loader'),
  auth: document.getElementById('view-auth'),
  app: document.getElementById('view-app')
};

const authElements = {
  tabLogin: document.getElementById('tab-login'),
  tabSignup: document.getElementById('tab-signup'),
  indicator: document.getElementById('auth-indicator'),
  form: document.getElementById('auth-form'),
  nameGroup: document.getElementById('group-name'),
  nameInput: document.getElementById('auth-name'),
  emailInput: document.getElementById('auth-email'),
  submitBtn: document.getElementById('auth-submit-btn')
};

const appElements = {
  userName: document.getElementById('user-name'),
  userAvatar: document.getElementById('user-avatar'),
  userKarma: document.getElementById('user-karma'),
  grid: document.getElementById('inventory-grid'),
  segmentBg: document.getElementById('segment-bg'),
  segmentBtns: document.querySelectorAll('.segment-btn'),
  catPills: document.querySelectorAll('.cat-pill'),
  sheetOverlay: document.getElementById('sheet-overlay'),
  sheetContent: document.getElementById('sheet-content'),
  addModal: document.getElementById('add-modal'),
  fabAdd: document.getElementById('fab-add'),
  closeModalBtn: document.getElementById('close-modal'),
  addItemForm: document.getElementById('add-item-form'),
  toastContainer: document.getElementById('toast-container')
};

// --- 3. INITIALIZATION & VIEW ROUTING ---
function init() {
  const storedDB = localStorage.getItem('shareme_db');
  if (storedDB) {
    db = JSON.parse(storedDB);
  } else {
    db = { users: JSON.parse(JSON.stringify(DEFAULT_USERS)), items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)) };
    saveDB();
  }

  // Simulate loading sequence
  setTimeout(() => {
    switchView(views.loader, views.auth);
  }, 2200);
}

function saveDB() {
  localStorage.setItem('shareme_db', JSON.stringify(db));
}

function switchView(hideView, showView) {
  hideView.classList.remove('active');
  hideView.classList.add('hidden');
  
  setTimeout(() => {
    showView.classList.remove('hidden');
    showView.classList.add('active');
  }, 100); // slight delay for smooth kinetic handoff
}

// --- 4. AUTHENTICATION LOGIC ---
authElements.tabLogin.addEventListener('click', () => setAuthMode('login'));
authElements.tabSignup.addEventListener('click', () => setAuthMode('signup'));

function setAuthMode(mode) {
  authMode = mode;
  if (mode === 'login') {
    authElements.tabLogin.classList.add('active');
    authElements.tabSignup.classList.remove('active');
    authElements.indicator.style.transform = 'translateX(0)';
    authElements.nameGroup.classList.add('hidden');
    authElements.nameInput.removeAttribute('required');
    authElements.submitBtn.textContent = 'Log In';
  } else {
    authElements.tabSignup.classList.add('active');
    authElements.tabLogin.classList.remove('active');
    authElements.indicator.style.transform = 'translateX(100%)';
    authElements.nameGroup.classList.remove('hidden');
    authElements.nameInput.setAttribute('required', 'true');
    authElements.submitBtn.textContent = 'Create Account';
  }
}

authElements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = authElements.emailInput.value.toLowerCase();
  
  if (authMode === 'login') {
    // Mock login check
    const user = db.users.find(u => u.email === email);
    if (user) {
      currentUser = user;
      completeLogin();
    } else {
      // Auto-fallback to default user for simulation if not found
      currentUser = db.users[0];
      completeLogin();
      showToast("Simulation: Logged in as default user.");
    }
  } else {
    // Mock signup
    const name = authElements.nameInput.value;
    const newUser = {
      id: 'u' + Date.now(),
      name: name,
      email: email,
      karma: 50, // starting bonus
      avatar: name.charAt(0).toUpperCase()
    };
    db.users.push(newUser);
    saveDB();
    currentUser = newUser;
    completeLogin();
    showToast("Account created successfully.");
  }
});

function completeLogin() {
  renderApp();
  switchView(views.auth, views.app);
}

// --- 5. APP RENDER PIPELINE ---
function renderApp() {
  appElements.userName.textContent = currentUser.name;
  appElements.userAvatar.textContent = currentUser.avatar;
  
  const oldKarma = parseInt(appElements.userKarma.textContent) || 0;
  if (oldKarma !== currentUser.karma && oldKarma !== 0) {
    appElements.userKarma.style.transform = 'scale(1.3)';
    setTimeout(() => appElements.userKarma.style.transform = 'scale(1)', 300);
  }
  appElements.userKarma.textContent = currentUser.karma;
  
  renderGrid();
}

function renderGrid() {
  appElements.grid.innerHTML = '';
  
  let filteredItems = db.items.filter(item => {
    if (currentTab === 'mine' && item.ownerId !== currentUser.id) return false;
    if (currentTab === 'borrowed' && item.borrowerId !== currentUser.id) return false;
    if (currentCategory !== 'All' && item.category !== currentCategory) return false;
    return true;
  });

  if (filteredItems.length === 0) {
    appElements.grid.innerHTML = `<div style="text-align:center; padding: 60px 0; color: var(--text-secondary); font-weight: 500;">No items found in this section.</div>`;
    return;
  }

  filteredItems.forEach((item, index) => {
    const owner = db.users.find(u => u.id === item.ownerId);
    const borrower = item.borrowerId ? db.users.find(u => u.id === item.borrowerId) : null;
    
    let contextString = `Owned by ${owner.id === currentUser.id ? 'you' : owner.name}`;
    if (item.status === 'Borrowed') {
      contextString = `Possessed by ${borrower.id === currentUser.id ? 'you' : borrower.name}`;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.06}s`;
    card.innerHTML = `
      <div class="card-visual" style="background: ${item.bg}"></div>
      <div class="card-info">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-context">${contextString}</p>
        <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
      </div>
    `;
    
    card.addEventListener('click', () => openBottomSheet(item));
    appElements.grid.appendChild(card);
  });
}

// --- 6. INTERACTION LOGIC ---

// Tabs
appElements.segmentBtns.forEach((btn, index) => {
  btn.addEventListener('click', (e) => {
    appElements.segmentBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    appElements.segmentBg.style.transform = `translateX(${index * 100}%)`;
    currentTab = e.target.getAttribute('data-tab');
    renderGrid();
  });
});

// Categories
appElements.catPills.forEach(pill => {
  pill.addEventListener('click', (e) => {
    const target = e.currentTarget;
    appElements.catPills.forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    currentCategory = target.getAttribute('data-cat');
    renderGrid();
  });
});

// Bottom Sheet
function openBottomSheet(item) {
  const owner = db.users.find(u => u.id === item.ownerId);
  
  let actionHtml = '';
  if (item.ownerId === currentUser.id) {
    if (item.status === 'Borrowed') {
      actionHtml = `<button class="btn-primary" id="btn-return" style="background: var(--text-primary);">Mark as Returned</button>`;
    } else {
      actionHtml = `<button class="btn-primary" disabled style="background: #E0E0E0; color: #999; cursor: not-allowed;">Your Item is Available</button>`;
    }
  } else {
    if (item.status === 'Available') {
      actionHtml = `<button class="btn-primary" id="btn-borrow">Request to Borrow</button>`;
    } else if (item.borrowerId === currentUser.id) {
      actionHtml = `<button class="btn-primary" id="btn-return" style="background: var(--text-primary);">Return Item</button>`;
    } else {
      actionHtml = `<button class="btn-primary" disabled style="background: #E0E0E0; color: #999; cursor: not-allowed;">Currently Unavailable</button>`;
    }
  }

  appElements.sheetContent.innerHTML = `
    <div class="sheet-hero" style="background: ${item.bg}"></div>
    <h2 class="sheet-title">${item.name}</h2>
    <div class="sheet-meta">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Owner: ${owner.id === currentUser.id ? 'You' : owner.name}
      <span style="margin: 0 8px;">•</span>
      <span class="status-badge ${item.status.toLowerCase()}" style="padding: 4px 8px;">${item.status}</span>
    </div>
    ${actionHtml}
  `;

  appElements.sheetOverlay.classList.remove('hidden');

  const btnBorrow = document.getElementById('btn-borrow');
  const btnReturn = document.getElementById('btn-return');

  if (btnBorrow) {
    btnBorrow.addEventListener('click', () => {
      item.status = 'Borrowed';
      item.borrowerId = currentUser.id;
      saveDB();
      closeBottomSheet();
      showToast(`Successfully borrowed ${item.name}!`);
      renderGrid();
    });
  }

  if (btnReturn) {
    btnReturn.addEventListener('click', () => {
      item.status = 'Available';
      item.borrowerId = null;
      saveDB();
      closeBottomSheet();
      showToast(`${item.name} has been returned.`);
      renderGrid();
    });
  }
}

function closeBottomSheet() {
  appElements.sheetOverlay.classList.add('hidden');
}

appElements.sheetOverlay.addEventListener('click', (e) => {
  if (e.target === appElements.sheetOverlay) closeBottomSheet();
});

// Add Item Flow
appElements.fabAdd.addEventListener('click', () => appElements.addModal.classList.remove('hidden'));
appElements.closeModalBtn.addEventListener('click', () => appElements.addModal.classList.add('hidden'));

appElements.addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('item-name').value;
  const category = document.getElementById('item-category').value;
  
  const hues = [Math.floor(Math.random() * 360), Math.floor(Math.random() * 360)];
  const bg = `linear-gradient(135deg, hsl(${hues[0]}, 80%, 75%) 0%, hsl(${hues[1]}, 80%, 85%) 100%)`;

  const newItem = {
    id: 'i' + Date.now(),
    name, category, bg,
    ownerId: currentUser.id,
    status: 'Available',
    borrowerId: null
  };

  db.items.unshift(newItem);
  
  const userIndex = db.users.findIndex(u => u.id === currentUser.id);
  db.users[userIndex].karma += 5;
  currentUser.karma += 5;
  
  saveDB();
  appElements.addItemForm.reset();
  appElements.addModal.classList.add('hidden');
  
  showToast(`+5 Karma! Added ${name}.`);
  renderApp(); 
});

// Toast System
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/></svg>
    ${message}
  `;
  appElements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 400); 
  }, 3000);
}

// Boot Sequence
init();
