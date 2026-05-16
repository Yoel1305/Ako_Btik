const CART_KEY = "ako-btik-cart";
const WHATSAPP_NUMBER = "33758344875";
const PAYMENT_YAS = "+228 92 00 00 00";
const PAYMENT_FLOOZ = "+228 99 00 00 00";

if (isFullPageReload()) {
  sessionStorage.removeItem(CART_KEY);
}

let cart = readCart();

function isFullPageReload() {
  const navigation = performance.getEntriesByType("navigation")[0];
  return navigation?.type === "reload";
}

function readCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCart() {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("#cartCount").forEach((counter) => {
    counter.textContent = count;
  });
}

function formatPrice(value) {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadCategory(products) {
  const zone = document.getElementById("productList");
  if (!zone) return;

  zone.innerHTML = products
    .map((product) => {
      const qty = cart[product.id]?.qty || 0;
      return `
        <article class="product-card reveal">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.nom)}" loading="lazy" onerror="this.src='images/Ako-Btik-Profile-2.png'">
          <div class="product-body">
            <h2>${escapeHtml(product.nom)}</h2>
            <div class="price">${formatPrice(product.prix)}</div>
            <div class="qty-control" aria-label="Quantité ${escapeHtml(product.nom)}">
              <button type="button" data-cart-action="decrease" data-product-id="${escapeHtml(product.id)}" aria-label="Retirer ${escapeHtml(product.nom)}">-</button>
              <span id="qty-${escapeHtml(product.id)}">${qty}</span>
              <button type="button" data-cart-action="increase" data-product-id="${escapeHtml(product.id)}" aria-label="Ajouter ${escapeHtml(product.nom)}">+</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  zone.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const product = products.find((item) => item.id === button.dataset.productId);
    if (!product) return;

    const delta = button.dataset.cartAction === "increase" ? 1 : -1;
    updateQty(product, delta);
  });

  initRevealAnimations();
  saveCart();
}

function updateQty(product, delta) {
  if (!cart[product.id]) {
    cart[product.id] = {
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      categorie: product.categorie,
      qty: 0,
    };
  }

  cart[product.id].qty = Math.max(0, cart[product.id].qty + delta);
  if (cart[product.id].qty === 0) delete cart[product.id];

  const qtyElement = document.getElementById(`qty-${product.id}`);
  if (qtyElement) qtyElement.textContent = cart[product.id]?.qty || 0;

  saveCart();
  renderCart();
}

function getTotals() {
  const sousTotal = Object.values(cart).reduce((sum, item) => sum + item.qty * item.prix, 0);
  const remise = sousTotal >= 50000 ? 5000 : sousTotal >= 15000 ? 2000 : 0;
  const livraison = sousTotal === 0 || sousTotal >= 10000 ? 0 : 1000;

  return {
    sousTotal,
    remise,
    livraison,
    totalFinal: sousTotal - remise + livraison,
  };
}

function renderCart(show = false) {
  const panel = document.getElementById("cartPanel");
  const itemsZone = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");
  if (!panel || !itemsZone || !summary) return;

  const items = Object.values(cart);
  itemsZone.innerHTML = "";

  if (items.length === 0) {
    itemsZone.innerHTML = '<p class="cart-empty">Votre panier est vide pour le moment.</p>';
  } else {
    const grouped = items.reduce((groups, item) => {
      groups[item.categorie] = groups[item.categorie] || [];
      groups[item.categorie].push(item);
      return groups;
    }, {});

    Object.entries(grouped).forEach(([categorie, products]) => {
      const title = document.createElement("h3");
      title.textContent = categorie;
      itemsZone.appendChild(title);

      products.forEach((product) => {
        const sousTotal = product.qty * product.prix;
        const item = document.createElement("article");
        item.className = "cart-item";
        item.innerHTML = `
          <div class="cart-details">
            <h4>${escapeHtml(product.nom)}</h4>
            <div class="mini-controls">
              <button type="button" data-panel-action="decrease" data-product-id="${escapeHtml(product.id)}" aria-label="Retirer ${escapeHtml(product.nom)}">-</button>
              <span>${product.qty}</span>
              <button type="button" data-panel-action="increase" data-product-id="${escapeHtml(product.id)}" aria-label="Ajouter ${escapeHtml(product.nom)}">+</button>
            </div>
            <div class="subtotal">${formatPrice(sousTotal)}</div>
          </div>
        `;
        itemsZone.appendChild(item);
      });
    });
  }

  const totals = getTotals();
  summary.innerHTML = `
    <p><span>Sous-total</span><span>${formatPrice(totals.sousTotal)}</span></p>
    <p><span>Remise</span><span>-${formatPrice(totals.remise)}</span></p>
    <p><span>Livraison</span><span>${totals.livraison === 0 ? "Gratuite" : formatPrice(totals.livraison)}</span></p>
    <hr>
    <p><strong>Total</strong><strong>${formatPrice(totals.totalFinal)}</strong></p>
    <button class="checkout" type="button" ${items.length === 0 ? "disabled" : ""}>Passer la commande</button>
  `;

  if (show) openCartPanel();
}

function findCartProduct(id) {
  const product = cart[id];
  if (!product) return null;
  return {
    id: product.id,
    nom: product.nom,
    prix: product.prix,
    categorie: product.categorie,
  };
}

function openCartPanel() {
  const panel = document.getElementById("cartPanel");
  if (!panel) return;
  panel.classList.add("visible");
  panel.setAttribute("aria-hidden", "false");
}

function closeCartPanel() {
  const panel = document.getElementById("cartPanel");
  if (!panel) return;
  panel.classList.remove("visible");
  panel.setAttribute("aria-hidden", "true");
}

function checkout() {
  const items = Object.values(cart);
  if (items.length === 0) return;

  const totals = getTotals();
  const lines = [
    "*Récapitulatif de votre commande Ako B'tik*",
    "",
    ...items.flatMap((item) => [
      `- *${item.nom}*`,
      `  ${item.qty} x ${formatPrice(item.prix)} = *${formatPrice(item.qty * item.prix)}*`,
      "",
    ]),
    `Sous-total : ${formatPrice(totals.sousTotal)}`,
    `Remise : -${formatPrice(totals.remise)}`,
    `Livraison : ${totals.livraison === 0 ? "Gratuite" : formatPrice(totals.livraison)}`,
    "",
    `*Total à payer : ${formatPrice(totals.totalFinal)}*`,
    "",
    "Paiement disponible via :",
    `YAS : ${PAYMENT_YAS}`,
    `FLOOZ : ${PAYMENT_FLOOZ}`,
    "",
    "NB : pour que votre commande soit traitée, veuillez envoyer une preuve du paiement.",
    "",
    "Ako B'tik vous partage les bons plans.",
    "Presque tout, partout et pour toi.",
  ];

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
}

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal:not(.is-visible)");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  elements.forEach((element) => observer.observe(element));
}

document.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-category-page]");
  if (categoryButton) {
    window.location.href = categoryButton.dataset.categoryPage;
    return;
  }

  const openCart = event.target.closest("#openCart");
  if (openCart) {
    event.preventDefault();
    renderCart(true);
    return;
  }

  if (event.target.closest("#closeCart")) {
    closeCartPanel();
    return;
  }

  const panelButton = event.target.closest("[data-panel-action]");
  if (panelButton) {
    const product = findCartProduct(panelButton.dataset.productId);
    if (!product) return;
    const delta = panelButton.dataset.panelAction === "increase" ? 1 : -1;
    updateQty(product, delta);
    return;
  }

  if (event.target.closest(".checkout")) {
    checkout();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCartPanel();
});

window.addEventListener("load", () => {
  const target = document.getElementById("typing-text");
  const text = "Ako ne fait pas kpakpato";
  let index = 0;

  function typeWriter() {
    if (!target || index >= text.length) return;
    target.textContent += text.charAt(index);
    index += 1;
    window.setTimeout(typeWriter, 78);
  }

  typeWriter();
});

initRevealAnimations();
renderCart();
saveCart();
