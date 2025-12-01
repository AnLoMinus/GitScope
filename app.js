// GitScope · SparKing Profile Dashboard
// Core logic – fetch data from GitHub API & render cosmic dashboard

const usernameInput = document.getElementById("username-input");
const scanBtn = document.getElementById("scan-btn");
const alertBox = document.getElementById("alert-box");

const profileSection = document.getElementById("profile-section");
const reposSection = document.getElementById("repos-section");

// Profile elements
const avatarImg = document.getElementById("avatar-img");
const userLoginEl = document.getElementById("user-login");
const userLinkEl = document.getElementById("user-link");
const realNameEl = document.getElementById("real-name");
const profileBioEl = document.getElementById("profile-bio");
const locationLabelEl = document.getElementById("location-label");
const reposLabelEl = document.getElementById("repos-label");
const followersLabelEl = document.getElementById("followers-label");
const accountAgeLabelEl = document.getElementById("account-age-label");
const metricPublicReposEl = document.getElementById("metric-public-repos");
const metricSocialScoreEl = document.getElementById("metric-social-score");
const metricActivityScoreEl = document.getElementById("metric-activity-score");

// Languages & repos elements
const langListEl = document.getElementById("lang-list");
const langSummaryLabelEl = document.getElementById("lang-summary-label");
const reposListEl = document.getElementById("repos-list");
const reposSummaryLabelEl = document.getElementById("repos-summary-label");

// Utils
function showAlert(message, type = "info") {
  alertBox.textContent = message;
  alertBox.classList.remove("error", "info");
  alertBox.classList.add(type === "error" ? "error" : "info");
  alertBox.style.display = "block";
}

function clearAlert() {
  alertBox.style.display = "none";
  alertBox.textContent = "";
}

function formatDateToYearMonth(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

function computeYearsSince(dateString) {
  if (!dateString) return 0;
  const start = new Date(dateString);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = now.getTime() - start.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears > 0 ? diffYears : 0;
}

function computeSocialScore(followers, following) {
  const f = followers || 0;
  const g = following || 0;
  // simple heuristic: followers weighted + following impact
  return Math.round(f * 1.4 + g * 0.4);
}

function computeActivityScore(publicRepos, yearsOnGithub) {
  const repos = publicRepos || 0;
  const years = yearsOnGithub || 0;
  if (years <= 0.25) {
    return repos;
  }
  return Math.round(repos / years);
}

function classifyRepoStatus(updatedAt) {
  if (!updatedAt) return "ARCHIVE";
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 60) return "ACTIVE";
  if (diffDays <= 365) return "STABLE";
  return "ARCHIVE";
}

function humanizeRepoStatus(status) {
  switch (status) {
    case "ACTIVE":
      return "🟢 ACTIVE";
    case "STABLE":
      return "🟡 STABLE";
    default:
      return "⚫ ARCHIVE";
  }
}

