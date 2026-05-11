// Este bloqueio é apenas visual no front-end. Para segurança real, mova o admin
// para uma área autenticada com Supabase Auth e políticas RLS específicas.
const ADMIN_VISUAL_PASSWORD = "pm2026";

const ADMIN_VIEWS = {
  generalTotals: "rsvp_totais_gerais",
  sideTotals: "rsvp_totais_por_lado",
  detail: "rsvp_admin_view",
  tabs: {
    all: "rsvp_grupos_resumo",
    going: "rsvp_grupos_que_vao",
    notGoing: "rsvp_grupos_que_nao_vao",
    mixed: "rsvp_grupos_mistos",
    pending: "rsvp_grupos_pendentes",
  },
};

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
  list: document.querySelector("#admin-list"),
  tabs: document.querySelectorAll("[data-admin-tab]"),
  summaryGoing: document.querySelector("#summary-going"),
  summaryNotGoing: document.querySelector("#summary-not-going"),
  summaryPending: document.querySelector("#summary-pending"),
  summaryTotalGuests: document.querySelector("#summary-total-guests"),
  summarySideMaynara: document.querySelector("#summary-side-maynara"),
  summarySidePedro: document.querySelector("#summary-side-pedro"),
};

const adminSupabase = window.pmSupabase;

const adminState = {
  activeTab: "all",
  groups: [],
  tabGroups: {
    all: [],
    going: [],
    notGoing: [],
    mixed: [],
    pending: [],
  },
};

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
    return "yes";
  }

  if (
    normalized === "no" ||
    normalized === "not_going" ||
    normalized === "nao" ||
    normalized === "nao vai"
  ) {
    return "no";
  }

  return "pending";
}

function statusLabel(status) {
  const normalized = normalizeAttendanceStatus(status);

  if (normalized === "yes") {
    return "Vai";
  }

  if (normalized === "no") {
    return "Não vai";
  }

  return "Pendente";
}

