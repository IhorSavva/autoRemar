import { configured, getApp, firestore, emailjs } from "./firebase-config.js";

const form = document.getElementById("booking");
const en = document.documentElement.lang === "en";
const T = en
  ? {
      ok: "Thank you! We will call you back to confirm the date (Mon–Fri 8:00–17:00).",
      demo: "(Demo mode: the request was not saved.)",
      err: "Sorry, the request could not be sent. Please call us: 22 863 21 21.",
      phone: "Please enter a phone number with at least 9 digits.",
      weekend: "We are closed at weekends. Pick a weekday or we will suggest the nearest one.",
      hours: "We work Mon–Fri 8:00–17:00",
    }
  : {
      ok: "Dziękujemy! Oddzwonimy, żeby potwierdzić termin (pn–pt 8:00–17:00).",
      demo: "(Tryb demo: zgłoszenie nie zostało zapisane.)",
      err: "Nie udało się wysłać zgłoszenia. Zadzwoń: 22 863 21 21.",
      phone: "Podaj numer telefonu (co najmniej 9 cyfr).",
      weekend: "W weekend jesteśmy nieczynni. Wybierz dzień roboczy albo zaproponujemy najbliższy.",
      hours: "Pracujemy pn–pt 8:00–17:00",
    };

if (form) {
  const f = form.elements;
  const msg = form.querySelector(".form-msg");
  const hint = document.getElementById("date-hint");
  const submit = form.querySelector("[type=submit]");

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  f.date.min = now.toISOString().slice(0, 10);

  f.date.addEventListener("change", () => {
    const day = f.date.value ? new Date(f.date.value + "T12:00").getDay() : 1;
    const weekend = day === 0 || day === 6;
    hint.textContent = weekend ? T.weekend : T.hours;
    hint.classList.toggle("warn", weekend);
  });
  f.phone.addEventListener("input", () => f.phone.setCustomValidity(""));

  const show = (cls, text) => { msg.className = "form-msg " + cls; msg.textContent = text; };
  const val = (el, max) => el.value.trim().slice(0, max);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    f.phone.setCustomValidity(f.phone.value.replace(/\D/g, "").length >= 9 ? "" : T.phone);
    if (!form.reportValidity()) return;

    const done = () => {
      show("ok", configured ? T.ok : `${T.ok} ${T.demo}`);
      form.reset();
      hint.textContent = T.hours;
      hint.classList.remove("warn");
    };
    if (f.website.value) return done(); // honeypot: bots get a fake success

    // Keys and limits must match firestore.rules.
    const data = {
      service: val(f.service, 100), car: val(f.car, 100), year: val(f.year, 4), date: val(f.date, 10),
      name: val(f.name, 100), phone: val(f.phone, 30), email: val(f.email, 120), comment: val(f.comment, 1000),
      lang: en ? "en" : "pl",
    };

    submit.disabled = true;
    try {
      if (configured) {
        const { getFirestore, collection, addDoc, serverTimestamp } = await firestore();
        await addDoc(collection(getFirestore(await getApp()), "bookings"), { ...data, status: "new", createdAt: serverTimestamp() });
        notify(data);
      } else {
        console.info("[demo] Zgłoszenie:", data);
      }
      done();
    } catch (err) {
      console.error(err);
      show("err", T.err);
    } finally {
      submit.disabled = false;
    }
  });
}

// The booking is already saved; a failed e-mail must not show an error to the customer.
function notify(data) {
  if (!emailjs.serviceId || !emailjs.templateId || !emailjs.publicKey) return;
  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: emailjs.serviceId, template_id: emailjs.templateId, user_id: emailjs.publicKey,
      template_params: data,
    }),
  }).catch((e) => console.warn("EmailJS:", e));
}
