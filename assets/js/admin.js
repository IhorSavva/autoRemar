import { configured, getApp, firestore, auth } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const msg = $("admin-msg");
const say = (text, ok = false) => { msg.textContent = text; msg.className = "form-msg" + (text ? (ok ? " ok" : " err") : ""); };
const STATUSES = { new: "Nowe", confirmed: "Potwierdzone", done: "Zrealizowane" };

// Tabs work without Firebase too.
document.querySelectorAll("[role=tab]").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll("[role=tab]").forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      $(t.getAttribute("aria-controls")).hidden = t !== tab;
    });
  }));

if (!configured) {
  say("Firebase nie jest skonfigurowany — uzupełnij assets/js/firebase-config.js (instrukcja w README.md).");
} else {
  start().catch((e) => { console.error(e); say("Błąd ładowania Firebase: " + e.message); });
}

async function start() {
  const app = await getApp();
  const [A, F] = await Promise.all([auth(), firestore()]);
  const au = A.getAuth(app);
  const db = F.getFirestore(app);
  let unsubscribe = null;

  $("login").hidden = false;
  $("login").addEventListener("submit", async (e) => {
    e.preventDefault();
    say("");
    try {
      await A.signInWithEmailAndPassword(au, e.target.email.value.trim(), e.target.password.value);
    } catch {
      say("Nieprawidłowy e-mail lub hasło.");
    }
  });
  $("logout").addEventListener("click", () => A.signOut(au));

  A.onAuthStateChanged(au, (user) => {
    $("login").hidden = !!user;
    $("panel").hidden = !user;
    unsubscribe?.();
    unsubscribe = null;
    if (!user) return;
    say("");
    $("who").textContent = user.email;
    const q = F.query(F.collection(db, "bookings"), F.orderBy("createdAt", "desc"), F.limit(300));
    unsubscribe = F.onSnapshot(q, (snap) => renderBookings(snap, F, db),
      (err) => say("Brak dostępu do zgłoszeń (" + err.code + "). Czy to konto jest na liście adminów w firestore.rules?"));
    loadPrices(F, db);
  });

  $("add-row").addEventListener("click", () => addPriceRow({}));
  $("fill-static").addEventListener("click", () => fillFromStatic().catch((e) => say("Nie udało się wczytać cennika: " + e.message)));
  $("save-prices").addEventListener("click", () => savePrices(F, db));
}

// Booking fields come from the public form: only ever set them via textContent.
function renderBookings(snap, F, db) {
  const body = $("bookings");
  if (snap.empty) {
    body.innerHTML = '<tr><td colspan="7">Brak zgłoszeń.</td></tr>';
    return;
  }
  body.replaceChildren(...snap.docs.map((d) => {
    const b = d.data();
    const tr = document.createElement("tr");
    const cell = (...parts) => {
      const td = tr.insertCell();
      parts.filter(Boolean).forEach((p, i) => { if (i) td.append(document.createElement("br")); td.append(p); });
      return td;
    };
    const tel = document.createElement("a");
    tel.href = "tel:" + b.phone.replace(/[^\d+]/g, "");
    tel.textContent = b.phone;

    cell(b.createdAt ? b.createdAt.toDate().toLocaleString("pl-PL") : "…", b.lang === "en" ? "(EN)" : "");
    cell(b.name, tel, b.email);
    cell(b.car, b.year);
    cell(b.service);
    cell(b.date);
    cell(b.comment);

    const sel = document.createElement("select");
    sel.className = "status-" + b.status;
    sel.setAttribute("aria-label", "Status zgłoszenia");
    for (const [v, label] of Object.entries(STATUSES)) sel.add(new Option(label, v, false, v === b.status));
    sel.addEventListener("change", () =>
      F.updateDoc(F.doc(db, "bookings", d.id), { status: sel.value }).catch((e) => say("Nie zapisano statusu: " + e.code)));
    cell(sel);
    return tr;
  }));
}

function addPriceRow({ name = "", nameEn = "", price = "", parts = false }) {
  const tr = document.createElement("tr");
  const input = (type, value, label) => {
    const el = document.createElement("input");
    el.type = type;
    el.setAttribute("aria-label", label);
    if (type === "checkbox") el.checked = value;
    else el.value = value;
    if (type === "number") { el.min = "0"; el.step = "1"; }
    tr.insertCell().append(el);
  };
  input("text", name, "Usługa (PL)");
  input("text", nameEn, "Usługa (EN)");
  input("number", price, "Cena w zł");
  input("checkbox", parts, "Plus materiały");
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn-line-navy";
  del.textContent = "Usuń";
  del.addEventListener("click", () => tr.remove());
  tr.insertCell().append(del);
  $("price-rows").append(tr);
}

async function loadPrices(F, db) {
  $("price-rows").replaceChildren();
  try {
    const snap = await F.getDoc(F.doc(db, "prices", "current"));
    const items = snap.exists() ? snap.data().items : null;
    if (Array.isArray(items) && items.length) return items.forEach(addPriceRow);
  } catch (e) {
    say("Nie udało się wczytać cennika z bazy: " + e.code);
  }
  await fillFromStatic();
}

// Reads the price table from the public pages (cennik.html + en/cennik.html).
async function fillFromStatic() {
  const read = async (url) => {
    const html = await (await fetch(url, { cache: "no-store" })).text();
    return [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("table.prices tbody tr")];
  };
  const [pl, en] = await Promise.all([read("cennik.html"), read("en/cennik.html")]);
  $("price-rows").replaceChildren();
  pl.forEach((tr, i) => addPriceRow({
    name: tr.cells[0].textContent.trim(),
    nameEn: en[i]?.cells[0].textContent.trim() ?? "",
    price: Number(tr.dataset.price),
    parts: tr.hasAttribute("data-parts"),
  }));
}

async function savePrices(F, db) {
  const items = [...$("price-rows").rows].map((tr) => {
    const [name, nameEn, price, parts] = [...tr.querySelectorAll("input")];
    return { name: name.value.trim(), nameEn: nameEn.value.trim(), price: Number(price.value), parts: parts.checked };
  });
  if (!items.length || items.some((i) => !i.name || !(i.price > 0))) {
    return say("Każda pozycja musi mieć nazwę (PL) i cenę większą od zera.");
  }
  try {
    await F.setDoc(F.doc(db, "prices", "current"), { items, updatedAt: F.serverTimestamp() });
    say("Cennik zapisany. Strona pokaże nowe ceny po odświeżeniu.", true);
  } catch (e) {
    say("Nie zapisano cennika: " + e.code);
  }
}
