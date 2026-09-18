import { signup, login, logout, getUser, handleAuthCallback, onAuthChange } from "@netlify/identity";

const products = [];

let memberMode = false;
let activeCategory = "all";
let query = "";
let currentUser = null;
const savedItems = new Set();
const myListings = [];

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const signinDialog = document.querySelector("#signinDialog");
const sellDialog = document.querySelector("#sellDialog");
const productDialog = document.querySelector("#productDialog");

document.querySelector(".brand-ring").innerHTML = '<i>M</i><b>M</b>';
document.querySelector(".brand small").textContent = "BUY - SELL - CONNECT";
document.querySelector(".market-status b").textContent = "0 LISTINGS";
document.querySelector(".market-status span").textContent = "READY FOR SELLERS";
document.querySelector('.filters [data-category="all"] span').textContent = "0";
emptyState.textContent = "NO LISTINGS YET — BE THE FIRST TO LIST AN ITEM.";

const themeButton = document.querySelector(".theme");
const themes = ["dark", "light", "natural"];
const themeLabels = { dark: "◉  DARK", light: "☼  LIGHT", natural: "◐  NATURAL" };
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.textContent = themeLabels[theme];
  themeButton.setAttribute("aria-label", `Colour mode: ${theme}. Click to change.`);
  localStorage.setItem("motion-market-theme", theme);
}
const savedTheme = localStorage.getItem("motion-market-theme");
applyTheme(themes.includes(savedTheme) ? savedTheme : "dark");
themeButton.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
});

const authDialog = document.createElement("dialog");authDialog.className="modal compact auth-modal";authDialog.innerHTML=`<button class="modal-close" aria-label="Close">×</button><span class="eyebrow">MOTION MARKET ACCOUNT</span><h2 id="authTitle">CREATE ACCOUNT</h2><p id="authIntro">Create your account to save listings, contact sellers and manage your items.</p><form id="authForm"><label id="nameLabel">FULL NAME<input name="fullName" autocomplete="name" required></label><label>EMAIL<input name="email" type="email" autocomplete="email" required></label><label>PASSWORD<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><p class="auth-error" id="authError"></p><button class="gold-btn full" type="submit">CREATE ACCOUNT</button></form><button class="auth-switch" id="authSwitch">ALREADY HAVE AN ACCOUNT? SIGN IN</button>`;document.body.appendChild(authDialog);let authMode="signup";

const money = value => new Intl.NumberFormat("en-GB", {style:"currency",currency:"GBP",maximumFractionDigits:0}).format(value);

function renderProducts(){
  const visible = products.filter(product => (activeCategory === "all" || product.category === activeCategory) && product.name.toLowerCase().includes(query));
  grid.innerHTML = visible.map(product => `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="View ${product.name}">
      <div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="card-badges"><span class="card-badge">${product.tag}</span><button class="save-btn" data-save-id="${product.id}" aria-label="Save ${product.name}">${savedItems.has(product.id) ? '★' : '☆'}</button></div>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${product.condition}</span><span>${product.location}</span></div>
        <h3>${product.name}</h3>
        <div class="price-row"><span class="public-price">${money(product.publicPrice)}</span><span class="member-price ${memberMode ? '' : 'locked'}">Member<strong>${memberMode ? money(product.memberPrice) : '£••••'}</strong></span></div>
      </div>
    </article>`).join("");
  emptyState.hidden = visible.length > 0;
  document.querySelector("#loadMore").hidden = products.length === 0;
}

