const loginPanel = document.querySelector("#admin-login-panel");
const dashboard = document.querySelector("#admin-dashboard");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const logoutButton = document.querySelector("#admin-logout");
const refreshLeadsButton = document.querySelector("#refresh-leads");
const refreshVisitsButton = document.querySelector("#refresh-visits");
const leadsTable = document.querySelector("#leads-table");
const visitsTable = document.querySelector("#visits-table");
const leadCount = document.querySelector("#lead-count");
const visitCount = document.querySelector("#visit-count");
const latestLead = document.querySelector("#latest-lead");

function setAdminStatus(message, type = "") {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.dataset.type = type;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function safeText(value) {
  return value ? String(value) : "-";
}

function escapeHtml(value) {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showDashboard() {
  loginPanel.classList.add("is-hidden");
  dashboard.classList.remove("is-hidden");
}

function showLogin() {
  dashboard.classList.add("is-hidden");
  loginPanel.classList.remove("is-hidden");
}

async function loadLeads() {
  if (!fixflowSupabase || !leadsTable) return;

  const { data, error } = await fixflowSupabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    leadsTable.innerHTML = `<tr><td colspan="7">${safeText(error.message)}</td></tr>`;
    return;
  }

  leadCount.textContent = data.length;
  latestLead.textContent = data[0] ? formatDate(data[0].created_at) : "None yet";

  if (!data.length) {
    leadsTable.innerHTML = '<tr><td colspan="7">No signup requests yet.</td></tr>';
    return;
  }

  leadsTable.innerHTML = data
    .map(
      (lead) => `
        <tr>
          <td>${formatDate(lead.created_at)}</td>
          <td>${escapeHtml(lead.full_name)}</td>
          <td>${escapeHtml(lead.business_name)}</td>
          <td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td>
          <td>${escapeHtml(lead.whatsapp)}</td>
          <td>${escapeHtml(lead.website_type)}</td>
          <td>${escapeHtml(lead.message)}</td>
        </tr>
      `
    )
    .join("");
}

async function loadVisits() {
  if (!fixflowSupabase || !visitsTable) return;

  const { data, error } = await fixflowSupabase
    .from("page_visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    visitsTable.innerHTML = `<tr><td colspan="5">${safeText(error.message)}</td></tr>`;
    return;
  }

  visitCount.textContent = data.length;

  if (!data.length) {
    visitsTable.innerHTML = '<tr><td colspan="5">No visits tracked yet.</td></tr>';
    return;
  }

  visitsTable.innerHTML = data
    .map(
      (visit) => `
        <tr>
          <td>${formatDate(visit.created_at)}</td>
          <td>${escapeHtml(visit.path)}</td>
          <td>${escapeHtml(visit.referrer)}</td>
          <td>${escapeHtml(visit.screen_width)} x ${escapeHtml(visit.screen_height)}</td>
          <td>${escapeHtml(visit.timezone)}</td>
        </tr>
      `
    )
    .join("");
}

async function loadDashboard() {
  await Promise.all([loadLeads(), loadVisits()]);
}

async function checkSession() {
  if (!fixflowSupabase) {
    setAdminStatus("Supabase is not available. Check the config file.", "error");
    return;
  }

  const { data } = await fixflowSupabase.auth.getSession();

  if (data.session) {
    showDashboard();
    await loadDashboard();
  } else {
    showLogin();
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAdminStatus("Signing in...");

    const formData = new FormData(loginForm);
    const email = formData.get("email");
    const password = formData.get("password");

    const { error } = await fixflowSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAdminStatus(error.message, "error");
      return;
    }

    setAdminStatus("");
    showDashboard();
    await loadDashboard();
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fixflowSupabase.auth.signOut();
    showLogin();
  });
}

if (refreshLeadsButton) {
  refreshLeadsButton.addEventListener("click", loadLeads);
}

if (refreshVisitsButton) {
  refreshVisitsButton.addEventListener("click", loadVisits);
}

checkSession();
