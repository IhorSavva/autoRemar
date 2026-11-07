const btn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");

function setOpen(open) {
  nav.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
}

const head = document.querySelector(".site-head");
const onScroll = () => head.classList.toggle("scrolled", scrollY > 4);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

if (btn && nav) {
  btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); btn.focus(); }
  });
}
