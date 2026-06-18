// --- 1. MOCK DATABASE & STATE ENGINE ---
const DEFAULT_USERS = [
  { id: 'u1', name: 'Ahmed', karma: 120, avatar: 'A' },
  { id: 'u2', name: 'Sara', karma: 485, avatar: 'S' },
  { id: 'u3', name: 'Tareq', karma: 95, avatar: 'T' }
];

const DEFAULT_ITEMS = [
  { id: 'i1', name: 'Makita Power Drill', category: 'Tools', ownerId: 'u1', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'i2', name: 'Sony Alpha A7III', category: 'Electronics', ownerId: 'u2', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 'i3', name: 'Camping Tent', category: 'Leisure', ownerId: 'u3', status: 'Borrowed', borrowerId: 'u1', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'i4', name: 'Electric Scooter', category: 'Vehicles', ownerId: 'u2', status: 'Borrowed', borrowerId: 'u3', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 'i5', name: 'DJI Mini 3 Drone', category: 'Electronics', ownerId: 'u1', status: 'Available', borrowerId: null, bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }
];

let db = { users: [], items: [] };
let currentUser = null;
let currentTab = 'explore';
let currentCategory = 'All';

// --- 2. INITIALIZATION & STORAGE ---
function initDB() {
  const storedDB = localStorage.getItem('shareme_db');
  if (storedDB) {
    db = JSON.parse(storedDB);
  } else {
    db = { users: JSON.parse(JSON.stringify(DEFAULT_USERS)), items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)) };
    saveDB();
  }
  
  const storedUserId = localStorage.getItem('shareme_active_user') || 'u1';
  currentUser = db.users.find(u => u.id === storedUserId) || db.users[0];
  document.getElementById('user-switcher').value = currentUser.id;
}

function saveDB() {
  localStorage.setItem('shareme_db', JSON.stringify(db));
}

function resetDB() {
  localStorage.clear();
  initDB();
  renderApp();
  showToast("Database reset to defaults.");
}

// --- 3. DOM ELEMENTS ---
const elements = {
  userName: document.getElementById('user-name'),
  userAvatar: document.getElementById('user-avatar'),
  userKarma: document.getElementById('user-karma'),
  grid: document.getElementById('inventory-grid'),
  segmentBg: document.getElementById('segment-bg'),
  segmentBtns: document.querySelectorAll('.segment-btn'),
  catPills: document.querySelectorAll('.cat-pill'),
  userSwitcher: document.getElementById('user-switcher'),
  resetBtn: document.getElementById('reset-db'),
  sheetOverlay: document.getElementById('sheet-overlay'),
  sheetContent: document.getElementById('sheet-content'),
  addModal: document.getElementById('add-modal'),
  fabAdd: document.getElementById('fab-add'),
  closeModalBtn: document.getElementById('close-modal'),
  addItemForm: document.getElementById('add-item-form'),
  toastContainer: document.getElementById('toast-container')
};

// --- 4. RENDER PIPELINE ---
function renderApp() {
  renderHeader();
  renderGrid();
}

function renderHeader() {
  elements.userName.textContent = currentUser.name;
  elements.userAvatar.textContent = currentUser.avatar;
  
  // Animate karma update
  const oldKarma = parseInt(elements.userKarma.textContent);
  if (oldKarma !== currentUser.karma) {
    elements.userKarma.style.transform = 'scale(1.2)';
    setTimeout(() => elements.userKarma.style.transform = 'scale(1)', 300);
  }
  elements.userKarma.textContent = currentUser.karma;
}

