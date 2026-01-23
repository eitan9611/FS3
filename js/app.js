// app.js - לוגיקת הלקוח וה-SPA

const router = {
    // פונקציית הניתוב
    navigate: function(pageId) {
        const root = document.getElementById('app-root');
        const template = document.getElementById(`template-${pageId}`);
        
        if (!template) {
            console.error(`Page ${pageId} not found`);
            return;
        }

        // ניקוי העמוד הנוכחי
        root.innerHTML = '';

        // שכפול התבנית והזרקתה
        const clone = template.content.cloneNode(true);
        root.appendChild(clone);

        // אתחול אירועים ספציפיים לעמוד שנטען
        this.initPageEvents(pageId);
    },

    initPageEvents: function(pageId) {
        if (pageId === 'login') {
            document.getElementById('login-form').onsubmit = (e) => {
                e.preventDefault();
                console.log("נסיון התחברות... כאן תבוא פניית ה-FAJAX");
                // אם ההתחברות הצליחה בשרת:
                this.navigate('dashboard');
            };
        }
        
        if (pageId === 'register') {
            document.getElementById('register-form').onsubmit = (e) => {
                e.preventDefault();
                console.log("נסיון רישום...");
            };
        }
    }
};

// טעינת עמוד הכניסה כברירת מחדל
window.onload = () => router.navigate('login');