// Reveal-on-scroll. Content is visible without JS; this only adds the entrance.
const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
if ("IntersectionObserver" in window && els.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
} else {
  els.forEach((el) => el.classList.add("in"));
}