function groupAnswered(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function formatDate(value) {
  if (!value) {
    return "Pendente";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstValue(row, keys, fallback = null) {
  if (!row) {
    return fallback;
  }

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return fallback;
}

function numberValue(row, keys, fallback = 0) {
  const value = firstValue(row, keys, fallback);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getGroupName(row) {
  return firstValue(row, ["grupo", "display_name", "nome_grupo", "grupo_nome", "group_name"], "Grupo sem nome");
}

function getGuestName(row) {
  return firstValue(row, ["convidado", "full_name", "nome_convidado", "guest_name"], "Convidado sem nome");
}

function getSide(row) {
  const rawSide = firstValue(
    row,
    ["lado", "lado_nome", "familia_lado", "lado_do_casal", "origem", "side"],
    "",
  );
  const normalized = normalizeText(rawSide);

  if (normalized.includes("maynara")) {
    return "Maynara";
  }

  if (normalized.includes("pedro")) {
    return "Pedro";
  }

  return "Sem lado";
}

function sideSortValue(side) {
  if (side === "Maynara") {
    return 0;
  }

  if (side === "Pedro") {
    return 1;
  }

  return 2;
}

function groupSortValue(row, fallback) {
  return numberValue(
    row,
    ["ordem_grupo", "grupo_ordem", "ordem", "sort_order", "display_order", "position"],
    fallback,
  );
}

function guestSortValue(row, fallback) {
  return numberValue(
    row,
    ["ordem_convidado", "convidado_ordem", "guest_order", "sort_order", "position"],
    fallback,
  );
}

function showDashboard() {
  adminElements.login.style.display = "none";
  adminElements.dashboard.classList.add("is-visible");
  loadAdminData();
}

async function readView(viewName, orderColumns = []) {
  let query = adminSupabase.from(viewName).select("*");

  orderColumns.forEach((column) => {
    query = query.order(column, { ascending: true, nullsFirst: false });
  });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

function organizeDetailRows(rows, sideLookup = new Map()) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const groupName = getGroupName(row);
    const guestName = getGuestName(row);
    const rowSide = getSide(row);
    const sideFromGroups = sideLookup.get(normalizeText(groupName));
    const side = rowSide === "Sem lado" && sideFromGroups ? sideFromGroups : rowSide;
    const groupKey = `${side}::${normalizeText(groupName)}`;
    const guestKey = normalizeText(guestName);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        name: groupName,
        side,
        answered: groupAnswered(row.grupo_ja_respondeu),
        updatedAt: firstValue(row, ["ultima_atualizacao", "confirmed_at", "updated_at"], null),
        order: groupSortValue(row, index),
        rowIndex: index,
        guests: new Map(),
      });
    }

    const group = groups.get(groupKey);
    group.answered = group.answered || groupAnswered(row.grupo_ja_respondeu);
    group.order = Math.min(group.order, groupSortValue(row, index));

    const rowUpdatedAt = firstValue(row, ["ultima_atualizacao", "confirmed_at", "updated_at"], null);
    if (rowUpdatedAt) {
      const currentDate = group.updatedAt ? new Date(group.updatedAt).getTime() : 0;
      const nextDate = new Date(rowUpdatedAt).getTime();

      if (!group.updatedAt || nextDate >= currentDate) {
        group.updatedAt = rowUpdatedAt;
      }
    }

    if (!group.guests.has(guestKey)) {
      group.guests.set(guestKey, {
        name: guestName,
        status: normalizeAttendanceStatus(firstValue(row, ["status", "attendance_status"], "pending")),
        order: guestSortValue(row, index),
        rowIndex: index,
      });
    } else {
      const guest = group.guests.get(guestKey);
      guest.status = normalizeAttendanceStatus(firstValue(row, ["status", "attendance_status"], guest.status));
      guest.order = Math.min(guest.order, guestSortValue(row, index));
    }
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      guests: [...group.guests.values()].sort((a, b) => a.order - b.order || a.rowIndex - b.rowIndex),
    }))
    .sort(
      (a, b) =>
        sideSortValue(a.side) - sideSortValue(b.side) ||
        a.order - b.order ||
        a.rowIndex - b.rowIndex,
    );
}

function deriveGeneralTotals(groups) {
  const totals = {
    going: 0,
    notGoing: 0,
    pending: 0,
    totalGuests: 0,
  };

  groups.forEach((group) => {
    group.guests.forEach((guest) => {
      totals.totalGuests += 1;

      if (guest.status === "yes") {
        totals.going += 1;
      } else if (guest.status === "no") {
        totals.notGoing += 1;
      } else {
        totals.pending += 1;
      }
    });
  });

  return totals;
}

function parseGeneralTotals(rows, groups) {
  const row = Array.isArray(rows) ? rows[0] : rows;
  const fallback = deriveGeneralTotals(groups);

  return {
    going: numberValue(row, ["total_vai", "vai", "total_que_vai", "pessoas_que_vao", "going"], fallback.going),
    notGoing: numberValue(
      row,
      ["total_nao_vai", "nao_vai", "total_que_nao_vai", "pessoas_que_nao_vao", "not_going"],
      fallback.notGoing,
    ),
    pending: numberValue(row, ["total_pendente", "pendente", "total_pendentes", "pending"], fallback.pending),
    totalGuests: numberValue(
      row,
      ["total_convidados", "convidados", "total", "total_pessoas", "total_guests"],
      fallback.totalGuests,
    ),
  };
}

function deriveSideTotals(groups) {
  const sides = new Map();

  groups.forEach((group) => {
    if (!sides.has(group.side)) {
      sides.set(group.side, { side: group.side, going: 0, notGoing: 0, pending: 0, totalGuests: 0 });
    }

    const totals = sides.get(group.side);
    group.guests.forEach((guest) => {
      totals.totalGuests += 1;

      if (guest.status === "yes") {
        totals.going += 1;
      } else if (guest.status === "no") {
        totals.notGoing += 1;
      } else {
        totals.pending += 1;
      }
    });
  });

  return sides;
}

