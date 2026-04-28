const loginPanel = document.querySelector("#admin-login-panel");
const dashboard = document.querySelector("#admin-dashboard");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const logoutButton = document.querySelector("#admin-logout");
const refreshLeadsButton = document.querySelector("#refresh-leads");
const refreshVisitsButton = document.querySelector("#refresh-visits");
const exportLeadsButton = document.querySelector("#export-leads");
const leadSearch = document.querySelector("#lead-search");
const leadStatusFilter = document.querySelector("#lead-status-filter");
const leadTypeFilter = document.querySelector("#lead-type-filter");
const leadsTable = document.querySelector("#leads-table");
const visitsTable = document.querySelector("#visits-table");
const leadCount = document.querySelector("#lead-count");
const newLeadCount = document.querySelector("#new-lead-count");
const progressLeadCount = document.querySelector("#progress-lead-count");
const todayVisitCount = document.querySelector("#today-visit-count");
const leadTableSummary = document.querySelector("#lead-table-summary");
const visitSummary = document.querySelector("#visit-summary");
const visitInsights = document.querySelector("#visit-insights");
const detailTitle = document.querySelector("#detail-title");
const detailSubtitle = document.querySelector("#detail-subtitle");
const leadDetailList = document.querySelector("#lead-detail-list");

const STATUSES = ["new", "contacted", "in_progress", "completed", "closed"];
let leadsData = [];
let visitsData = [];
let filteredLeads = [];

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

function formatStatus(value) {
  return safeText(value).replaceAll("_", " ");
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

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function updateStats() {
  leadCount.textContent = leadsData.length;
  newLeadCount.textContent = leadsData.filter((lead) => lead.status === "new").length;
  progressLeadCount.textContent = leadsData.filter((lead) => lead.status === "in_progress").length;
  todayVisitCount.textContent = visitsData.filter((visit) => isToday(visit.created_at)).length;
}

function updateTypeFilter() {
  const currentValue = leadTypeFilter.value;
  const types = [...new Set(leadsData.map((lead) => lead.website_type).filter(Boolean))].sort();

  leadTypeFilter.innerHTML = '<option value="all">All types</option>';
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    leadTypeFilter.appendChild(option);
  });

  leadTypeFilter.value = types.includes(currentValue) ? currentValue : "all";
}