function shortNumber(n) {
  if (n == null) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function sortReposByScore(repos) {
  // score based on stars, forks, recent update
  const now = Date.now();
  return [...repos].sort((a, b) => {
    const starsA = a.stargazers_count || 0;
    const starsB = b.stargazers_count || 0;
    const forksA = a.forks_count || 0;
    const forksB = b.forks_count || 0;

    const updatedA = new Date(a.updated_at || a.pushed_at || a.created_at || 0).getTime();
    const updatedB = new Date(b.updated_at || b.pushed_at || b.created_at || 0).getTime();

    const recencyA = (now - updatedA) || Number.MAX_SAFE_INTEGER;
    const recencyB = (now - updatedB) || Number.MAX_SAFE_INTEGER;

    // lower recency = more recent
    const scoreA = starsA * 3 + forksA * 2 - recencyA / (1000 * 60 * 60 * 24 * 30);
    const scoreB = starsB * 3 + forksB * 2 - recencyB / (1000 * 60 * 60 * 24 * 30);

    return scoreB - scoreA;
  });
}

function buildLanguagesMap(repos) {
  const map = new Map();
  repos.forEach((repo) => {
    const lang = repo.language;
    if (!lang) return;
    const currentCount = map.get(lang) || 0;
    map.set(lang, currentCount + 1);
  });
  return map;
}

function renderLanguages(map) {
  langListEl.innerHTML = "";

  const entries = Array.from(map.entries());
  if (entries.length === 0) {
    langSummaryLabelEl.textContent = "No languages detected yet.";
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "אין עדיין נתוני שפות – כנראה שהמאגרים בלי שפה ראשית מוגדרת.";
    langListEl.appendChild(p);
    return;
  }

  const total = entries.reduce((acc, [, count]) => acc + count, 0);
  // sort descending
  entries.sort((a, b) => b[1] - a[1]);

  entries.forEach(([lang, count], index) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "lang-row";

    const label = document.createElement("div");
    label.className = "lang-label";
    label.textContent = lang;

    const barShell = document.createElement("div");
    barShell.className = "lang-bar-shell";

    const barFill = document.createElement("div");
    barFill.className = "lang-bar-fill";
    // small timeout to allow CSS transition
    requestAnimationFrame(() => {
      barFill.style.width = pct + "%";
    });

    barShell.appendChild(barFill);

    const countEl = document.createElement("div");
    countEl.className = "lang-count";
    countEl.textContent = pct + "%";

    row.appendChild(label);
    row.appendChild(barShell);
    row.appendChild(countEl);

    langListEl.appendChild(row);

    // highlight top 3
    if (index === 0) {
      row.style.filter = "brightness(1.14)";
    } else if (index === 1) {
      row.style.filter = "brightness(1.07)";
    }
  });

  const topLangs = entries
    .slice(0, 3)
    .map(([lang]) => lang)
    .join(" · ");
  langSummaryLabelEl.textContent = `Top stack: ${topLangs}`;
}

function renderRepos(repos) {
  reposListEl.innerHTML = "";

  if (!repos || repos.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent =
      "לא נמצאו מאגרים ציבוריים להצגה. ייתכן שהמשתמש עבד רק על מאגרים פרטיים או שזה פרופיל חדש.";
    reposListEl.appendChild(p);
    reposSummaryLabelEl.textContent = "(0 repos)";
    return;
  }

  const sorted = sortReposByScore(repos);
  const top = sorted.slice(0, 15); // show up to 15

  reposSummaryLabelEl.textContent = `(${repos.length} public repos · showing top ${top.length})`;

  top.forEach((repo) => {
    const card = document.createElement("article");
    card.className = "repo-card";

    const titleRow = document.createElement("div");
    titleRow.className = "repo-title-row";

    const link = document.createElement("a");
    link.href = repo.html_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = repo.name;

    const status = classifyRepoStatus(repo.updated_at || repo.pushed_at);
    const badge = document.createElement("div");
    badge.className = "repo-badge";
    badge.textContent = humanizeRepoStatus(status);

    titleRow.appendChild(link);
    titleRow.appendChild(badge);

    const desc = document.createElement("p");
    desc.className = "repo-desc";
    desc.textContent = repo.description || "No description provided.";

    const metaRow = document.createElement("div");
    metaRow.className = "repo-meta-row";

    const langItem = document.createElement("div");
    langItem.className = "repo-meta-item";
    langItem.innerHTML = `<span class="icon">🧠</span><span>${repo.language || "No-lang"}</span>`;

    const starsItem = document.createElement("div");
    starsItem.className = "repo-meta-item";
    starsItem.innerHTML = `<span class="icon">⭐</span><span>${shortNumber(
      repo.stargazers_count || 0
    )}</span>`;

    const forksItem = document.createElement("div");
    forksItem.className = "repo-meta-item";
    forksItem.innerHTML = `<span class="icon">🍴</span><span>${shortNumber(
      repo.forks_count || 0
    )}</span>`;

    const updatedItem = document.createElement("div");
    updatedItem.className = "repo-meta-item";
    updatedItem.innerHTML = `<span class="icon">⏱</span><span>${formatDateToYearMonth(
      repo.updated_at || repo.pushed_at || repo.created_at
    )}</span>`;

    metaRow.appendChild(langItem);
    metaRow.appendChild(starsItem);
    metaRow.appendChild(forksItem);
    metaRow.appendChild(updatedItem);

    card.appendChild(titleRow);
    card.appendChild(desc);
    card.appendChild(metaRow);

    reposListEl.appendChild(card);
  });
}

