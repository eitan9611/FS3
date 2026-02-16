/**
 * app.js - לוגיקת הלקוח וניהול ה-SPA
 */

const router = {
    allContacts: [],
    lastLoadRequestId: 0, // מונה בקשות לטעינת נתונים

    /**
     * ניווט בין עמודים בארכיטקטורת SPA
     */
    navigate: function(pageId, params = null) {
        const root = document.getElementById('app-root');
        const template = document.getElementById(`template-${pageId}`);
        
        if (!template) return;

        root.innerHTML = '';
        const clone = template.content.cloneNode(true);
        root.appendChild(clone);

        // אתחול אירועים לעמוד שנטען עם פרמטרים במידה ויש (כמו במקרה של עריכה)
        this.initPageEvents(pageId, params);
    },

    // בתוך אובייקט ה-router ב-app.js

    sendWithRetry: async function(method, url, data = null, token = null) {
        // פתרון 3: חסימת ממשק המשתמש
        const submitButtons = document.querySelectorAll('button[type="submit"], button[onclick*="delete"], button[onclick*="edit"]');
        submitButtons.forEach(btn => btn.disabled = true); // נעילת כפתורים

        const fajax = new FXMLHttpRequest();
        fajax.open(method, url);
        if (token) fajax.setRequestHeader('Authorization', token);

        try {
            const response = await fajax.send(data);
            return response; 
        } catch (error) {
            if (error.status === 500) {
                const retry = confirm("הבקשה נפלה בדרך לרשת, תרצה לשלוח שוב את הבקשה?");
                if (retry) {
                    return this.sendWithRetry(method, url, data, token); 
                }
            }
            throw error;
        } finally {
            // שחרור הנעילה בסיום (בין אם הצליח ובין אם נכשל)
            submitButtons.forEach(btn => btn.disabled = false);
        }
    },
    
    initPageEvents: function(pageId, params) {
        
        // --- עמוד כניסה ---
        if (pageId === 'login') {
            document.getElementById('login-form').onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                try {
                    // שימוש ב-sendWithRetry במקום fajax ישיר
                    const response = await this.sendWithRetry('POST', '/login', { username, password }); 
                    if (response.status === 200) {
                        sessionStorage.setItem('token', response.data.token);
                        sessionStorage.setItem('username', response.data.username);
                        this.navigate('dashboard');
                    } else {
                        alert("שגיאה: " + response.message);
                    }
                } catch (error) {
                    alert("תקלה: " + (error.message || "לא ניתן להתחבר לשרת"));
                }
            };
        }
        
        // --- עמוד הרשמה ---
        if (pageId === 'register') {
            document.getElementById('register-form').onsubmit = async (e) => {
                e.preventDefault();
                const userData = {
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                    email: document.getElementById('reg-email').value
                };

                try {
                    // שימוש ב-sendWithRetry
                    const response = await this.sendWithRetry('POST', '/register', userData);
                    if (response.status === 201) {
                        alert("הרישום בוצע בהצלחה!");
                        this.navigate('login');
                    }
                } catch (error) {
                    if (error.status === 409) {
                        alert("שגיאה: " + error.message);
                    } else {
                        alert("שגיאה: " + (error.message || "תקשורת נכשלה"));
                    }
                }
            };
        }

        // --- עמוד דאשבורד ---
        if (pageId === 'dashboard') {
            this.loadContacts();
            const searchInput = document.getElementById('search-contact');
            if (searchInput) {
                searchInput.oninput = (e) => this.handleSearch(e.target.value);
            }
        }

        // --- עמוד הוספה / עריכת איש קשר ---
        if (pageId === 'add-contact') {
            const form = document.getElementById('add-contact-form');
            const title = document.querySelector('.page h2');
            
            if (params) {
                title.innerText = "עריכת איש קשר";
                document.getElementById('contact-name').value = params.name;
                document.getElementById('contact-phone').value = params.phone;
            }

            form.onsubmit = async (e) => {
                e.preventDefault();
                const contactData = {
                    name: document.getElementById('contact-name').value,
                    phone: document.getElementById('contact-phone').value,
                    owner: sessionStorage.getItem('username') // הוספת שיוך למשתמש 
                };

                const method = params ? 'PUT' : 'POST';
                const url = params ? `/contacts/${params.id}` : '/contacts';
                const token = sessionStorage.getItem('token');

                try {
                    // שימוש ב-sendWithRetry לביצוע הוספה/עדכון
                    const response = await this.sendWithRetry(method, url, contactData, token);
                    if (response.status === 200 || response.status === 201) {
                        alert(params ? "עודכן בהצלחה!" : "נוסף בהצלחה!");
                        this.navigate('dashboard');
                    }
                } catch (error) {
                    alert("שגיאה בתקשורת: " + error.message);
                }
            };
        }
    },

    showAddContactModal: function() {
        this.navigate('add-contact');
    },

    logout: function() {
        sessionStorage.clear();
        this.navigate('login');
    },

    loadContacts: async function() {
        const token = sessionStorage.getItem('token');
        const username = sessionStorage.getItem('username');
        const data = { owner: username };

        // פתרון 2: שמירת מזהה הבקשה הנוכחית
        const currentId = ++this.lastLoadRequestId;

        try {
            const response = await this.sendWithRetry('GET', '/contacts', data, token);
            
            // בדיקה אם זו עדיין הבקשה הרלוונטית ביותר
            if (currentId !== this.lastLoadRequestId) {
                console.warn("התעלמות מתגובה ישנה שהגיעה באיחור");
                return;
            }

            if (response.status === 200) {
                this.allContacts = response.data;
                this.renderContacts(response.data);
            }
        } catch (error) {
            console.error("נכשלה טעינת אנשי הקשר:", error);
        }
    },

    editContact: function(id) {
        const contact = this.allContacts.find(c => c.id === id);
        if (contact) {
            this.navigate('add-contact', contact);
        }
    },

    deleteContact: async function(id) {
        if (!confirm("האם אתה בטוח שברצונך למחוק?")) return;

        const token = sessionStorage.getItem('token');

        try {
            // מחיקה עם מנגנון Retry
            const response = await this.sendWithRetry('DELETE', `/contacts/${id}`, null, token);
            if (response.status === 200) {
                alert("נמחק בהצלחה");
                this.loadContacts();
            }
        } catch (error) {
            alert("מחיקה נכשלה עקב תקלת תקשורת.");
        }
    },

    handleSearch: function(query) {
        const currentSearchId = ++this.lastLoadRequestId; // שימוש באותו מונה
        
        const filtered = this.allContacts.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
        );
        
        this.renderContacts(filtered);
    },

    renderContacts: function(contacts) {
        const listElement = document.getElementById('contacts-list');
        if (!listElement) return;

        if (contacts.length === 0) {
            listElement.innerHTML = '<tr><td colspan="3">אין אנשי קשר</td></tr>';
            return;
        }

        listElement.innerHTML = contacts.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>
                    <button onclick="router.editContact('${c.id}')">ערוך</button>
                    <button onclick="router.deleteContact('${c.id}')">מחק</button>
                </td>
            </tr>
        `).join('');
    }
};

window.onload = () => router.navigate('login');