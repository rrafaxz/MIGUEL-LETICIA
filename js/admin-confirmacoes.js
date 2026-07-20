const ADMIN_VISUAL_PASSWORD = "casal123";

const adminElements = {
  login: document.querySelector("#admin-login"),
  dashboard: document.querySelector("#admin-dashboard"),
  password: document.querySelector("#admin-password"),
  enter: document.querySelector("#admin-enter-button"),
  loginStatus: document.querySelector("#admin-login-status"),
  refresh: document.querySelector("#refresh-admin-button"),
  logout: document.querySelector("#logout-admin-button"),
  updatedAt: document.querySelector("#admin-updated-at"),
  status: document.querySelector("#admin-status"),
  summaryConfirmed: document.querySelector("#summary-confirmed"),
  summaryPending: document.querySelector("#summary-pending"),
  summaryNotGoing: document.querySelector("#summary-not-going"),
  summaryTotalGuests: document.querySelector("#summary-total-guests"),
  confirmedList: document.querySelector("#confirmed-list"),
  pendingList: document.querySelector("#pending-list"),
  notGoingList: document.querySelector("#not-going-list"),
  confirmedCount: document.querySelector("#column-confirmed-count"),
  pendingCount: document.querySelector("#column-pending-count"),
  notGoingCount: document.querySelector("#column-not-going-count"),
};

const adminSupabase = window.pmSupabase;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAttendanceStatus(status) {
  const normalized = normalizeText(status);

  if (normalized === "yes" || normalized === "going" || normalized === "vai") {
    return "confirmed";
  }

  if (
    normalized === "no" ||
    normalized === "not_going" ||
    normalized === "nao" ||
    normalized === "nao vai"
  ) {
    return "notGoing";
  }

  return "pending";
}

function formatDate(value) {
  if (!value) {
    return "Ainda sem confirmação";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Ainda sem confirmação";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sideSortValue(side) {
  const normalized = normalizeText(side);

  if (normalized.includes("leticia")) return 0;
  if (normalized.includes("miguel")) return 1;
  if (normalized.includes("casal")) return 2;

  return 3;
}

function groupSortValue(group, fallback) {
  const value = Number(group?.sort_order);
  return Number.isFinite(value) ? value : fallback;
}

function guestSortValue(guest, fallback) {
  const value = Number(guest?.guest_order);
  return Number.isFinite(value) ? value : fallback;
}

function setDashboardVisible(isVisible) {
  adminElements.login.style.display = isVisible ? "none" : "block";
  adminElements.dashboard.classList.toggle("is-visible", isVisible);
}

function setLoading(isLoading) {
  adminElements.refresh.disabled = isLoading;
  if (isLoading) {
    adminElements.status.textContent = "Carregando convidados...";
  }
}

function guestCardMarkup(item) {
  const notes = item.notes ? `<span class="admin-guest-note">${escapeHtml(item.notes)}</span>` : "";
  const confirmedAt = item.confirmedAt
    ? `<span>Confirmado em ${escapeHtml(formatDate(item.confirmedAt))}</span>`
    : "";

  return `
    <article class="admin-guest-card">
      <strong>${escapeHtml(item.guestName)}</strong>
      <span>${escapeHtml(item.groupName)}</span>
      <div class="admin-guest-meta">
        <span>${escapeHtml(item.side)}</span>
        ${confirmedAt}
        ${notes}
      </div>
    </article>
  `;
}

function emptyMarkup(message) {
  return `<p class="admin-empty">${message}</p>`;
}

function renderList(element, items, emptyMessage) {
  element.innerHTML = items.length ? items.map(guestCardMarkup).join("") : emptyMarkup(emptyMessage);
}

function renderDashboard(items) {
  const confirmed = items.filter((item) => item.status === "confirmed");
  const pending = items.filter((item) => item.status === "pending");
  const notGoing = items.filter((item) => item.status === "notGoing");

  adminElements.summaryConfirmed.textContent = confirmed.length;
  adminElements.summaryPending.textContent = pending.length;
  adminElements.summaryNotGoing.textContent = notGoing.length;
  adminElements.summaryTotalGuests.textContent = items.length;

  adminElements.confirmedCount.textContent = confirmed.length;
  adminElements.pendingCount.textContent = pending.length;
  adminElements.notGoingCount.textContent = notGoing.length;

  renderList(adminElements.confirmedList, confirmed, "Nenhum convidado confirmado ainda.");
  renderList(adminElements.pendingList, pending, "Nenhum convidado pendente.");
  renderList(adminElements.notGoingList, notGoing, "Nenhum convidado marcou que não irá.");

  adminElements.updatedAt.textContent = `Atualizado em ${formatDate(new Date().toISOString())}`;
}

function buildGuestItems(groups, guests) {
  const groupsById = new Map(groups.map((group, index) => [group.id, { ...group, rowIndex: index }]));

  return guests
    .map((guest, index) => {
      const group = groupsById.get(guest.group_id) || {};
      const side = group.side || "Casal";

      return {
        guestName: guest.full_name || "Convidado sem nome",
        groupName: group.display_name || "Grupo sem nome",
        side,
        notes: guest.notes || "",
        status: normalizeAttendanceStatus(guest.attendance_status),
        confirmedAt: group.confirmed_at || null,
        groupOrder: groupSortValue(group, group.rowIndex ?? index),
        guestOrder: guestSortValue(guest, index),
        rowIndex: index,
      };
    })
    .sort(
      (a, b) =>
        sideSortValue(a.side) - sideSortValue(b.side) ||
        a.groupOrder - b.groupOrder ||
        a.guestOrder - b.guestOrder ||
        a.guestName.localeCompare(b.guestName, "pt-BR"),
    );
}

async function fetchAdminData() {
  const [groupsResponse, guestsResponse] = await Promise.all([
    adminSupabase.from("guest_groups").select("*"),
    adminSupabase.from("guests").select("*"),
  ]);

  if (groupsResponse.error) {
    throw groupsResponse.error;
  }

  if (guestsResponse.error) {
    throw guestsResponse.error;
  }

  return buildGuestItems(groupsResponse.data || [], guestsResponse.data || []);
}

async function loadAdminData() {
  if (!adminSupabase) {
    adminElements.status.textContent = "Não foi possível conectar ao Supabase.";
    return;
  }

  setLoading(true);

  try {
    const guests = await fetchAdminData();
    renderDashboard(guests);
    adminElements.status.textContent = "";
  } catch (error) {
    console.error(error);
    adminElements.status.textContent = "Não foi possível carregar os convidados. Tente atualizar em alguns instantes.";
  } finally {
    setLoading(false);
  }
}

function showDashboard() {
  setDashboardVisible(true);
  loadAdminData();
}

function tryLogin() {
  if (adminElements.password.value === ADMIN_VISUAL_PASSWORD) {
    sessionStorage.setItem("ml-admin-unlocked", "true");
    adminElements.loginStatus.textContent = "";
    showDashboard();
    return;
  }

  adminElements.loginStatus.textContent = "Senha incorreta.";
}

adminElements.enter.addEventListener("click", tryLogin);

adminElements.password.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    tryLogin();
  }
});

adminElements.refresh.addEventListener("click", loadAdminData);

adminElements.logout.addEventListener("click", () => {
  sessionStorage.removeItem("ml-admin-unlocked");
  adminElements.password.value = "";
  setDashboardVisible(false);
  adminElements.password.focus();
});

if (sessionStorage.getItem("ml-admin-unlocked") === "true") {
  showDashboard();
} else {
  setDashboardVisible(false);
}
