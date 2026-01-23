/**
 * app.js - לוגיקת הלקוח וניהול ה-SPA
 */

const router = {
    // מזהה הטיימר הנוכחי למניעת כפילויות במקרה של ניסיונות חוזרים
    activeTimeout: null,

    /**
     * ניווט בין עמודים בארכיטקטורת SPA
     */
    navigate: function(pageId) {
        const root = document.getElementById('app-root');
        const template = document.getElementById(`template-${pageId}`);
        
        if (!template) return;

        // ניקוי העמוד והזרקת התבנית החדשה
        root.innerHTML = '';
        const clone = template.content.cloneNode(true);
        root.appendChild(clone);

        // אתחול אירועים לעמוד שנטען
        this.initPageEvents(pageId);
    },

    /**
     * פונקציית עזר לביצוע פניות FAJAX עם מנגנון הגנה מפני אובדן הודעות
     */
    sendRequest: function(method, url, data, callback) {
        const xhr = new FXMLHttpRequest();
        let isHandled = false;

        // הצגת אינדיקציה למשתמש שהפנייה בטיפול
        console.log(`Requesting ${url}...`);

        // הגדרת טיימר ל-5 שניות לטיפול בהשמטת הודעות עקב מגבלות הרשת
        const timeoutTimer = setTimeout(() => {
            if (!isHandled) {
                isHandled = true;
                alert("השרת אינו מגיב (אובדן חבילה ברשת). אנא נסה שנית.");
                // ניתן להוסיף כאן לוגיקה של ניסיון חוזר אוטומטי
            }
        }, 5000);

        xhr.open(method, url);
        
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && !isHandled) {
                isHandled = true;
                clearTimeout(timeoutTimer); // ביטול הטיימר כי התקבלה תגובה
                
                const response = JSON.parse(xhr.responseText);
                callback(response);
            }
        };

        xhr.send(data);
    },

    /**
     * אתחול מאזינים לאירועים לפי סוג העמוד
     */
    initPageEvents: function(pageId) {
        if (pageId === 'login') {
            document.getElementById('login-form').onsubmit = (e) => {
                e.preventDefault();
                const credentials = {
                    username: document.getElementById('login-username').value,
                    password: document.getElementById('login-password').value
                };
                
                this.sendRequest('POST', '/login', credentials, (res) => {
                    if (res.status === 200) {
                        localStorage.setItem('user_token', res.data.token);
                        this.navigate('dashboard');
                    } else {
                        alert(res.message);
                    }
                });
            };
        }

        if (pageId === 'register') {
            document.getElementById('register-form').onsubmit = (e) => {
                e.preventDefault();
                const newUser = {
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                    email: document.getElementById('reg-email').value
                };

                this.sendRequest('POST', '/register', newUser, (res) => {
                    alert(res.message);
                    if (res.status === 201) this.navigate('login');
                });
            };
        }

        if (pageId === 'dashboard') {
            this.loadContacts();
        }
    },

    /**
     * שליפת כל אנשי הקשר מהשרת (פעולת GET)
     */
    loadContacts: function() {
        this.sendRequest('GET', '/contacts', null, (res) => {
            if (res.status === 200) {
                this.renderContacts(res.data);
            }
        });
    },

    /**
     * רינדור רשימת אנשי הקשר לטבלה
     */
    renderContacts: function(contacts) {
        const listBody = document.getElementById('contacts-list');
        if (!listBody) return;

        listBody.innerHTML = contacts.map(contact => `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.phone}</td>
                <td>
                    <button onclick="router.deleteContact('${contact.id}')">מחק</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * מחיקת איש קשר (פעולת DELETE)
     */
    deleteContact: function(id) {
        if (confirm("האם למחוק איש קשר זה?")) {
            this.sendRequest('DELETE', `/contacts/${id}`, null, (res) => {
                if (res.status === 200) {
                    this.loadContacts(); // ריענון הרשימה
                }
            });
        }
    },
    // הוסף זאת בתוך אובייקט ה-router ב-app.js
    showAddContactModal: function() {
        const name = prompt("הכנס שם איש קשר:");
        const phone = prompt("הכנס מספר טלפון:");
        
        if (name && phone) {
            this.sendRequest('POST', '/contacts', { name, phone }, (res) => {
                if (res.status === 201) {
                    alert("איש קשר נוסף בהצלחה!");
                    this.loadContacts(); // ריענון הרשימה
                }
            });
        }
    }
    
};

// טעינת עמוד הכניסה עם פתיחת האפליקציה
window.onload = () => router.navigate('login');