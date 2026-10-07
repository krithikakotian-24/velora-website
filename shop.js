/* ===== Login first: every page except signup.html needs a logged-in user ===== */
(function () {
  var page = location.pathname.split("/").pop().toLowerCase();
  var user = null;
  try { user = JSON.parse(localStorage.getItem("velora_user")); } catch (e) {}
  if (page !== "signup.html" && !user) { location.replace("signup.html"); }
})();

/* ===== Helpers ===== */
function $(id) { return document.getElementById(id); }
function money(n) { return "\u20B9" + n.toLocaleString("en-IN"); }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function findProduct(id) { return allProducts.find(function (p) { return p.id === id; }); }
/* Shade photos: images/<id>-<shade>.png (for example images/b11-red.png) are picked up automatically */
allProducts.forEach(function (p) {
  if (p.opts && /shade|colou?r/i.test(p.opts.label) && !p.imgs) {
    p.imgs = {};
    p.opts.values.forEach(function (v) { p.imgs[v] = "images/" + p.id + "-" + slug(v) + ".png"; });
  }
});

/* ===== Product pictures (drawn automatically) ===== */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round((n >> 16) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const tee = (c, d) => `<path d="M70 66 L92 58 Q100 70 108 58 L130 66 L156 96 L134 112 L128 104 L128 190 L72 190 L72 104 L66 112 L44 96Z" fill="${c}"/><path d="M92 58 Q100 70 108 58" stroke="${d}" stroke-width="4" fill="none"/>`;
const legs = (c, d) => `<path d="M70 55 L130 55 L138 195 L108 195 L100 110 L92 195 L62 195Z" fill="${c}"/><rect x="70" y="55" width="60" height="10" fill="${d}"/>`;
const SHAPES = {
  "Sunscreen": (c, d) => `<rect x="78" y="62" width="44" height="116" rx="8" fill="${c}"/><rect x="84" y="40" width="32" height="26" rx="5" fill="${d}"/><rect x="86" y="100" width="28" height="30" rx="4" fill="#fff" fill-opacity=".6"/>`,
  "Lipstick": (c, d) => `<rect x="76" y="132" width="48" height="58" rx="6" fill="${d}"/><rect x="80" y="104" width="40" height="32" fill="#e6d3a8"/><path d="M84 104 L84 72 Q100 50 116 72 L116 104Z" fill="${c}"/>`,
  "Perfume": (c, d) => `<rect x="66" y="104" width="68" height="88" rx="14" fill="${c}"/><rect x="92" y="80" width="16" height="26" fill="${d}"/><rect x="82" y="58" width="36" height="24" rx="5" fill="#d9c08a"/><rect x="78" y="124" width="44" height="36" rx="4" fill="#fff" fill-opacity=".5"/>`,
  "Face Serum": (c, d) => `<rect x="76" y="112" width="48" height="80" rx="10" fill="${c}"/><rect x="88" y="84" width="24" height="30" fill="${d}"/><ellipse cx="100" cy="68" rx="14" ry="20" fill="${d}"/><rect x="84" y="132" width="32" height="30" rx="4" fill="#fff" fill-opacity=".6"/>`,
  "Moisturizer": (c, d) => `<rect x="60" y="122" width="80" height="62" rx="10" fill="${c}"/><rect x="56" y="96" width="88" height="30" rx="8" fill="${d}"/><rect x="76" y="138" width="48" height="26" rx="4" fill="#fff" fill-opacity=".6"/>`,
  "Face Wash": (c, d) => `<rect x="74" y="98" width="52" height="94" rx="10" fill="${c}"/><rect x="96" y="66" width="8" height="34" fill="${d}"/><rect x="82" y="58" width="36" height="10" rx="4" fill="${d}"/><rect x="82" y="122" width="36" height="34" rx="4" fill="#fff" fill-opacity=".6"/>`,
  "Face Makeup": (c, d) => `<circle cx="100" cy="124" r="54" fill="${d}"/><circle cx="100" cy="124" r="42" fill="${c}"/><circle cx="86" cy="110" r="11" fill="#fff" fill-opacity=".4"/>`,
  "Eye Makeup": (c, d) => `<rect x="86" y="86" width="28" height="104" rx="10" fill="${d}"/><rect x="95" y="34" width="10" height="56" fill="${c}"/><ellipse cx="100" cy="46" rx="14" ry="22" fill="${c}"/>`,
  "Hair Care": (c, d) => `<rect x="70" y="86" width="60" height="106" rx="14" fill="${c}"/><rect x="86" y="62" width="28" height="26" rx="4" fill="${d}"/><path d="M100 118 q14 20 0 32 q-14 -12 0 -32z" fill="#fff" fill-opacity=".7"/>`,
  "Nails & Tools": (c, d) => `<rect x="68" y="124" width="64" height="66" rx="12" fill="${c}"/><rect x="92" y="62" width="16" height="64" rx="4" fill="${d}"/><rect x="78" y="144" width="44" height="26" rx="4" fill="#fff" fill-opacity=".5"/>`,
  "Kurta Sets": (c, d) => `<path d="M70 70 L88 60 Q100 76 112 60 L130 70 L148 122 L128 130 L126 196 L74 196 L72 130 L52 122Z" fill="${c}"/><rect x="97" y="72" width="6" height="124" fill="${d}"/><path d="M88 60 Q100 76 112 60" stroke="${d}" stroke-width="4" fill="none"/>`,
  "Sarees": (c, d) => `<path d="M68 58 L132 58 L154 194 L46 194Z" fill="${c}"/><path d="M68 58 L132 58 L120 98 L80 98Z" fill="${d}"/><path d="M52 160 Q100 126 148 160" stroke="${d}" stroke-width="8" fill="none"/>`,
  "Dresses": (c, d) => `<path d="M84 52 L116 52 L120 100 L158 196 L42 196 L80 100Z" fill="${c}"/><rect x="80" y="98" width="40" height="9" fill="${d}"/>`,
  "Tops & T-shirts": tee,
  "Hoodies & Jackets": (c, d) => tee(c, d) + `<path d="M78 64 Q100 26 122 64 Q100 84 78 64Z" fill="${d}"/><rect x="84" y="140" width="32" height="26" rx="5" fill="${d}" fill-opacity=".6"/>`,
  "Jeans & Pants": legs,
  "Jewellery": (c, d) => `<circle cx="78" cy="76" r="7" fill="${d}"/><path d="M78 84 L62 152 Q78 180 94 152Z" fill="${c}"/><circle cx="122" cy="76" r="7" fill="${d}"/><path d="M122 84 L106 152 Q122 180 138 152Z" fill="${c}"/>`,
  "Handbags": (c, d) => `<path d="M76 104 Q76 60 100 60 Q124 60 124 104" stroke="${d}" stroke-width="9" fill="none"/><rect x="54" y="100" width="92" height="82" rx="12" fill="${c}"/><rect x="88" y="118" width="24" height="14" rx="3" fill="${d}"/>`,
  "Footwear": (c, d) => `<path d="M38 152 L38 118 Q70 118 90 98 L110 130 Q152 130 164 152 L164 170 L38 170Z" fill="${c}"/><rect x="38" y="166" width="126" height="12" rx="5" fill="${d}"/>`,
  "Activewear": (c, d) => legs(c, d) + `<rect x="96" y="65" width="8" height="130" fill="${d}" fill-opacity=".5"/>`
};
function drawnImage(p) {
  const c = shade(p.color, 0.82), d = shade(p.color, 0.58);
  const label = ("Velora " + p.cat).replace(/&/g, "&amp;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><rect width="200" height="240" fill="${p.color}" fill-opacity=".45"/><ellipse cx="100" cy="200" rx="60" ry="8" fill="#000" fill-opacity=".08"/>${SHAPES[p.cat](c, d)}<text x="100" y="226" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="${shade(p.color, 0.4)}">${label}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
/* Real photo: images/<id>.png (for example images/b11.png). If it is missing, the drawn picture is used. */
function productImage(p) { return p.img || "images/" + p.id + ".png"; }
/* Photo order: images/<id>.png  ->  images/<category>.png  ->  drawn picture */
function fb(img) {
  const p = findProduct(img.getAttribute("data-id"));
  if (!img.getAttribute("data-s")) { img.setAttribute("data-s", "1"); img.src = "images/" + slug(p.cat) + ".png"; return; }
  img.onerror = null; img.src = drawnImage(p);
}
const TILE_COLORS = ["#f2c9a5","#e9a0a8","#cdb4c9","#b9c7e0","#c9d6c3","#e3b66b","#d9a6a0","#c8cdd6","#d8b99a","#aebfb0"];
function tileFb(img) { img.onerror = null; img.src = drawnImage({ cat: img.getAttribute("data-cat"), color: img.getAttribute("data-color") }); }
function tiles(boxId, cats, section) {
  $(boxId).innerHTML = cats.map(function (c, i) {
    const col = TILE_COLORS[i % 10];
    return '<a class="tile" href="' + section + '.html#' + slug(c) + '"><img src="images/' + slug(c) + '.png" data-cat="' + c.replace(/"/g, "") + '" data-color="' + col + '" onerror="tileFb(this)" alt="' + c.replace(/"/g, "") + '"><span>' + c + '</span></a>';
  }).join("");
}

/* ===== Cards ===== */
function card(p) {
  const off = Math.round((1 - p.price / p.mrp) * 100);
  return `<a class="product" href="product.html?id=${p.id}">
    <img class="pic" src="${productImage(p)}" data-id="${p.id}" onerror="fb(this)" alt="${esc(p.name)}" loading="lazy">
    <h3>${esc(p.name)}</h3>
    <div class="rate">\u2605 ${p.rating} <span>(${p.reviews.toLocaleString("en-IN")})</span></div>
    <div><span class="price">${money(p.price)}</span> <s>${money(p.mrp)}</s> <span class="off">${off}% off</span></div>
  </a>`;
}

/* ===== Cart and user ===== */
function addToCart(id, opt) {
  const cart = load("velora_cart") || [];
  const found = cart.find(function (i) { return i.id === id && i.opt === opt; });
  if (found) { found.qty += 1; } else { cart.push({ id: id, opt: opt, qty: 1 }); }
  save("velora_cart", cart);
  renderNav();
}
function renderNav() {
  const n = $("nav");
  if (!n) return;
  const user = load("velora_user");
  if (!user) { n.innerHTML = '<a class="logo" href="signup.html">Velora</a>'; return; }
  const count = (load("velora_cart") || []).reduce(function (a, i) { return a + i.qty; }, 0);
  n.innerHTML = `<a class="logo" href="index.html">Velora</a>
    <div class="links">
      <a href="index.html">Home</a><a href="beauty.html">Beauty</a><a href="fashion.html">Fashion</a><a href="contact.html">Contact</a>
      <a href="cart.html">Cart (${count})</a>
      ${user ? `<span class="hi">Hi, ${esc(user.name.split(" ")[0])}</span><a href="#" id="logout">Log out</a>` : `<a class="btn small" href="signup.html">Sign up</a>`}
    </div>`;
  const lo = $("logout");
  if (lo) { lo.onclick = function (e) { e.preventDefault(); localStorage.removeItem("velora_user"); location.href = "signup.html"; }; }
}

/* ===== Beauty / Fashion listing page ===== */
function renderShop(section) {
  const cats = section === "beauty" ? beautyCategories : fashionCategories;
  const list = allProducts.filter(function (p) { return p.section === section; });
  const chips = $("chips"), shop = $("shop"), q = $("search");
  /* Which category is chosen? Read it from the address, e.g. fashion.html#handbags */
  function current() {
    const h = decodeURIComponent(location.hash.slice(1));
    return cats.find(function (c) { return slug(c) === h; }) || "";
  }
  function draw() {
    const t = q.value.trim().toLowerCase();
    const active = t ? "" : current();
    chips.innerHTML = '<a href="#all" class="' + (active ? "" : "on") + '">All</a>' + cats.map(function (c) {
      return '<a href="#' + slug(c) + '" class="' + (c === active ? "on" : "") + '">' + c + '</a>';
    }).join("");
    shop.innerHTML = "";
    cats.forEach(function (cat) {
      if (active && cat !== active) return;
      const items = list.filter(function (p) { return p.cat === cat && (p.name + " " + p.cat).toLowerCase().indexOf(t) > -1; });
      if (!items.length) return;
      shop.innerHTML += `<section class="cat"><h3 class="cat-title">${cat}<span>${items.length} items</span></h3><div class="grid">${items.map(card).join("")}</div></section>`;
    });
    if (!shop.innerHTML) { shop.innerHTML = '<p class="sub">No products found.</p>'; }
  }
  q.oninput = draw;
  window.onhashchange = function () { q.value = ""; draw(); window.scrollTo(0, 0); };
  draw();
}

renderNav();

/* ===== Products running in the background (every page) ===== */
function bgRunner() {
  if ($("bgrun")) return;
  const cats = beautyCategories.concat(fashionCategories);
  const wrap = document.createElement("div");
  wrap.id = "bgrun"; wrap.setAttribute("aria-hidden", "true");
  const tops = [6, 38, 70];
  for (let r = 0; r < 3; r++) {
    const row = document.createElement("div");
    row.className = "bgrow" + (r % 2 ? " rev" : "");
    row.style.top = tops[r] + "%";
    row.style.animationDuration = (70 + r * 20) + "s";
    const shift = r * 7;
    const list = cats.map(function (c, i) { return cats[(i + shift) % cats.length]; });
    let html = "";
    for (let pass = 0; pass < 2; pass++) {
      list.forEach(function (c, i) {
        const col = TILE_COLORS[(i + r * 3) % TILE_COLORS.length];
        html += '<img src="images/' + slug(c) + '.png" data-cat="' + c.replace(/"/g, "") + '" data-color="' + col + '" onerror="tileFb(this)" alt="">';
      });
    }
    row.innerHTML = html;
    wrap.appendChild(row);
  }
  document.body.insertBefore(wrap, document.body.firstChild);
}
bgRunner();