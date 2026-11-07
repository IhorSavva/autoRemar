// Opens gallery photos full size in a <dialog>; links still work as plain image links without JS.
const gallery = document.querySelector(".gallery");
const en = document.documentElement.lang === "en";

if (gallery && window.HTMLDialogElement) {
  const box = document.createElement("dialog");
  box.className = "lightbox";
  box.innerHTML = `<button type="button">${en ? "Close" : "Zamknij"} ✕</button><img alt="">`;
  const img = box.querySelector("img");
  document.body.append(box);

  gallery.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    img.src = a.href;
    img.alt = a.querySelector("img").alt;
    box.showModal();
  });
  // Any click (button, photo or backdrop) closes it.
  box.addEventListener("click", () => box.close());
}
