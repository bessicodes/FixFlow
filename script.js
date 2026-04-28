const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const revealItems = document.querySelectorAll(".reveal");
const rotatingWord = document.querySelector("#rotating-word");
const etherealHero = document.querySelector(".ethereal-hero");
const signupForm = document.querySelector("#signup-form");
const signupStatus = document.querySelector("#signup-status");
const year = document.querySelector("#year");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (year) {
  year.textContent = new Date().getFullYear();
}

function closeMenu() {
  if (!navToggle || !navMenu) return;

  document.body.classList.remove("nav-open");
  navMenu.classList.remove("is-open");
  navToggle.classList.remove("is-active");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
}

function updateHeaderState() {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
}

function updateScrollProgress() {
  if (!scrollProgress) return;

  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = pageHeight > 0 ? window.scrollY / pageHeight : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(progress, 1)})`;
}

function setSignupStatus(message, type = "") {
  if (!signupStatus) return;
  signupStatus.textContent = message;
  signupStatus.dataset.type = type;
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.classList.toggle("is-active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

revealItems.forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index % 4, 3) * 70}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -48px 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sections = document.querySelectorAll("main section[id]");

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  {
    threshold: 0.42,
  }
);

sections.forEach((section) => navObserver.observe(section));

if (rotatingWord && !reducedMotion) {
  const words = ["clarity", "trust", "mobile", "contact", "simplicity"];
  let wordIndex = 0;

  window.setInterval(() => {
    rotatingWord.classList.add("is-changing");

    window.setTimeout(() => {
      wordIndex = (wordIndex + 1) % words.length;
      rotatingWord.textContent = words[wordIndex];
      rotatingWord.classList.remove("is-changing");
    }, 220);
  }, 2100);
}

if (etherealHero && !reducedMotion) {
  etherealHero.addEventListener(
    "pointermove",
    (event) => {
      const rect = etherealHero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      etherealHero.style.setProperty("--beam-x", `${x.toFixed(1)}%`);
      etherealHero.style.setProperty("--beam-y", `${y.toFixed(1)}%`);
    },
    { passive: true }
  );
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!fixflowSupabase) {
      setSignupStatus("Signup is not connected yet. Please try again later.", "error");
      return;
    }

    const formData = new FormData(signupForm);
    const lead = {
      full_name: String(formData.get("full_name") || "").trim(),
      business_name: String(formData.get("business_name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      website_type: String(formData.get("website_type") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    setSignupStatus("Sending request...");

    const { error } = await fixflowSupabase.from("leads").insert(lead);

    if (error) {
      setSignupStatus("Something went wrong. Please email hello@fixflow.co.za for now.", "error");
      return;
    }

    signupForm.reset();
    setSignupStatus("Thanks. Your website request has been saved.", "success");
  });
}

async function trackVisit() {
  if (!fixflowSupabase || window.location.pathname.endsWith("admin.html")) return;

  await fixflowSupabase.from("page_visits").insert({
    path: window.location.pathname || "/",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    screen_width: window.screen.width || null,
    screen_height: window.screen.height || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navMenu && navMenu.classList.contains("is-open")) {
    closeMenu();
  }
});

window.addEventListener(
  "scroll",
  () => {
    updateHeaderState();
    updateScrollProgress();
  },
  { passive: true }
);

updateHeaderState();
updateScrollProgress();
trackVisit();
