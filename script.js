// Mobile menu toggle
const menuBtn = document.querySelector(".menu-btn");
const mobileNav = document.querySelector(".mobile-nav");

if (menuBtn && mobileNav) {
  menuBtn.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

// Reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.14 }
);

revealEls.forEach((el) => revealObserver.observe(el));

// Animate skill bars when skills section is visible
const skillsSection = document.querySelector("#skills");
const skillEls = document.querySelectorAll(".skill");

if (skillsSection && skillEls.length) {
  const skillsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        skillEls.forEach((s) => {
          const level = s.getAttribute("data-level") || "0";
          const bar = s.querySelector(".bar");
          if (bar) bar.style.width = `${level}%`;
        });
        skillsObserver.disconnect();
      });
    },
    { threshold: 0.25 }
  );

  skillsObserver.observe(skillsSection);
}

// Contact form handler (mailto fallback)
const form = document.querySelector("#contactForm");
const statusEl = document.querySelector("#formStatus");

if (form && statusEl) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.elements["name"].value.trim();
    const email = form.elements["email"].value.trim();
    const subject = form.elements["subject"].value.trim();
    const message = form.elements["message"].value.trim();

    if (!name || !email || !subject || !message) {
      statusEl.textContent = "Please fill out all fields.";
      return;
    }

    statusEl.textContent = "Opening your email client…";

    const mailto = new URL("mailto:anuragbojja19@gmail.com");
    mailto.searchParams.set("subject", `[Portfolio] ${subject}`);
    mailto.searchParams.set(
      "body",
      `Name: ${name}\nEmail: ${email}\n\n${message}\n`
    );

    window.location.href = mailto.toString();

    setTimeout(() => {
      statusEl.textContent = "If your email client did not open, please email me directly.";
    }, 1200);
  });
}