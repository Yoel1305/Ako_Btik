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
// function checkout(total) {
//   if (Object.keys(cart).length === 0) return;
//   let message = "🛍 Nouvelle commande Ako B’tik !\n\n";
//   for (const [id, p] of Object.entries(cart)) {
//     message += `${p.categorie} — ${p.nom} ×${p.qty} = ${(p.qty * p.prix).toLocaleString()} FCFA\n`;
//   }
//   message += `\nTotal : ${total.toLocaleString()} FCFA\n\n🙏Merci pour votre commande \n\nPour que votre commande soit traitée, veuillez procéder au paiement par YAS ou FLOOZ sur le numéro correspondant :\n\n💳YAS : +228 92 00 00 00 \n\n💳FLOOZ : +228 99 00 00 00\n\n📸NB: N'oubliez pas de me renvoyer une preuve du paiement effectué.\n\n💙Merci d'avoir contacter AKO B'TIK. \n🦜✨AKO vous partage les bons plans - Presque tout - Partout - et pour Toi🦜✨`;
//   const encoded = encodeURIComponent(message);
//   window.open(`https://wa.me/33758344875?text=${encoded}`, "_blank");
// }

function checkout() {
  if (Object.keys(cart).length === 0) return;

  let sousTotal = 0;

  let message = "🧾 *RÉCAPITULATIF DE VOTRE COMMANDE*\n";
  message += "━━━━━━━━━━━━━━━\n\n";

  // 🔹 Produits
  for (const [id, p] of Object.entries(cart)) {
    const totalProduit = p.qty * p.prix;
    sousTotal += totalProduit;

    message += `▪️ *${p.nom}*\n`;
    message += `   ${p.qty} × ${p.prix.toLocaleString()} FCFA`;
    message += ` = *${totalProduit.toLocaleString()} FCFA*\n\n`;
  }

  // 🔹 Remise
  let remise = 0;

  if (sousTotal >= 50000) {
    remise = 5000;
  } else if (sousTotal >= 15000) {
    remise = 2000;
  }

  // 🔹 Livraison
  let livraison = sousTotal >= 10000 ? 0 : 1000;

  // 🔹 Total final
  const totalFinal = sousTotal - remise + livraison;

  // 🔹 Résumé facture
  message += "━━━━━━━━━━━━━━━\n";
  message += `🛍️ *Sous-total :* ${sousTotal.toLocaleString()} FCFA\n`;
  message += `🎁 *Remise :* -${remise.toLocaleString()} FCFA\n`;

  if (livraison === 0) {
    message += `🚚 *Livraison :* GRATUITE\n`;
  } else {
    message += `🚚 *Livraison :* ${livraison.toLocaleString()} FCFA\n`;
  }

  message += "\n";
  message += `💰 *TOTAL À PAYER : ${totalFinal.toLocaleString()} FCFA*\n`;
  message += "━━━━━━━━━━━━━━━\n\n";

  // 🔹 Paiement
  message += "🙏 Merci pour votre commande ❤️\n\n";

  message += "📲 *Paiement disponible via :*\n\n";

  message += "💳 *YAS* : +228 92 00 00 00\n";
  message += "💳 *FLOOZ* : +228 99 00 00 00\n\n";

  message +=
    "📸 *NB :* Pourque votre commande soit traitée, veuillez envoyer une preuve du paiement.\n\n";

  message += "🦜✨ *AKO B'TIK vous partage les bons plans*\n";
  message += "_Presque tout • Partout • Pour toi_";

  // 🔹 Encodage WhatsApp
  const encoded = encodeURIComponent(message);

  // 🔹 Ouvre WhatsApp
  window.open(`https://wa.me/33758344875?text=${encoded}`, "_blank");
}

// ----- Envoi WhatsApp -----
// function checkout(total) {
//   if (Object.keys(cart).length === 0) return;
//   let message = "🧾 *Récapitulatif de votre commande chez Ako B'tik :*\n";

//   // 🔹 Détails par article
//   for (const [id, p] of Object.entries(cart)) {
//     message += `${p.categorie} — ${p.nom} ×${p.qty} = ${(p.qty * p.prix).toLocaleString()} FCFA\n`;
//   }

//   // 🔹 Sous-total
//   message += `\n\n🛍️ *Sous-total articles :* ${total.toLocaleString()} FCFA`;

//   // 🔹 Remise
//   if (remise > 0) {
//     message += `\n🎁 *Remise :* -${remise.toLocaleString()} FCFA`;
//   } else {
//     message += `\n🎁 *Remise :* 0 FCFA`;
//   }

//   // 🔹 Livraison
//   if (livraison === 0) {
//     message += `\n🚚 *Livraison :* GRATUIT`;
//   } else {
//     message += `\n🚚 *Livraison :* ${livraison.toLocaleString()} FCFA`;
//   }

//   // 🔹 TOTAL FINAL
//   message += `\n\n💰 *TOTAL À PAYER :* ${totalFinal.toLocaleString()} FCFA`;

//   // 🔹 Message de fin
//   message += `\n\n🙏 Merci pour votre commande !
// \n📦 Pour que votre commande soit traitée, veuillez procéder au paiement par *YAS* ou *FLOOZ* :
// \n💳 *YAS* : +228 92 00 00 00
// \n💳 *FLOOZ* : +228 99 00 00 00
// \n📸 *NB : envoyez une preuve du paiement.*
// \n💙 Merci d'avoir contacté *AKO B'TIK* 🦜
// \n🦜✨ Ako vous partage les bons plans — Presque tout, Partout, et Pour Toi ✨`;

//   const encoded = encodeURIComponent(message);
//   window.open(`https://wa.me/33758344875?text=${encoded}`, "_blank");
// }

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
