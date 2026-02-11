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
        
        // --- עמוד כניסה ---
        if (pageId === 'login') {
            document.getElementById('login-form').onsubmit = async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                const fajax = new FXMLHttpRequest();
                fajax.open('POST', '/login');

                try {
                    console.log("מנסה להתחבר...");
                    const response = await fajax.send({ username, password });

                    if (response.status === 200) {
                        // שמירת הטוקן ב-sessionStorage כדי להשתמש בו בבקשות הבאות
                        sessionStorage.setItem('token', response.data.token);
                        sessionStorage.setItem('username', response.data.username);
                        
                        this.navigate('dashboard');
                    } else {
                        alert("שגיאה: " + response.message);
                    }
                } catch (error) {
                    // כאן נתפוס גם שגיאות רשת (השמטת הודעות) וגם שגיאות לוגיות
                    alert("תקלה: " + (error.message || "לא ניתן להתחבר לשרת"));
                }
            };
        }
        
        // --- עמוד הרשמה ---
        if (pageId === 'register') {
            document.getElementById('register-form').onsubmit = async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('reg-username').value;
                const password = document.getElementById('reg-password').value;
                const email = document.getElementById('reg-email').value;

                const fajax = new FXMLHttpRequest();
                fajax.open('POST', '/register');

                try {
                    console.log("מבצע רישום...");
                    const response = await fajax.send({ username, password, email });

                    if (response.status === 201) {
                        alert("הרישום בוצע בהצלחה! כעת ניתן להתחבר.");
                        this.navigate('login');
                    } else {
                        alert("שגיאה ברישום: " + response.message);
                    }
                } catch (error) {
                    alert("שגיאה: " + (error.message || "תקשורת נכשלה"));
                }
            };
        }

        // --- עמוד דאשבורד (ניהול אנשי קשר) ---
        if (pageId === 'dashboard') {
            // ברגע שהעמוד נטען, נרצה להביא את רשימת אנשי הקשר
            this.loadContacts();
            
            // לוגיקת כפתור התנתקות (אופציונלי)
            const logoutBtn = document.querySelector('button[onclick*="login"]');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    sessionStorage.clear(); // מחיקת הטוקן
                    this.navigate('login');
                };
            }
        }
    },

    /**
     * פונקציית עזר לטעינת אנשי קשר מהשרת
     */
    loadContacts: async function() {
        const token = sessionStorage.getItem('token');
        const fajax = new FXMLHttpRequest();
        fajax.open('GET', '/contacts');
        fajax.setRequestHeader('Authorization', token);

        try {
            const response = await fajax.send();
            if (response.status === 200) {
                this.renderContacts(response.data);
            }
        } catch (error) {
            console.error("נכשלה טעינת אנשי הקשר:", error);
        }
    },

    /**
     * פונקציית עזר להצגת אנשי הקשר בטבלה
     */
    renderContacts: function(contacts) {
        const listElement = document.getElementById('contacts-list');
        if (!listElement) return;

        listElement.innerHTML = contacts.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>
                    <button onclick="console.log('Edit ${c.id}')">ערוך</button>
                    <button onclick="console.log('Delete ${c.id}')">מחק</button>
                </td>
            </tr>
        `).join('');
    }
};

// טעינת עמוד הכניסה כברירת מחדל
window.onload = () => router.navigate('login');