function showProduct(id){
  const product = products.find(item => item.id === Number(id));
  document.querySelector("#productDialogBody").innerHTML = `<div class="product-detail"><div class="product-image"><img src="${product.image}" alt="${product.name}"></div><div class="detail-copy"><span class="eyebrow">${product.condition} · ${product.location}</span><h2>${product.name}</h2><div class="detail-price">PUBLIC PRICE <strong>${money(product.publicPrice)}</strong></div><div class="detail-member">MOTION ONLY PRICE<br><strong>${memberMode ? money(product.memberPrice) : 'SIGN IN TO REVEAL'}</strong></div><p>${product.description}</p><button class="gold-btn full" id="interestButton">I’M INTERESTED</button></div></div>`;
  productDialog.showModal();
  document.querySelector("#interestButton").addEventListener("click", () => showToast("Buyer enquiries will be enabled with the live backend."));
}

document.querySelectorAll(".filters button[data-category]").forEach(button => button.addEventListener("click", () => {
  document.querySelector(".filters button[data-category].active")?.classList.remove("active");
  button.classList.add("active"); activeCategory = button.dataset.category; renderProducts();
}));

searchInput.addEventListener("input", event => { query = event.target.value.toLowerCase().trim(); renderProducts(); });
grid.addEventListener("click", event => { const save = event.target.closest(".save-btn"); if(save){ event.stopPropagation(); const id=Number(save.dataset.saveId); savedItems.has(id)?savedItems.delete(id):savedItems.add(id); renderProducts(); showToast(savedItems.has(id)?"Item saved":"Item removed from saved"); return; } const card = event.target.closest(".product-card"); if(card) showProduct(card.dataset.productId); });
grid.addEventListener("keydown", event => { const card = event.target.closest(".product-card"); if(card && (event.key === "Enter" || event.key === " ")) showProduct(card.dataset.productId); });

function openSignin(){ signinDialog.showModal(); }
document.querySelectorAll("#unlockButton").forEach(button => button.addEventListener("click", openSignin));
document.querySelector("#verifyButton").addEventListener("click", () => {
  memberMode = true; signinDialog.close(); renderProducts();
  document.querySelector("#memberCallout").innerHTML = '<div class="member-icon">✓</div><div><strong>Membership verified</strong><span>Your Motion Only prices are now visible across the market.</span></div>';
  showToast("Member pricing unlocked");
});

function openSell(){ sellDialog.showModal(); }
document.querySelectorAll("#sellButton").forEach(button => button.addEventListener("click", openSell));
document.querySelector("#sellForm").addEventListener("submit", event => {
  event.preventDefault(); const data = new FormData(event.target);
  const newItem={id:Date.now(),name:data.get("name"),category:data.get("category"),condition:"Draft",location:"Your location",publicPrice:Number(data.get("publicPrice")),memberPrice:Number(data.get("memberPrice")),tag:"Preview",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",description:data.get("description")}; products.unshift(newItem); myListings.unshift(newItem);
  activeCategory = "all"; query = ""; searchInput.value = ""; document.querySelectorAll(".category-tabs button").forEach(b => b.classList.toggle("active", b.dataset.category === "all"));
  renderProducts(); sellDialog.close(); event.target.reset(); document.querySelector("#browse").scrollIntoView(); showToast("Listing preview added");
});

document.querySelectorAll(".modal-close").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => { if(event.target === dialog) dialog.close(); }));
document.querySelector("#loadMore").addEventListener("click", () => showToast("You’ve reached the end of the listings."));

function showToast(message){ const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2600); }