function renderGrid() {
  elements.grid.innerHTML = '';
  
  let filteredItems = db.items.filter(item => {
    // Tab filtering
    if (currentTab === 'mine' && item.ownerId !== currentUser.id) return false;
    if (currentTab === 'borrowed' && item.borrowerId !== currentUser.id) return false;
    if (currentTab === 'explore' && item.ownerId === currentUser.id && item.status === 'Available') return false; // Optional: hide own available items from explore, but let's keep them for demo, or filter if strict peer-to-peer. Let's show all for demo richness.
    
    // Category filtering
    if (currentCategory !== 'All' && item.category !== currentCategory) return false;
    
    return true;
  });

  if (filteredItems.length === 0) {
    elements.grid.innerHTML = `<div style="text-align:center; padding: 40px 0; color: var(--text-secondary); font-weight: 500;">No items found.</div>`;
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
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="card-visual" style="background: ${item.bg}"></div>
      <div class="card-info">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-context">${contextString}</p>
        <span class="status-badge ${item.status.toLowerCase()}">${item.status}</span>
      </div>
    `;
    
    card.addEventListener('click', () => openBottomSheet(item));
    elements.grid.appendChild(card);
  });
}

// --- 5. INTERACTION & WORKFLOW LOGIC ---

// Segmented Control (Tabs)
elements.segmentBtns.forEach((btn, index) => {
  btn.addEventListener('click', (e) => {
    elements.segmentBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Move sliding backplate
    elements.segmentBg.style.transform = `translateX(${index * 100}%)`;
    
    currentTab = e.target.getAttribute('data-tab');
    renderGrid();
  });
});

// Categories
elements.catPills.forEach(pill => {
  pill.addEventListener('click', (e) => {
    const target = e.currentTarget;
    elements.catPills.forEach(p => p.classList.remove('active'));
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
      actionHtml = `<button class="btn-primary" id="btn-return" style="background: #111;">Mark as Returned</button>`;
    } else {
      actionHtml = `<button class="btn-primary" disabled style="background: #E0E0E0; color: #999; cursor: not-allowed;">Your Item is Available</button>`;
    }
  } else {
    if (item.status === 'Available') {
      actionHtml = `<button class="btn-primary" id="btn-borrow">Request to Borrow</button>`;
    } else if (item.borrowerId === currentUser.id) {
      actionHtml = `<button class="btn-primary" id="btn-return" style="background: #111;">Return Item</button>`;
    } else {
      actionHtml = `<button class="btn-primary" disabled style="background: #E0E0E0; color: #999; cursor: not-allowed;">Currently Unavailable</button>`;
    }
  }

  elements.sheetContent.innerHTML = `
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

  elements.sheetOverlay.classList.remove('hidden');

  // Bind Sheet Actions
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
  elements.sheetOverlay.classList.add('hidden');
}

elements.sheetOverlay.addEventListener('click', (e) => {
  if (e.target === elements.sheetOverlay) closeBottomSheet();
});

// Add Item Modal & Form
elements.fabAdd.addEventListener('click', () => elements.addModal.classList.remove('hidden'));
elements.closeModalBtn.addEventListener('click', () => elements.addModal.classList.add('hidden'));

elements.addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('item-name').value;
  const category = document.getElementById('item-category').value;
  
  // Generate random vibrant gradient for mockup
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
  
  // Add Karma
  const userIndex = db.users.findIndex(u => u.id === currentUser.id);
  db.users[userIndex].karma += 5;
  currentUser.karma += 5;
  
  saveDB();
  elements.addItemForm.reset();
  elements.addModal.classList.add('hidden');
  
  showToast(`+5 Karma! Added ${name} to inventory.`);
  renderApp(); // Updates header (karma) and grid
});

// Toast System
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/></svg>
    ${message}
  `;
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 400); // Wait for exit animation
  }, 3000);
}

// Dev Console Interactions
elements.userSwitcher.addEventListener('change', (e) => {
  const selectedId = e.target.value;
  currentUser = db.users.find(u => u.id === selectedId);
  localStorage.setItem('shareme_active_user', selectedId);
  
  // Reset UI back to explore view for demo clarity
  elements.segmentBtns[0].click(); 
  
  renderApp();
  showToast(`Switched active profile to ${currentUser.name}`);
});

elements.resetBtn.addEventListener('click', resetDB);

// Boot
initDB();
renderApp();