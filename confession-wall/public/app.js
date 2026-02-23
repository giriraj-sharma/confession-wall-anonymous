// Small API helper
async function api(path, opts = {}){
  const res = await fetch(path, opts);
  try { return await res.json(); } catch(e){ return {}; }
}

// Elements
const authBtn = document.getElementById('auth-btn');
const confessionsEl = document.getElementById('confessions');
const postModal = document.getElementById('post-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSubmit = document.getElementById('modal-submit');
const sidebarPost = document.getElementById('sidebar-post-btn');
const postForm = document.getElementById('post-form');
const postTextarea = document.getElementById('post-textarea');
const postSecret = document.getElementById('post-secret');

// Force dark theme (toggle removed)
document.documentElement.setAttribute('data-theme', 'dark');

// Modal controls
// Enhanced modal controls with animations
function animateIn(el){
  el.classList.remove('hidden');
  el.animate([{opacity:0, transform:'scale(0.98)'},{opacity:1, transform:'scale(1)'}], {duration:260, easing:'cubic-bezier(.2,.9,.2,1)'});
}
function animateOut(el, cb){
  const a = el.animate([{opacity:1, transform:'scale(1)'},{opacity:0, transform:'scale(0.98)'}], {duration:180, easing:'cubic-bezier(.2,.9,.2,1)'});
  a.onfinish = ()=>{ el.classList.add('hidden'); if (cb) cb(); };
}

function openModal(){ animateIn(postModal); postModal.setAttribute('aria-hidden','false'); setTimeout(()=> postTextarea.focus(),80); }
function closeModal(){ animateOut(postModal, ()=>{ postModal.setAttribute('aria-hidden','true'); postForm.reset(); resetFieldStates(); }); }

sidebarPost.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
postModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

let currentUser = null;

// Auth & user
async function loadUser(){
  const data = await api('/api/me');
  const landing = document.getElementById('landing');
  const dashboard = document.getElementById('dashboard');
  if (data.loggedIn){
    // show dashboard
    currentUser = data.user || null;
    if (landing) landing.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    // set logout link
    authBtn.textContent = 'Logout';
    authBtn.href = '/auth/logout';
    // profile handled via auth button only
  } else {
    // show landing
    if (landing) landing.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
    authBtn.textContent = 'Login';
    authBtn.href = '/auth/google';
    
  }
}

// Routing
const navItems = document.querySelectorAll('.nav-item');
function setActiveNav(view){
  navItems.forEach(i=>{
    if (i.dataset.view === view) i.classList.add('active'); else i.classList.remove('active');
  });
}

function showView(view){
  const confSection = document.getElementById('confessions');
  confSection.classList.remove('hidden');
  if (view === 'my') loadConfs({ userId: currentUser && currentUser.id }); else loadConfs();
  setActiveNav(view);
}

function navigateToPath(path, replace=false){
  if (path === '/' ){
    // send user to landing page (server will serve landing.html)
    window.location.href = '/';
    return;
  }
  // ensure dashboard visible (dashboard.html is the SPA entry)
  const dashboardEl = document.getElementById('dashboard');
  if (dashboardEl) dashboardEl.classList.remove('hidden');
  if (path === '/dashboard' || path === '/'){ showView('home'); history.pushState({path:'/dashboard'}, '', '/dashboard'); }
  else if (path === '/my-confessions'){ showView('my'); history.pushState({path:'/my-confessions'}, '', '/my-confessions'); }
  
}

window.addEventListener('popstate', (e)=>{
  const p = location.pathname;
  if (p === '/' ) navigateToPath('/');
  else if (p === '/dashboard') navigateToPath('/dashboard');
  else if (p === '/my-confessions') navigateToPath('/my-confessions');
  
});

// Sidebar navigation handlers
navItems.forEach(item=>{
  item.addEventListener('click', (e)=>{
    const view = item.dataset.view;
    if (item.id === 'sidebar-post-btn'){ openModal(); return; }
    if (!view) return;
    if (view === 'home') navigateToPath('/dashboard');
    else if (view === 'my') navigateToPath('/my-confessions');
    
  });
});

// profile removed: auth actions available via auth button in topbar

// Render confessions
async function loadConfs(opts={}){
  const query = opts.userId ? `?userId=${encodeURIComponent(opts.userId)}` : '';
  const confs = await api('/confessions' + query);
  confessionsEl.innerHTML = '';
  if (!confs || confs.length===0){
    confessionsEl.innerHTML = '<div class="placeholder">No confessions yet. Be the first.</div>';
    return;
  }
  confs.forEach(c => {
    const card = document.createElement('article');
    card.className = 'conf-card';

    const meta = document.createElement('div');
    meta.className = 'conf-meta';
    const badge = document.createElement('span'); badge.className='badge'; badge.textContent='Anonymous';
    const date = document.createElement('span'); date.textContent = new Date(c.createdAt).toLocaleString();
    meta.appendChild(badge); meta.appendChild(date);

    const text = document.createElement('div');
    text.className = 'conf-text';
    text.textContent = c.text;

    const reactions = document.createElement('div'); reactions.className='reactions';
    ['like','love','laugh'].forEach(type=>{
      const pill = document.createElement('button');
      pill.className='pill';
      pill.innerHTML = `${type === 'like' ? '👍' : type==='love' ? '❤️' : '😂'} <span class="count">${(c.reactions&&c.reactions[type])||0}</span>`;
      pill.title = type;
      pill.addEventListener('click', async ()=>{
        pill.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }], { duration: 160 });
        await api('/confessions/'+c._id+'/react', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})});
        loadConfs();
      });
      reactions.appendChild(pill);
    });

    const controls = document.createElement('div'); controls.style.marginTop='10px';
    const edit = document.createElement('button'); edit.className='pill'; edit.textContent='Edit';
    edit.addEventListener('click', async ()=>{
      const code = prompt('Enter secret code to edit'); if (!code) return;
      const newText = prompt('Edit confession', c.text); if (newText == null) return;
      const res = await api('/confessions/'+c._id, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({secretCode:code,text:newText})});
      if (res && res.error) alert(res.error);
      loadConfs();
    });
    const del = document.createElement('button'); del.className='pill'; del.textContent='Delete';
    del.addEventListener('click', async ()=>{
      const code = prompt('Enter secret code to delete'); if (!code) return;
      const res = await api('/confessions/'+c._id, {method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({secretCode:code})});
      if (res && res.error) alert(res.error);
      loadConfs();
    });
    controls.appendChild(edit); controls.appendChild(del);

    card.appendChild(meta); card.appendChild(text); card.appendChild(reactions); card.appendChild(controls);
    confessionsEl.appendChild(card);
  });
}