function renderAccount(){const name=currentUser?.user_metadata?.full_name||currentUser?.email?.split("@")[0]||"Guest";document.querySelector(".profile b").textContent=name;document.querySelector(".profile small").textContent=currentUser?"market account":"create an account";document.querySelector(".avatar").textContent=currentUser?name.charAt(0).toUpperCase():"↪";document.querySelector(".avatar").title=currentUser?"Account and sign out":"Create account or sign in";}
function openAuth(mode="signup"){if(currentUser){if(confirm(`Signed in as ${currentUser.email}. Sign out?`))logout().then(()=>{currentUser=null;renderAccount();showToast("Signed out");});return;}authMode=mode;const isSignup=mode==="signup";authDialog.querySelector("#authTitle").textContent=isSignup?"CREATE ACCOUNT":"SIGN IN";authDialog.querySelector("#authIntro").textContent=isSignup?"Create your account to save listings, contact sellers and manage your items.":"Welcome back. Sign in to continue to Motion Market.";authDialog.querySelector("#nameLabel").hidden=!isSignup;authDialog.querySelector('[name="fullName"]').required=isSignup;authDialog.querySelector('[name="password"]').autocomplete=isSignup?"new-password":"current-password";authDialog.querySelector('[type="submit"]').textContent=isSignup?"CREATE ACCOUNT":"SIGN IN";authDialog.querySelector("#authSwitch").textContent=isSignup?"ALREADY HAVE AN ACCOUNT? SIGN IN":"NEW TO MOTION MARKET? CREATE ACCOUNT";authDialog.querySelector("#authError").textContent="";authDialog.showModal();}
document.querySelector(".avatar").addEventListener("click",()=>openAuth());document.querySelector(".profile").addEventListener("click",e=>{if(!e.target.closest("button"))openAuth();});authDialog.querySelector(".modal-close").addEventListener("click",()=>authDialog.close());authDialog.querySelector("#authSwitch").addEventListener("click",()=>openAuth(authMode==="signup"?"login":"signup"));authDialog.querySelector("#authForm").addEventListener("submit",async e=>{e.preventDefault();const data=new FormData(e.target),button=e.target.querySelector('[type="submit"]'),error=authDialog.querySelector("#authError");button.disabled=true;button.textContent="PLEASE WAIT…";error.textContent="";try{if(authMode==="signup"){await signup(data.get("email"),data.get("password"),{full_name:data.get("fullName")});authDialog.close();showToast("Check your email to confirm your account");}else{currentUser=await login(data.get("email"),data.get("password"));authDialog.close();renderAccount();showToast("Welcome back");}}catch(err){error.textContent=err?.message||"Account service is not available yet.";}finally{button.disabled=false;button.textContent=authMode==="signup"?"CREATE ACCOUNT":"SIGN IN";}});onAuthChange((_event,user)=>{currentUser=user;renderAccount();});(async()=>{try{await handleAuthCallback();currentUser=await getUser();}catch{}renderAccount();})();

renderProducts();

const main = document.querySelector("main");
const marketIntro = document.querySelector(".intro");
const marketPanel = document.querySelector("#browse");
const subPage = document.createElement("section");
subPage.id = "subPage"; subPage.className = "sub-page"; subPage.hidden = true; main.appendChild(subPage);

