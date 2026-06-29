const dayTabs = Array.from(document.querySelectorAll(".day-tab"));
const dayPanels = Array.from(document.querySelectorAll(".day-panel"));
const toggleActiveDayButton = document.querySelector("#toggleActiveDay");

const focusTitle = document.querySelector("#focusTitle");
const focusCopy = document.querySelector("#focusCopy");
const focusHighlight = document.querySelector("#focusHighlight");
const focusDrive = document.querySelector("#focusDrive");

const checklistInputs = Array.from(document.querySelectorAll("[data-checklist-item]"));
const checklistProgress = document.querySelector("#checklistProgress");
const checklistActionButtons = Array.from(document.querySelectorAll("[data-checklist-action]"));

const bottomNavLinks = Array.from(document.querySelectorAll(".bottom-nav a"));
const observedSections = Array.from(document.querySelectorAll("#hero, #summary, #days, #checklist"));

const checklistStorageKey = "bangkok-chill-trip-checklist-v1";

function getActivePanel() {
  return document.querySelector(".day-panel.is-active");
}

function updateFocusCard(panel) {
  if (!panel) {
    return;
  }

  focusTitle.textContent = panel.dataset.focusTitle || "";
  focusCopy.textContent = panel.dataset.focusCopy || "";
  focusHighlight.textContent = panel.dataset.focusHighlight || "";
  focusDrive.textContent = panel.dataset.focusDrive || "";
}

function updateCollapseButton(panel) {
  if (!panel || !toggleActiveDayButton) {
    return;
  }

  const isCollapsed = panel.classList.contains("is-collapsed");
  toggleActiveDayButton.textContent = isCollapsed ? "展開今日行程" : "收合今日行程";
  toggleActiveDayButton.setAttribute("aria-expanded", String(!isCollapsed));
  toggleActiveDayButton.setAttribute("aria-controls", panel.id);
}

function activateDay(dayId) {
  const nextPanel = document.getElementById(dayId);

  if (!nextPanel) {
    return;
  }

  dayTabs.forEach((tab) => {
    const isActive = tab.dataset.tabTarget === dayId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  dayPanels.forEach((panel) => {
    const isActive = panel.id === dayId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  updateFocusCard(nextPanel);
  updateCollapseButton(nextPanel);
}

function saveChecklistState() {
  const state = checklistInputs.reduce((result, input) => {
    result[input.dataset.checklistItem] = input.checked;
    return result;
  }, {});

  try {
    localStorage.setItem(checklistStorageKey, JSON.stringify(state));
  } catch (error) {
    return;
  }
}

function updateChecklistProgress() {
  const checkedCount = checklistInputs.filter((input) => input.checked).length;
  checklistProgress.textContent = `${checkedCount} / ${checklistInputs.length} 已準備`;
}

function loadChecklistState() {
  try {
    const saved = localStorage.getItem(checklistStorageKey);

    if (!saved) {
      updateChecklistProgress();
      return;
    }

    const parsed = JSON.parse(saved);

    checklistInputs.forEach((input) => {
      input.checked = Boolean(parsed[input.dataset.checklistItem]);
    });
  } catch (error) {
    localStorage.removeItem(checklistStorageKey);
  }

  updateChecklistProgress();
}

function setChecklistState(checked) {
  checklistInputs.forEach((input) => {
    input.checked = checked;
  });

  saveChecklistState();
  updateChecklistProgress();
}

function updateBottomNav(sectionId) {
  bottomNavLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);
  });
}

dayTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activateDay(tab.dataset.tabTarget);
  });

  tab.addEventListener("keydown", (event) => {
    const currentIndex = dayTabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % dayTabs.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + dayTabs.length) % dayTabs.length;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      dayTabs[nextIndex].focus();
      activateDay(dayTabs[nextIndex].dataset.tabTarget);
    }
  });
});

if (toggleActiveDayButton) {
  toggleActiveDayButton.addEventListener("click", () => {
    const activePanel = getActivePanel();

    if (!activePanel) {
      return;
    }

    activePanel.classList.toggle("is-collapsed");
    updateCollapseButton(activePanel);
  });
}

checklistInputs.forEach((input) => {
  input.addEventListener("change", () => {
    saveChecklistState();
    updateChecklistProgress();
  });
});

checklistActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.checklistAction;

    if (action === "check-all") {
      setChecklistState(true);
    }

    if (action === "clear-all") {
      setChecklistState(false);
    }
  });
});

bottomNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href").replace("#", "");
    updateBottomNav(targetId);
  });
});

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateBottomNav(entry.target.id);
        }
      });
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: 0
    }
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}

activateDay("day-1");
loadChecklistState();
updateBottomNav("hero");