function applyLeadFilters() {
  const query = leadSearch.value.trim().toLowerCase();
  const status = leadStatusFilter.value;
  const type = leadTypeFilter.value;

  filteredLeads = leadsData.filter((lead) => {
    const searchText = [
      lead.full_name,
      lead.business_name,
      lead.email,
      lead.whatsapp,
      lead.website_type,
      lead.current_website,
      lead.message,
      lead.status,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchText.includes(query);
    const matchesStatus = status === "all" || lead.status === status;
    const matchesType = type === "all" || lead.website_type === type;

    return matchesSearch && matchesStatus && matchesType;
  });

  renderLeads();
}

function renderLeads() {
  leadTableSummary.textContent = `${filteredLeads.length} of ${leadsData.length} requests shown`;

  if (!filteredLeads.length) {
    leadsTable.innerHTML = '<tr><td colspan="6">No requests match the current filters.</td></tr>';
    return;
  }

  leadsTable.innerHTML = filteredLeads
    .map(
      (lead) => `
        <tr>
          <td>${formatDate(lead.created_at)}</td>
          <td>
            <strong>${escapeHtml(lead.full_name)}</strong>
            <span>${escapeHtml(lead.business_name)}</span>
          </td>
          <td>
            <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>
            <span>${escapeHtml(lead.whatsapp)}</span>
          </td>
          <td>${escapeHtml(lead.website_type)}</td>
          <td>
            <select class="status-select" data-lead-id="${lead.id}">
              ${STATUSES.map(
                (status) =>
                  `<option value="${status}" ${lead.status === status ? "selected" : ""}>${formatStatus(status)}</option>`
              ).join("")}
            </select>
          </td>
          <td><button class="table-action" type="button" data-view-lead="${lead.id}">View</button></td>
        </tr>
      `
    )
    .join("");
}

function renderLeadDetail(leadId) {
  const lead = leadsData.find((item) => item.id === leadId);
  if (!lead) return;

  detailTitle.textContent = lead.business_name || lead.full_name || "Website request";
  detailSubtitle.textContent = `${safeText(lead.full_name)} • ${formatStatus(lead.status)}`;
  leadDetailList.innerHTML = `
    <div><dt>Date</dt><dd>${formatDate(lead.created_at)}</dd></div>
    <div><dt>Name</dt><dd>${escapeHtml(lead.full_name)}</dd></div>
    <div><dt>Business</dt><dd>${escapeHtml(lead.business_name)}</dd></div>
    <div><dt>Email</dt><dd><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></dd></div>
    <div><dt>WhatsApp</dt><dd>${escapeHtml(lead.whatsapp)}</dd></div>
    <div><dt>Website type</dt><dd>${escapeHtml(lead.website_type)}</dd></div>
    <div><dt>Current website</dt><dd>${escapeHtml(lead.current_website)}</dd></div>
    <div><dt>Message</dt><dd>${escapeHtml(lead.message)}</dd></div>
  `;
}

async function updateLeadStatus(leadId, status) {
  const { error } = await fixflowSupabase.from("leads").update({ status }).eq("id", leadId);

  if (error) {
    alert(`Could not update status: ${error.message}`);
    return;
  }

  leadsData = leadsData.map((lead) => (lead.id === leadId ? { ...lead, status } : lead));
  updateStats();
  applyLeadFilters();
  renderLeadDetail(leadId);
}

async function loadLeads() {
  if (!fixflowSupabase || !leadsTable) return;

  const { data, error } = await fixflowSupabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    leadsTable.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  leadsData = data || [];
  updateTypeFilter();
  updateStats();
  applyLeadFilters();
}

function renderVisitInsights() {
  const pageCounts = visitsData.reduce((acc, visit) => {
    const path = visit.path || "/";
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  visitSummary.textContent = `${visitsData.length} recent visits loaded`;
  visitInsights.innerHTML = topPages.length
    ? topPages.map(([path, count]) => `<span>${escapeHtml(path)}: ${count}</span>`).join("")
    : "<span>No visit insights yet</span>";
}

function renderVisits() {
  renderVisitInsights();

  if (!visitsData.length) {
    visitsTable.innerHTML = '<tr><td colspan="5">No visits tracked yet.</td></tr>';
    return;
  }

  visitsTable.innerHTML = visitsData
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

async function loadVisits() {
  if (!fixflowSupabase || !visitsTable) return;

  const { data, error } = await fixflowSupabase
    .from("page_visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    visitsTable.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  visitsData = data || [];
  updateStats();
  renderVisits();
}

function exportLeadsCsv() {
  const rows = [
    ["Date", "Name", "Business", "Email", "WhatsApp", "Website Type", "Current Website", "Status", "Message"],
    ...filteredLeads.map((lead) => [
      formatDate(lead.created_at),
      safeText(lead.full_name),
      safeText(lead.business_name),
      safeText(lead.email),
      safeText(lead.whatsapp),
      safeText(lead.website_type),
      safeText(lead.current_website),
      formatStatus(lead.status),
      safeText(lead.message),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fixflow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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

if (refreshLeadsButton) refreshLeadsButton.addEventListener("click", loadLeads);
if (refreshVisitsButton) refreshVisitsButton.addEventListener("click", loadVisits);
if (exportLeadsButton) exportLeadsButton.addEventListener("click", exportLeadsCsv);
if (leadSearch) leadSearch.addEventListener("input", applyLeadFilters);
if (leadStatusFilter) leadStatusFilter.addEventListener("change", applyLeadFilters);
if (leadTypeFilter) leadTypeFilter.addEventListener("change", applyLeadFilters);

if (leadsTable) {
  leadsTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-lead]");
    if (button) renderLeadDetail(button.dataset.viewLead);
  });

  leadsTable.addEventListener("change", (event) => {
    const select = event.target.closest(".status-select");
    if (select) updateLeadStatus(select.dataset.leadId, select.value);
  });
}

checkSession();
