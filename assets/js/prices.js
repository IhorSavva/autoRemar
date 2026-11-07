// Replaces the static price table with prices/current from Firestore, if there is one.
import { configured, getApp, firestore } from "./firebase-config.js";

const tables = document.querySelectorAll("table.prices[data-live]");
const en = document.documentElement.lang === "en";

export function priceRow({ name, nameEn, price, parts }) {
  const tr = document.createElement("tr");
  const td = tr.insertCell();
  td.textContent = (en && nameEn) || name;
  const p = tr.insertCell();
  p.className = "price";
  p.textContent = en ? `PLN ${price}` : `${price} zł`;
  if (parts) {
    const note = document.createElement("span");
    note.className = "note";
    note.textContent = en ? "+ parts" : "+ materiały";
    p.append(note);
  }
  return tr;
}

async function load() {
  const { getFirestore, doc, getDoc } = await firestore();
  const snap = await getDoc(doc(getFirestore(await getApp()), "prices", "current"));
  const items = snap.exists() ? snap.data().items : null;
  if (!Array.isArray(items) || !items.length) return;
  tables.forEach((t) => t.tBodies[0].replaceChildren(...items.map(priceRow)));
}

if (tables.length && configured) load().catch((e) => console.warn("Cennik: zostaje wersja statyczna", e));
