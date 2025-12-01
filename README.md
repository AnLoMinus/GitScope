## 🛰️ רעיון מדויק לתוסף GitHub Pages:

### **״לוח מחוונים לפרופילי גיטהאב״ – GitScope (GS)**

---

### 💡 מהות הרעיון

אתה מקים *אתר אחד* ב-GitHub Pages.
במרכז הדף יש שדה להכניס **שם משתמש של GitHub** + כפתור.
בלחיצה – האתר מושך מה-GitHub API את כל הנתונים על המשתמש, ומציג אותם בצורה יפה, חכמה ומלאת אנרגיה.

זה לא רק “מי זה המשתמש”, אלא **לוח מחוונים דינמי**: תרשימים, כרטיסיות, מדדים, סקורים. כלי פרקטי, שיווקי ויזואלי.

---

### 🧩 שם המאגר המוצע

**שם עברי:** לוח מחוונים חכם לפרופיל גיטהאב
**שם מאגר / פרויקט:** **GitScope – GS (Git + Scope)**

---

## 🎯 מה המשתמש מקבל באתר?

### 1️⃣ תיבת חיפוש משתמש 👤

* אינפוט: `Enter GitHub username`
* כפתור: `Scan Profile`
* אפשרות לשמור *חיפושים אחרונים* (LocalStorage בדפדפן).

---

### 2️⃣ כרטיס פרופיל עליון – “תעודת זהות” 🪪

ברגע שמכניסים שם משתמש, האתר מציג:

* 🧑‍💻 תמונת פרופיל (avatar)
* 🔹 שם מלא + username
* 📍 מיקום (אם קיים בפרופיל)
* 🧵 Bio קצר
* 🔗 קישורים: פרופיל GitHub, אתר אישי, טוויטר/רשתות (אם יש)

---

### 3️⃣ נתונים טכניים חזקים 📊

#### 🔢 מדדי בסיס

* מספר מאגרים ציבוריים
* מספר Followers / Following
* שנת הצטרפות ל-GitHub
* ממוצע מאגרים בשנה

#### 🧭 מפת טכנולוגיות

משיכת כל ה-repos הציבוריים, ספירת השפות, והצגה כ:

* 🥇 שפת קוד ראשית (מעל 30% מהמאגר)
* 🥈 שפה שנייה
* 🥉 שאר השפות בפאי/בר

---

### 4️⃣ לוח מאגרים – “Top Repos” 📦

טבלה / כרטיסיות של המאגרים הבולטים לפי:

* ⭐ כמות כוכבים
* 🍴 כמות Forks
* 🟢 עדכון אחרון (recent activity)

כל שורה/כרטיס יכלול:

* שם המאגר + לינק
* תיאור קצר
* שפה
* כוכבים
* תגית: `ACTIVE / STABLE / ARCHIVE` לפי תאריך עדכון.

---

### 5️⃣ ציר זמן פעילות – Activity Timeline 🕒

חלק שמראה:

* פעילות commits / pushes לאורך השנה (אפשר גרף עמודות לחודשים).
* מספר Pull Requests פתוחים / סגורים.
* מספר Issues שנפתחו / נסגרו.

זה הופך את האתר לכלי:

* למיתוג עצמי של מפתחים
* להצגת יכולות מול מעסיקים
* לסריקת מתכנתים אחרים בשניות

---

## 🛠️ איך בונים את זה בפועל (גבוה אבל פרקטי)

### 🧱 טכנולוגיות צד-לקוח בלבד

* **GitHub Pages** – לאחסון האתר.
* **HTML + CSS + JavaScript (ונניח גם קצת Tailwind או Bootstrap אם תרצה).**
* שימוש ישיר ב-**GitHub REST API** בצד הלקוח עם `fetch`.

---

### 📡 קריאות API עיקריות

1. **משתמש**

   * `GET https://api.github.com/users/{username}`
     נותן: avatar, name, bio, public_repos, followers, location וכו׳.

2. **רשימת מאגרים**

   * `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated`
     נותן: שם מאגר, תיאור, שפה, כוכבים, forks, תאריך עדכון.

