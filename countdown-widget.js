// Scriptable — Countdown Text Only (Auto Font + Ellipsis + Lang)
// Widget parameter: "Title|YYYY-MM-DD|lang"
// lang: en (default) or ru

//////////////// CONFIG ////////////////
const DEFAULT_EVENT_TITLE = "Vacation";
const DEFAULT_EVENT_DATE = "2025-12-31";
const DEFAULT_LANG = "en"; // default language

const COLOR_BG = Color.dynamic(new Color("#ffffff"), new Color("#0f1115"));
const COLOR_TEXT = Color.dynamic(new Color("#0b0b0d"), new Color("#f2f2f5"));
const COLOR_TEXT_MUTE = Color.dynamic(
  new Color("#6b7280"),
  new Color("#a1a1aa")
);

// Title/date max lengths for ellipsis
const TITLE_MAX = { small: 14, medium: 20, large: 26, extraLarge: 34 };
const DATE_MAX = { small: 22, medium: 30, large: 38, extraLarge: 48 };
const ELLIPSIZE_DATE = false;

/////////////// INPUT /////////////////
let eventTitle = DEFAULT_EVENT_TITLE;
let targetDateStr = DEFAULT_EVENT_DATE;
let lang = DEFAULT_LANG;

if (args.widgetParameter && typeof args.widgetParameter === "string") {
  const parts = args.widgetParameter.split("|").map((s) => s.trim());
  if (parts[0]) eventTitle = parts[0];
  if (parts[1]) targetDateStr = parts[1];
  if (parts[2]) lang = parts[2].toLowerCase();
}

/////////////// DATE MATH /////////////////
function parseYMD(str) {
  const [y, m, d] = str.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y);
  dt.setMonth((m || 1) - 1);
  dt.setDate(d || 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const target = parseYMD(targetDateStr);
const MS_DAY = 86400000;
const daysLeftRaw = Math.ceil((target - today) / MS_DAY);

/////////////// LOCALIZATION /////////////////
const locales = {
  en: {
    daysLeft: "days left",
    today: "Today!",
    passed: "Event passed",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  ru: {
    daysLeft: "дней осталось",
    today: "Сегодня!",
    passed: "Событие прошло",
    months: [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ],
    weekdays: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  },
};

const loc = locales[lang] || locales.en;

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const month = loc.months[d.getMonth()];
  const yyyy = d.getFullYear();
  const wd = loc.weekdays[d.getDay()];
  return `${dd} ${month} ${yyyy} (${wd})`;
}

/////////////// UI HELPERS /////////////////
function family() {
  return config.runsInWidget ? config.widgetFamily || "medium" : "medium";
}
function maxTitle() {
  return TITLE_MAX[family()] ?? TITLE_MAX.medium;
}
function maxDate() {
  return DATE_MAX[family()] ?? DATE_MAX.medium;
}

function ellipsize(text, maxChars) {
  if (!text) return "";
  const t = String(text);
  if (t.length <= maxChars) return t;
  if (maxChars <= 1) return "…";
  return t.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}

function getHeadlineFontSize(text) {
  if (!isNaN(Number(text))) {
    const len = text.length;
    if (len <= 3) return 44;
    if (len === 4) return 38;
    return 32;
  }
  return 26;
}

/////////////// BUILD WIDGET /////////////////
async function buildWidget() {
  const w = new ListWidget();
  w.setPadding(12, 12, 12, 12);
  w.backgroundColor = COLOR_BG;

  const title = w.addText(ellipsize(eventTitle, maxTitle()));
  title.font = Font.semiboldSystemFont(16);
  title.textColor = COLOR_TEXT;

  if (daysLeftRaw > 0) {
    const sub = w.addText(loc.daysLeft);
    sub.font = Font.mediumSystemFont(12);
    sub.textColor = COLOR_TEXT_MUTE;
    w.addSpacer(4);
  } else {
    w.addSpacer(2);
  }

  let headline;
  if (daysLeftRaw > 0) {
    headline = `${daysLeftRaw}`;
  } else if (daysLeftRaw === 0) {
    headline = loc.today;
  } else {
    headline = loc.passed;
  }
  const h = w.addText(headline);
  h.font = Font.boldSystemFont(getHeadlineFontSize(headline));
  h.textColor = COLOR_TEXT;

  w.addSpacer(4);

  const dateText = formatDate(target);
  const dateLine = w.addText(
    ELLIPSIZE_DATE ? ellipsize(dateText, maxDate()) : dateText
  );
  dateLine.font = Font.mediumSystemFont(12);
  dateLine.textColor = COLOR_TEXT_MUTE;

  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  await widget.presentMedium();
  Script.complete();
}