// Post handling
// Field helpers
function setFieldFilled(field){
  if (field.querySelector('textarea')){
    const ta = field.querySelector('textarea');
    if (ta.value.trim().length) field.classList.add('filled'); else field.classList.remove('filled');
  } else if (field.querySelector('input')){
    const ip = field.querySelector('input');
    if (ip.value.trim().length) field.classList.add('filled'); else field.classList.remove('filled');
  }
}
function resetFieldStates(){
  document.querySelectorAll('.field').forEach(setFieldFilled);
  document.getElementById('secret-help').classList.add('hidden');
  document.getElementById('char-count').textContent = `0/1000`;
}

// Auto-resize textarea + char count
function resizeTextarea(ta){ ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight) + 'px'; }
postTextarea.addEventListener('input', (e)=>{
  resizeTextarea(postTextarea);
  document.getElementById('char-count').textContent = `${postTextarea.value.length}/1000`;
  setFieldFilled(postTextarea.closest('.field'));
  updateSubmitState();
});
postTextarea.addEventListener('blur', ()=> setFieldFilled(postTextarea.closest('.field')));

// secret show/hide
const toggleSecret = document.getElementById('toggle-secret');
let secretVisible = false;
toggleSecret.addEventListener('click', ()=>{
  secretVisible = !secretVisible;
  postSecret.type = secretVisible ? 'text' : 'password';
  toggleSecret.textContent = secretVisible ? '🙈' : '👁️';
});

// validate secret code
postSecret.addEventListener('input', ()=>{
  const help = document.getElementById('secret-help');
  if (postSecret.value && postSecret.value.length < 4) help.classList.remove('hidden'); else help.classList.add('hidden');
  setFieldFilled(postSecret.closest('.field'));
  updateSubmitState();
});

function updateSubmitState(){
  const btn = document.getElementById('modal-submit');
  const okText = postTextarea.value.trim().length > 0;
  const okSecret = postSecret.value && postSecret.value.length >= 4;
  btn.disabled = !(okText && okSecret);
}

postForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = postTextarea.value.trim();
  const secret = postSecret.value;
  if (!text) return;
  if (!secret || secret.length < 4){ document.getElementById('secret-help').classList.remove('hidden'); return; }

  const submitBtn = document.getElementById('modal-submit');
  const spinner = submitBtn.querySelector('.spinner');
  submitBtn.disabled = true; spinner.classList.remove('hidden');
  try{
    const res = await api('/confessions', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text, secretCode:secret})});
    if (res && res.error) { alert(res.error); }
    else { closeModal(); loadConfs(); }
  }catch(err){ alert('Network error'); }
  finally{ spinner.classList.add('hidden'); submitBtn.disabled = false; }
});

// initial load and routing
loadUser().then(()=>{
  const p = location.pathname;
  if (p === '/dashboard') navigateToPath('/dashboard');
  else if (p === '/my-confessions') navigateToPath('/my-confessions');
  else navigateToPath('/dashboard');
}).catch(()=>{
  // not authenticated — send to landing
  window.location.href = '/';
});