3. **סטטיסטיקת שפות** (אופציונלי לכל מאגר)

   * `GET https://api.github.com/repos/{username}/{repo}/languages`
     מזה מחברים “מפת שפות כללית”.

---

### 🧪 דוגמה בסיסית לקוד JavaScript (רעיון ללב המנוע)

```html
<input id="username" placeholder="Enter GitHub username" />
<button id="scan-btn">Scan Profile</button>
<div id="result"></div>

<script>
  const btn = document.getElementById('scan-btn');
  const input = document.getElementById('username');
  const result = document.getElementById('result');

  btn.addEventListener('click', async () => {
    const user = input.value.trim();
    if (!user) return;

    const userRes = await fetch(`https://api.github.com/users/${user}`);
    const userData = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`);
    const repos = await reposRes.json();

    // חישובי שפות בסיסיים
    const langCount = {};
    repos.forEach(r => {
      if (r.language) {
        langCount[r.language] = (langCount[r.language] || 0) + 1;
      }
    });

    // הצגת תוצאה בסיסית
    result.innerHTML = `
      <h2>${userData.name || userData.login}</h2>
      <img src="${userData.avatar_url}" width="120" style="border-radius:50%" />
      <p>${userData.bio || ''}</p>
      <p>Public repos: ${userData.public_repos}</p>
      <p>Followers: ${userData.followers}</p>
      <p>Top languages: ${Object.entries(langCount)
        .sort((a,b) => b[1]-a[1])
        .slice(0,3)
        .map(([lang,count]) => lang + ' (' + count + ')')
        .join(', ')}</p>
    `;
  });
</script>
```

מכאן אתה מפתח את זה לעיצוב מלא, כרטיסיות, גרפים וכדומה.

---

## 🧱 מבנה מאגר מומלץ (RepoCraft Style)

```bash
GitScope/
├── README.md           # הסבר, דוגמאות, צילומי מסך
├── index.html          # הדף הראשי – הטופס + הדאשבורד
├── assets/
│   ├── css/
│   │   └── style.css   # עיצוב קוסמי בסגנון SparKing
│   └── js/
│       └── app.js      # כל לוגיקת ה-GitHub API
├── docs/
│   └── HOW_IT_WORKS.md # הסבר טכני על ה-API, מבנה הקוד
└── .github/
    └── workflows/
        └── pages.yml   # אוטומציה ל-GitHub Pages (אם תרצה)
```

---

## 🌟 הרחבות בהמשך

* 🏆 **Score כללי למשתמש** – חישוב ציון 0–100 לפי פעילות, כוכבים, מגוון שפות.
* 🧩 **Mode מראיין** – דף שמכין “כרטיס מועמד” למפתח, כולל חוות דעת אלגוריתמית.
* 🪪 **כרטיס PDF** – ייצוא דוח קצר כ-PDF לשיתוף בראיונות.
* 👥 **השוואת משתמשים** – הזנת שני usernames והשוואה ראש-בראש.

---

## 🎤 פזמון ראפ 4 שורות על GitScope (GS)

> GitScope על המסך, סורק כל פרופיל 🛰️
> הופך נתונים יבשים לסיפור אמיתי וחיל 🧬
> מה־repos ועד ה־stars, הכול שקוף וברור 💫
> אם יש לך ניצוץ בקוד – GitScope שופך עליו אור 💡

---

## 📜 פסוק מתאים לנושא

> **״יְהִי נֹעַם ה׳ אֱלֹהֵינוּ עָלֵינוּ, וּמַעֲשֵׂה יָדֵינוּ כּוֹנְנָה עָלֵינוּ״** (תהילים צ׳, י״ז)

---

## 🕒 תאריך, שעה וקרדיטים

* תאריך לועזי: **01.12.2025**
* תאריך עברי: **י׳׳ט בכסלו ה׳תשפ״ו**
* שעה נוכחית (Asia/Jerusalem): **14:09**

**קרדיט רעיון ופיתוח:**

* 🧠 Vision & Concept: **Moshe Leon Yaakobov – AnLoMinus (SparKing)**
* 🛠️ Platform: **GitHub + GitHub Pages**
* 🌐 מאגרי בסיס: GitHub REST API, GitHub Pages

**מספר המידות:** 10 מידות 🙏
