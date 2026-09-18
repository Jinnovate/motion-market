const products = [
  {id:1,name:"Leica M6 Classic",category:"camera",condition:"Excellent",location:"London",publicPrice:2350,memberPrice:2180,tag:"Featured",image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82",description:"A beautifully kept M6 Classic with recent service history, clean finder and smooth advance."},
  {id:2,name:"Bang & Olufsen Beogram",category:"audio",condition:"Very good",location:"Bristol",publicPrice:680,memberPrice:595,tag:"Member deal",image:"https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=82",description:"A sculptural audio piece in excellent working order."},
  {id:3,name:"Vitra Soft Pad Chair",category:"design",condition:"Good",location:"Brighton",publicPrice:1250,memberPrice:1090,tag:"Just listed",image:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82",description:"Original Vitra production with warm patina. Comfortable, honest and made to last."},
  {id:4,name:"Snow Peak Field Kitchen",category:"outdoor",condition:"Excellent",location:"Edinburgh",publicPrice:420,memberPrice:365,tag:"Member deal",image:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=82",description:"Complete modular field kitchen, lightly used and stored dry."},
  {id:5,name:"Nikon FM2 + 50mm",category:"camera",condition:"Very good",location:"Manchester",publicPrice:540,memberPrice:490,tag:"New",image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=82",description:"Dependable mechanical Nikon body with bright 50mm lens and fresh light seals."},
  {id:6,name:"Braun LE01 Speaker",category:"audio",condition:"Excellent",location:"London",publicPrice:890,memberPrice:780,tag:"Featured",image:"https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=82",description:"Minimal wireless speaker with considered industrial design."},
  {id:7,name:"Anglepoise Type 75",category:"design",condition:"Very good",location:"Oxford",publicPrice:145,memberPrice:120,tag:"New",image:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=82",description:"Classic task lamp in graphite grey. Clean joints, cable and shade."},
  {id:8,name:"Hilleberg Nallo 2",category:"outdoor",condition:"Good",location:"Leeds",publicPrice:610,memberPrice:545,tag:"Member deal",image:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=82",description:"Light, dependable four-season tent. Used with care."}
];

let memberMode = false;
let activeCategory = "all";
let query = "";

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const signinDialog = document.querySelector("#signinDialog");
const sellDialog = document.querySelector("#sellDialog");
const productDialog = document.querySelector("#productDialog");

const money = value => new Intl.NumberFormat("en-GB", {style:"currency",currency:"GBP",maximumFractionDigits:0}).format(value);

function renderProducts(){
  const visible = products.filter(product => (activeCategory === "all" || product.category === activeCategory) && product.name.toLowerCase().includes(query));
  grid.innerHTML = visible.map(product => `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="View ${product.name}">
      <div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="card-badges"><span class="card-badge">${product.tag}</span>${product.memberPrice ? '<span class="card-badge member">MO price</span>' : ''}</div>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${product.condition}</span><span>${product.location}</span></div>
        <h3>${product.name}</h3>
        <div class="price-row"><span class="public-price">${money(product.publicPrice)}</span><span class="member-price ${memberMode ? '' : 'locked'}">Member<strong>${memberMode ? money(product.memberPrice) : '£••••'}</strong></span></div>
      </div>
    </article>`).join("");
  emptyState.hidden = visible.length > 0;
}

function showProduct(id){
  const product = products.find(item => item.id === Number(id));
  document.querySelector("#productDialogBody").innerHTML = `<div class="product-detail"><div class="product-image"><img src="${product.image}" alt="${product.name}"></div><div class="detail-copy"><span class="eyebrow">${product.condition} · ${product.location}</span><h2>${product.name}</h2><div class="detail-price">PUBLIC PRICE <strong>${money(product.publicPrice)}</strong></div><div class="detail-member">MOTION ONLY PRICE<br><strong>${memberMode ? money(product.memberPrice) : 'SIGN IN TO REVEAL'}</strong></div><p>${product.description}</p><button class="gold-btn full" id="interestButton">I’M INTERESTED</button></div></div>`;
  productDialog.showModal();
  document.querySelector("#interestButton").addEventListener("click", () => showToast("Buyer enquiries will be enabled with the live backend."));
}

document.querySelectorAll(".category-tabs button").forEach(button => button.addEventListener("click", () => {
  document.querySelector(".category-tabs .active").classList.remove("active");
  button.classList.add("active"); activeCategory = button.dataset.category; renderProducts();
}));

searchInput.addEventListener("input", event => { query = event.target.value.toLowerCase().trim(); renderProducts(); });
grid.addEventListener("click", event => { const card = event.target.closest(".product-card"); if(card) showProduct(card.dataset.productId); });
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
  products.unshift({id:Date.now(),name:data.get("name"),category:data.get("category"),condition:"Draft",location:"Your location",publicPrice:Number(data.get("publicPrice")),memberPrice:Number(data.get("memberPrice")),tag:"Preview",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",description:data.get("description")});
  activeCategory = "all"; query = ""; searchInput.value = ""; document.querySelectorAll(".category-tabs button").forEach(b => b.classList.toggle("active", b.dataset.category === "all"));
  renderProducts(); sellDialog.close(); event.target.reset(); document.querySelector("#browse").scrollIntoView(); showToast("Listing preview added");
});

document.querySelectorAll(".modal-close").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => { if(event.target === dialog) dialog.close(); }));
document.querySelector("#loadMore").addEventListener("click", () => showToast("You’ve reached the end of the demo listings."));

function showToast(message){ const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2600); }

renderProducts();