const pageContent = {
  saved: () => `<div class="page-title"><span class="eyebrow">YOUR SHORTLIST</span><h1>SAVED ITEMS</h1><p>${savedItems.size} items kept for later.</p></div><div class="saved-list">${[...savedItems].map(id=>{const p=products.find(x=>x.id===id);return p?`<article class="row-card" data-open-product="${p.id}"><img src="${p.image}" alt=""><div><small>${p.category} · ${p.location}</small><h3>${p.name}</h3><b>${money(p.publicPrice)}</b></div><button data-remove-saved="${p.id}">REMOVE</button></article>`:""}).join("") || '<div class="empty-panel">NO SAVED ITEMS YET</div>'}</div>`,
  listings: () => `<div class="page-title"><span class="eyebrow">SELLER DESK</span><h1>MY LISTINGS</h1><p>Manage your live and draft items.</p><button class="gold-btn" data-open-sell>+ LIST AN ITEM</button></div><div class="metric-grid"><div><small>ACTIVE</small><strong>${myListings.length}</strong></div><div><small>ENQUIRIES</small><strong>0</strong></div><div><small>SOLD</small><strong>0</strong></div></div><div class="saved-list">${myListings.map(p=>`<article class="row-card"><img src="${p.image}" alt=""><div><small>DRAFT · ${p.category}</small><h3>${p.name}</h3><b>${money(p.publicPrice)}</b></div><button>EDIT</button></article>`).join("") || '<div class="empty-panel">NO LISTINGS YET — USE “LIST AN ITEM” TO CREATE ONE.</div>'}</div>`,
  messages: () => `<div class="page-title"><span class="eyebrow">BUYER & SELLER CONTACT</span><h1>MESSAGES</h1><p>Keep every market conversation in one place.</p></div><div class="empty-panel">NO MESSAGES YET</div>`,
  deals: () => `<div class="page-title"><span class="eyebrow">MOTION ONLY BENEFIT</span><h1>MEMBER DEALS</h1><p>Private prices set by members, for members.</p><button class="gold-btn" data-verify>${memberMode?'PRICES UNLOCKED':'VERIFY MEMBERSHIP'}</button></div><div class="deal-grid">${products.slice(0,4).map(p=>`<article><span>SAVE ${money(p.publicPrice-p.memberPrice)}</span><h3>${p.name}</h3><p>Public ${money(p.publicPrice)}</p><b>${memberMode?money(p.memberPrice):'LOCKED'}</b></article>`).join("") || '<div class="empty-panel">NO MEMBER DEALS YET</div>'}</div>`,
  guide: () => `<div class="page-title"><span class="eyebrow">SELL WITH CONFIDENCE</span><h1>SELLING GUIDE</h1><p>Four steps to a strong Motion Market listing.</p></div><div class="guide-grid"><article><b>01</b><h3>SHOW IT CLEARLY</h3><p>Use honest, well-lit photographs from every important angle.</p></article><article><b>02</b><h3>DESCRIBE THE TRUTH</h3><p>State condition, history, faults and everything included.</p></article><article><b>03</b><h3>SET TWO PRICES</h3><p>Choose a fair public price and an optional Motion Only member rate.</p></article><article><b>04</b><h3>HAND OVER SAFELY</h3><p>Keep communication here and agree collection or tracked delivery.</p></article></div>`,
  settings: () => `<div class="page-title"><span class="eyebrow">YOUR ACCOUNT</span><h1>SETTINGS & PRIVACY</h1><p>Control how you buy, sell and appear on Motion Market.</p></div><div class="settings-panel"><label><span><b>MARKET PROFILE</b><small>Show your first name and member status</small></span><input type="checkbox" checked></label><label><span><b>MESSAGE NOTIFICATIONS</b><small>Receive updates for buyer and seller enquiries</small></span><input type="checkbox" checked></label><label><span><b>MEMBER PRICE VISIBILITY</b><small>Reveal member prices after verification</small></span><input type="checkbox" checked></label><button class="gold-btn" data-save-settings>SAVE SETTINGS</button></div>`
};

function navigate(page){
  document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
  const market=page==="market"; marketIntro.hidden=!market; marketPanel.hidden=!market; subPage.hidden=market;
  if(!market){ subPage.innerHTML=(pageContent[page]||pageContent.saved)(); window.scrollTo(0,0); }
}
document.addEventListener("click", e=>{ const nav=e.target.closest("[data-page]"); if(nav){e.preventDefault(); navigate(nav.dataset.page); history.replaceState(null,"",`#${nav.dataset.page}`);} const open=e.target.closest("[data-open-product]"); if(open) showProduct(open.dataset.openProduct); const remove=e.target.closest("[data-remove-saved]"); if(remove){savedItems.delete(Number(remove.dataset.removeSaved));navigate("saved");showToast("Item removed");} if(e.target.closest("[data-open-sell]")) openSell(); if(e.target.closest("[data-verify]")){ if(memberMode) showToast("Membership already verified"); else openSignin(); } if(e.target.closest("[data-save-settings]")) showToast("Settings saved");});
document.addEventListener("submit",e=>{if(e.target.id==="messageForm"){e.preventDefault();e.target.reset();showToast("Reply sent");}});
navigate(location.hash.slice(1)||"market");
