/* =============================================================
   GESTION PANIER — version finale 2026 (fix multi-catégories)
   ============================================================= */

let cart = JSON.parse(sessionStorage.getItem("cart")) || {};

// ----- Sauvegarde et compteur -----
function saveCart() {
  sessionStorage.setItem("cart", JSON.stringify(cart));
  const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const c = document.getElementById("cartCount");
  if (c) c.textContent = count;
}

// ----- Chargement d'une catégorie -----
function loadCategory(products) {
  const zone = document.getElementById("productList");
  if (!zone) return;

  zone.innerHTML = "";
  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.nom}">
      <h4>${p.nom}</h4>
      <div class="qty-control">
        <button onclick="updateQty('${p.id}', -1, '${p.nom}', ${p.prix}, '${p.categorie}')">-</button>
        <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
        <button onclick="updateQty('${p.id}', 1, '${p.nom}', ${p.prix}, '${p.categorie}')">+</button>
      </div>
      <div class="price">${p.prix.toLocaleString()} FCFA</div>
    `;
    zone.appendChild(div);
  });
  saveCart();
}

// ----- Ajout / Retrait -----
function updateQty(id, delta, nom, prix, categorie) {
  if (!cart[id]) cart[id] = { id, nom, prix, categorie, qty: 0 };
  cart[id].qty = Math.max(0, cart[id].qty + delta);
  if (cart[id].qty === 0) delete cart[id];

  const el = document.getElementById(`qty-${id}`);
  if (el) el.textContent = cart[id]?.qty || 0;
  saveCart();
  renderCart(); // maj directe du panier si ouvert
}

// ----- Ouverture / Fermeture du panier -----
const panel = document.getElementById("cartPanel");
if (panel) {
  document
    .getElementById("openCart")
    ?.addEventListener("click", () => renderCart(true));
  document
    .getElementById("closeCart")
    ?.addEventListener("click", () => panel.classList.remove("visible"));
}

// ----- Affichage du panier -----
function renderCart(show) {
  const itemsZone = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");
  if (!itemsZone || !summary) return;

  itemsZone.innerHTML = "";
  let total = 0;

  // Regroupement par catégorie
  const grouped = {};
  for (const p of Object.values(cart)) {
    if (!grouped[p.categorie]) grouped[p.categorie] = [];
    grouped[p.categorie].push(p);
  }

  for (const [categorie, produits] of Object.entries(grouped)) {
    const catTitle = document.createElement("h3");
    catTitle.textContent = categorie;
    catTitle.style.color = "var(--bleu-vif)";
    catTitle.style.marginTop = "15px";
    itemsZone.appendChild(catTitle);

    produits.forEach((prod) => {
      const sousTotal = prod.qty * prod.prix;
      total += sousTotal;
      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <div class="cart-details">
          <h4>${prod.nom}</h4>
          <div class="mini-controls">
            <button onclick="updateQty('${prod.id}', -1, '${prod.nom}', ${prod.prix}, '${prod.categorie}')">-</button>
            <span>${prod.qty}</span>
            <button onclick="updateQty('${prod.id}', 1, '${prod.nom}', ${prod.prix}, '${prod.categorie}')">+</button>
          </div>
          <div class="subtotal">${sousTotal.toLocaleString()} FCFA</div>
        </div>
      `;
      itemsZone.appendChild(item);
    });
  }

  // Calculs globaux
  let remise = 0,
    livraison = 1000;
  if (total >= 50000) remise = 5000;
  else if (total >= 15000) remise = 2000;
  if (total >= 10000) livraison = 0;
  const totalFinal = total - remise + livraison;

  summary.innerHTML = `
    <p><span>Sous‑total</span><span>${total.toLocaleString()} FCFA</span></p>
    <p><span>Remise</span><span>‑${remise.toLocaleString()} FCFA</span></p>
    <p><span>Livraison</span><span>${livraison.toLocaleString()} FCFA</span></p>
    <hr>
    <p><strong><span>TOTAL :  </span><span>${totalFinal.toLocaleString()}     FCFA</span></strong></p>
    <button class="checkout" onclick="checkout(${totalFinal})">Passer la commande</button>
  `;
  if (show) panel.classList.add("visible");
}

// ----- Envoi WhatsApp -----
function checkout(total) {
  if (Object.keys(cart).length === 0) return;
  let message = "🛍 Nouvelle commande Ako B’tik !\n\n";
  for (const [id, p] of Object.entries(cart)) {
    message += `${p.categorie} — ${p.nom} ×${p.qty} = ${(p.qty * p.prix).toLocaleString()} FCFA\n`;
  }
  message += `\nTotal : ${total.toLocaleString()} FCFA\n\nMerci pour votre commande !`;
  const encoded = encodeURIComponent(message);
  window.open(`[wa.me](https://wa.me/22892000000?text=${encoded})`, "_blank");
}

// ----- Réinitialisation uniquement sur rechargement complet -----
window.addEventListener("beforeunload", (e) => {
  const navType = performance.getEntriesByType("navigation")[0].type;
  if (navType === "reload") sessionStorage.removeItem("cart");
});

// ----- Init -----
saveCart();
function openCategory(page) {
  window.location.href = page;
}

// =============================
// EFFET SIGNATURE
// =============================

const text = "Ako ne fait pas kpakpato";
let index = 0;
const speed = 100;

function typeWriter() {
  if (index < text.length) {
    document.getElementById("typing-text").innerHTML += text.charAt(index);
    index++;
    setTimeout(typeWriter, speed);
  }
}
window.addEventListener("load", typeWriter);