function parseSideTotals(rows, groups) {
  const totalsBySide = deriveSideTotals(groups);

  rows.forEach((row) => {
    const side = getSide(row);
    totalsBySide.set(side, {
      side,
      going: numberValue(row, ["total_vai", "vai", "total_que_vai", "pessoas_que_vao", "going"], 0),
      notGoing: numberValue(row, ["total_nao_vai", "nao_vai", "total_que_nao_vai", "pessoas_que_nao_vao", "not_going"], 0),
      pending: numberValue(row, ["total_pendente", "pendente", "total_pendentes", "pending"], 0),
      totalGuests: numberValue(row, ["total_convidados", "convidados", "total", "total_pessoas", "total_guests"], 0),
    });
  });

  return totalsBySide;
}

function renderGeneralSummary(totals) {
  adminElements.summaryGoing.textContent = totals.going;
  adminElements.summaryNotGoing.textContent = totals.notGoing;
  adminElements.summaryPending.textContent = totals.pending;
  adminElements.summaryTotalGuests.textContent = totals.totalGuests;
}

function sideTotalsMarkup(totals) {
  if (!totals) {
    return '<span class="side-empty">Sem convidados</span>';
  }

  return `
    <span>Vai <strong>${totals.going}</strong></span>
    <span>Não vai <strong>${totals.notGoing}</strong></span>
    <span>Pendente <strong>${totals.pending}</strong></span>
    <span>Total <strong>${totals.totalGuests}</strong></span>
  `;
}

function renderSideSummary(totalsBySide) {
  adminElements.summarySideMaynara.innerHTML = sideTotalsMarkup(totalsBySide.get("Maynara"));
  adminElements.summarySidePedro.innerHTML = sideTotalsMarkup(totalsBySide.get("Pedro"));
}

function extractGroupNames(rows) {
  return rows.map((row) => getGroupName(row)).filter(Boolean);
}

function buildTabGroups(tabRows) {
  return {
    all: extractGroupNames(tabRows.all || []),
    going: extractGroupNames(tabRows.going || []),
    notGoing: extractGroupNames(tabRows.notGoing || []),
    mixed: extractGroupNames(tabRows.mixed || []),
    pending: extractGroupNames(tabRows.pending || []),
  };
}

function buildSideLookupFromGroupViews(...viewRows) {
  const lookup = new Map();

  viewRows.flat().forEach((row) => {
    const side = getSide(row);
    if (side === "Sem lado") {
      return;
    }

    lookup.set(normalizeText(getGroupName(row)), side);
  });

  return lookup;
}

function getGroupsForActiveTab() {
  const tab = adminState.activeTab;
  const orderNames = adminState.tabGroups[tab] || [];

  if (tab === "all" && !orderNames.length) {
    return adminState.groups;
  }

  const allowed = new Set(orderNames.map((name) => normalizeText(name)));
  const order = new Map(orderNames.map((name, index) => [normalizeText(name), index]));
  const groups = adminState.groups.filter((group) => allowed.has(normalizeText(group.name)) || tab === "all");

  return groups.sort((a, b) => {
    const aOrder = order.has(normalizeText(a.name)) ? order.get(normalizeText(a.name)) : Number.MAX_SAFE_INTEGER;
    const bOrder = order.has(normalizeText(b.name)) ? order.get(normalizeText(b.name)) : Number.MAX_SAFE_INTEGER;

    return (
      sideSortValue(a.side) - sideSortValue(b.side) ||
      aOrder - bOrder ||
      a.order - b.order ||
      a.rowIndex - b.rowIndex
    );
  });
}

