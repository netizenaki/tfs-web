// Demo university data (replace with real data or fetch from API)
const universities = [
  {
    id: 'tum',
    name: 'Technical University of Munich',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_TUM.svg',
    location: 'Munich, Germany',
    tags: ['Public', 'English', 'Scholarship available'],
    desc: 'One of Europe’s top universities, offering programs in engineering, natural sciences, life sciences, medicine, and social sciences.',
    tuition: 0,
    language: 'english',
    program: ['cs', 'engineering', 'business'],
    type: 'public',
    region: 'germany',
  },
  {
    id: 'lmum',
    name: 'Ludwig Maximilian University of Munich',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/LMU_Muenchen_Logo.svg',
    location: 'Munich, Germany',
    tags: ['Public', 'English'],
    desc: 'Renowned for research and teaching, LMU offers a wide range of programs and is one of Germany’s oldest universities.',
    tuition: 0,
    language: 'english',
    program: ['cs', 'business', 'design'],
    type: 'public',
    region: 'germany',
  },
  {
    id: 'htw',
    name: 'HTW Berlin',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/HTW_Berlin_Logo.svg',
    location: 'Berlin, Germany',
    tags: ['Applied Sciences', 'English'],
    desc: 'Berlin’s largest university of applied sciences, offering practice-oriented programs in engineering, business, and design.',
    tuition: 500,
    language: 'english',
    program: ['cs', 'business', 'design'],
    type: 'applied',
    region: 'germany',
  },
];

// Shortlist logic
const shortlistKey = 'tfs-shortlist';
function getShortlist() {
  return JSON.parse(localStorage.getItem(shortlistKey) || '[]');
}
function setShortlist(list) {
  localStorage.setItem(shortlistKey, JSON.stringify(list));
}
function isShortlisted(id) {
  return getShortlist().includes(id);
}
function addToShortlist(id) {
  const list = getShortlist();
  if (!list.includes(id)) {
    list.push(id);
    setShortlist(list);
    showToast('Added to shortlist');
    updateShortlistCount();
    renderUniversityGrid();
  }
}
function removeFromShortlist(id) {
  let list = getShortlist();
  list = list.filter(x => x !== id);
  setShortlist(list);
  updateShortlistCount();
  renderUniversityGrid();
}
function updateShortlistCount() {
  document.getElementById('shortlist-count').textContent = getShortlist().length;
}

// Toast feedback
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.background = '#222';
    toast.style.color = '#fff';
    toast.style.padding = '1em 2em';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.13)';
    toast.style.zIndex = 2000;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
  }, 1400);
}

// Render university cards
function renderUniversityGrid() {
  const grid = document.getElementById('university-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const filters = getFilters();
  let filtered = universities.filter(u => {
    if (filters.country && u.region !== filters.country) return false;
    if (filters.language && u.language !== filters.language) return false;
    if (filters.type && u.type !== filters.type) return false;
    if (filters.program && !u.program.includes(filters.program)) return false;
    if (filters.tuition && u.tuition > filters.tuition) return false;
    return true;
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="padding:2em;">No universities found for your filters.</div>';
    return;
  }
  for (const u of filtered) {
    const card = document.createElement('div');
    card.className = 'university-card';
    card.innerHTML = `
      <img class="university-logo" src="${u.logo}" alt="${u.name} logo" />
      <div class="university-name">${u.name}</div>
      <div class="university-location">${u.location}</div>
      <div class="university-tags">
        ${u.tags.map(tag => `<span class="university-tag">${tag}</span>`).join(' ')}
      </div>
      <div class="university-desc">${u.desc}</div>
      <div class="university-actions">
        <a href="/explore/universities/${u.id}.html" class="btn-primary">View details</a>
        <button class="btn-shortlist${isShortlisted(u.id) ? ' filled' : ''}" title="Add to shortlist" data-id="${u.id}">
          <span class="star">${isShortlisted(u.id) ? '⭐' : '☆'}</span>
        </button>
      </div>
    `;
    card.querySelector('.btn-shortlist').onclick = (e) => {
      e.preventDefault();
      if (isShortlisted(u.id)) {
        removeFromShortlist(u.id);
      } else {
        addToShortlist(u.id);
      }
      // Animate icon
      const star = card.querySelector('.star');
      star.style.transform = 'scale(1.3)';
      setTimeout(() => star.style.transform = '', 180);
    };
    grid.appendChild(card);
  }
}

// Filters
function getFilters() {
  return {
    country: document.getElementById('filter-country').value,
    tuition: Number(document.getElementById('filter-tuition').value),
    language: document.getElementById('filter-language').value,
    program: document.getElementById('filter-program').value,
    type: document.getElementById('filter-type').value,
  };
}
document.getElementById('filter-form').onsubmit = function(e) {
  e.preventDefault();
  renderUniversityGrid();
};
document.getElementById('filter-tuition').oninput = function(e) {
  document.getElementById('tuition-value').textContent = `0 - ${e.target.value}`;
};

// Shortlist modal
const shortlistIcon = document.getElementById('shortlist-icon');
const shortlistModal = document.getElementById('shortlist-modal');
const shortlistList = document.getElementById('shortlist-list');
const closeShortlist = document.getElementById('close-shortlist');
shortlistIcon.onclick = function() {
  renderShortlistModal();
  shortlistModal.classList.remove('hidden');
};
closeShortlist.onclick = function() {
  shortlistModal.classList.add('hidden');
};
function renderShortlistModal() {
  const list = getShortlist();
  if (list.length === 0) {
    shortlistList.innerHTML = '<div style="padding:1em;">Your shortlist is empty.</div>';
    return;
  }
  shortlistList.innerHTML = '';
  for (const id of list) {
    const u = universities.find(x => x.id === id);
    if (!u) continue;
    const item = document.createElement('div');
    item.className = 'university-card';
    item.style.marginBottom = '1em';
    item.innerHTML = `
      <img class="university-logo" src="${u.logo}" alt="${u.name} logo" />
      <div class="university-name">${u.name}</div>
      <div class="university-location">${u.location}</div>
      <div class="university-tags">
        ${u.tags.map(tag => `<span class="university-tag">${tag}</span>`).join(' ')}
      </div>
      <div class="university-actions">
        <a href="/explore/universities/${u.id}.html" class="btn-primary">View details</a>
        <button class="btn-shortlist filled" title="Remove from shortlist" data-id="${u.id}"><span class="star">⭐</span></button>
      </div>
    `;
    item.querySelector('.btn-shortlist').onclick = (e) => {
      e.preventDefault();
      removeFromShortlist(u.id);
      renderShortlistModal();
    };
    shortlistList.appendChild(item);
  }
}

// On load
updateShortlistCount();
renderUniversityGrid();