async function fetchUser(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`User error: ${res.status}`);
  }
  return res.json();
}

async function fetchRepos(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(
    username
  )}/repos?per_page=100&sort=updated`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Repos error: ${res.status}`);
  }
  return res.json();
}

async function runScan() {
  clearAlert();
  const username = (usernameInput.value || "").trim();
  if (!username) {
    showAlert("נא להקליד שם משתמש של GitHub לפני סריקה.", "error");
    return;
  }

  // basic UX feedback
  scanBtn.disabled = true;
  scanBtn.style.opacity = "0.7";
  scanBtn.querySelector("span.icon").textContent = "⏳";

  try {
    showAlert("סורק את הנתונים מה-GitHub API…", "info");

    const [userData, repos] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
    ]);

    // Render profile
    avatarImg.src = userData.avatar_url || "";
    userLoginEl.textContent = "@" + (userData.login || username);
    userLinkEl.href = userData.html_url || "#";

    const displayName = userData.name || userData.login || username;
    realNameEl.textContent = displayName;

    profileBioEl.textContent =
      userData.bio || "No bio provided yet. This profile is still a mystery…";

    locationLabelEl.textContent = `Location: ${
      userData.location || "Unknown"
    }`;

    const publicRepos = userData.public_repos || 0;
    reposLabelEl.textContent = `Public Repos: ${publicRepos}`;

    const followers = userData.followers || 0;
    const following = userData.following || 0;
    followersLabelEl.textContent = `Followers / Following: ${followers} / ${following}`;

    const yearsOnGithub = computeYearsSince(userData.created_at);
    const yearsLabel =
      yearsOnGithub <= 0.2
        ? "New to GitHub"
        : `${yearsOnGithub.toFixed(1)} years on GitHub`;
    accountAgeLabelEl.textContent = `Member since · ${formatDateToYearMonth(
      userData.created_at
    )} · ${yearsLabel}`;

    metricPublicReposEl.textContent = publicRepos;
    metricSocialScoreEl.textContent = computeSocialScore(
      followers,
      following
    );
    metricActivityScoreEl.textContent = computeActivityScore(
      publicRepos,
      yearsOnGithub
    );

    // Languages
    const langMap = buildLanguagesMap(repos || []);
    renderLanguages(langMap);

    // Repos
    renderRepos(repos || []);

    profileSection.classList.remove("hidden");
    reposSection.classList.remove("hidden");

    showAlert(
      `🎉 Scan complete for "${displayName}" – נתוני פרופיל נטענו בהצלחה.`,
      "info"
    );
  } catch (err) {
    console.error(err);
    let message =
      "לא הצלחנו לטעון את הנתונים כרגע. בדוק את השם או נסה שוב מאוחר יותר.";
    if (String(err.message || "").includes("User error: 404")) {
      message = "לא נמצא משתמש עם השם הזה ב-GitHub. נסה שם אחר.";
    } else if (String(err.message || "").includes("403")) {
      message =
        "נראה שהגענו למגבלת הקריאות של GitHub API (rate limit). המתן כמה דקות ונסה שוב.";
    }
    showAlert(message, "error");
    profileSection.classList.add("hidden");
    reposSection.classList.add("hidden");
  } finally {
    scanBtn.disabled = false;
    scanBtn.style.opacity = "1";
    scanBtn.querySelector("span.icon").textContent = "⚡";
  }
}

// Events
scanBtn.addEventListener("click", runScan);

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runScan();
  }
});

// Optionally: auto-fill with a default username for first-time demo
window.addEventListener("load", () => {
  // Example: prefill with your username for quick demo
  // usernameInput.value = "AnLoMinus";
  // runScan();
});