function renderGroups() {
  const groups = getGroupsForActiveTab();
  adminElements.list.innerHTML = "";

  if (!groups.length) {
    adminElements.status.textContent = "Nenhum grupo encontrado nesta seção.";
    return;
  }

  adminElements.status.textContent = "";

  const groupedBySide = new Map();
  groups.forEach((group) => {
    if (!groupedBySide.has(group.side)) {
      groupedBySide.set(group.side, []);
    }

    groupedBySide.get(group.side).push(group);
  });

  [...groupedBySide.entries()]
    .sort((a, b) => sideSortValue(a[0]) - sideSortValue(b[0]))
    .forEach(([side, sideGroups]) => {
      const section = document.createElement("section");
      section.className = "side-section";
      section.innerHTML = `<h2 class="side-title">${side}</h2>`;

      sideGroups.forEach((group) => {
        const card = document.createElement("article");
        card.className = "admin-card";

        const members = group.guests
          .map(
            (guest) => `
              <div class="member-line">
                <span>${guest.name}</span>
                <span class="member-status">${statusLabel(guest.status)}</span>
              </div>
            `,
          )
          .join("");

        card.innerHTML = `
          <div>
            <strong class="group-title">${group.name}</strong>
            <span class="group-meta">Última atualização: ${formatDate(group.updatedAt)}</span>
          </div>
          <div>${members}</div>
        `;

        section.append(card);
      });

      adminElements.list.append(section);
    });
}

function renderTabs() {
  adminElements.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.adminTab === adminState.activeTab);
  });
}

async function loadAdminData() {
  adminElements.status.textContent = "Carregando confirmações...";

  try {
    const [generalTotalsRows, sideTotalsRows, detailRows, allRows, goingRows, notGoingRows, mixedRows, pendingRows] =
      await Promise.all([
        readView(ADMIN_VIEWS.generalTotals),
        readView(ADMIN_VIEWS.sideTotals, ["lado"]),
        readView(ADMIN_VIEWS.detail, ["lado", "ordem", "convidado_criado_em"]),
        readView(ADMIN_VIEWS.tabs.all, ["lado", "ordem"]),
        readView(ADMIN_VIEWS.tabs.going, ["lado", "ordem"]),
        readView(ADMIN_VIEWS.tabs.notGoing, ["lado", "ordem"]),
        readView(ADMIN_VIEWS.tabs.mixed, ["lado", "ordem"]),
        readView(ADMIN_VIEWS.tabs.pending, ["lado", "ordem"]),
      ]);

    const sideLookup = buildSideLookupFromGroupViews(allRows, goingRows, notGoingRows, mixedRows, pendingRows);
    adminState.groups = organizeDetailRows(detailRows, sideLookup);
    adminState.tabGroups = buildTabGroups({
      all: allRows,
      going: goingRows,
      notGoing: notGoingRows,
      mixed: mixedRows,
      pending: pendingRows,
    });

    renderGeneralSummary(parseGeneralTotals(generalTotalsRows, adminState.groups));
    renderSideSummary(parseSideTotals(sideTotalsRows, adminState.groups));
    renderTabs();
    renderGroups();
    adminElements.updatedAt.textContent = `Atualizado em ${formatDate(new Date().toISOString())}`;
  } catch (error) {
    console.error(error);
    adminElements.status.textContent =
      "Não foi possível carregar as confirmações. Confira as views do Supabase e tente novamente.";
  }
}

function tryLogin() {
  if (adminElements.password.value === ADMIN_VISUAL_PASSWORD) {
    sessionStorage.setItem("pm-admin-unlocked", "true");
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

adminElements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    adminState.activeTab = tab.dataset.adminTab;
    renderTabs();
    renderGroups();
  });
});

adminElements.refresh.addEventListener("click", loadAdminData);
adminElements.logout.addEventListener("click", () => {
  sessionStorage.removeItem("pm-admin-unlocked");
  window.location.reload();
});

if (sessionStorage.getItem("pm-admin-unlocked") === "true") {
  showDashboard();
}
