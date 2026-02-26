/**
 * app.js - לוגיקת הלקוח וניהול ה-SPA מבוסס Callbacks
 */


const router = {
    allContacts: [],
    lastLoadRequestId: 0, 

    navigate: function(pageId, params = null) {
        const root = document.getElementById('app-root');
        const template = document.getElementById(`template-${pageId}`);
        
        if (!template) return;

        root.innerHTML = '';
        const clone = template.content.cloneNode(true);
        root.appendChild(clone);

        this.initPageEvents(pageId, params);
    },

    // פונקציית עזר לתקשורת המבוססת על Callbacks ואירועים
    sendWithRetry: function(method, url, data = null, token = null, callback) {
        const submitButtons = document.querySelectorAll('button[type="submit"], button[onclick*="delete"], button[onclick*="edit"]');
        submitButtons.forEach(btn => btn.disabled = true); // נעילת כפתורים

        const fajax = new FXMLHttpRequest();
        fajax.open(method, url);
        if (token) fajax.setRequestHeader('Authorization', token);

        // הגדרת מה יקרה כשהבקשה מצליחה לחזור (גם אם חזרה עם סטטוס שגיאה מהשרת)
        fajax.onload = () => {
            submitButtons.forEach(btn => btn.disabled = false);
            const response = JSON.parse(fajax.responseText);
            callback(null, response);
        };

        // הגדרת מה יקרה אם הבקשה נופלת ברשת
        fajax.onerror = () => {
            submitButtons.forEach(btn => btn.disabled = false);
            const errorResponse = JSON.parse(fajax.responseText);
            
            if (fajax.status === 500) {
                const retry = confirm("הבקשה נפלה בדרך לרשת, תרצה לשלוח שוב את הבקשה?");
                if (retry) {
                    // קריאה רקורסיבית - מנסים שוב עם אותו ה-callback
                    this.sendWithRetry(method, url, data, token, callback);
                } else {
                    callback(errorResponse, null);
                }
            } else {
                callback(errorResponse, null);
            }
        };

        fajax.send(data);
    },
    
    initPageEvents: function(pageId, params) {
        
        // --- עמוד כניסה ---
        if (pageId === 'login') {
            document.getElementById('login-form').onsubmit = (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                this.sendWithRetry('POST', '/login', { username, password }, null, (error, response) => {
                    if (error) {
                        alert("תקלה: " + (error.message || "לא ניתן להתחבר לשרת"));
                        return;
                    }
                    if (response.status === 200) {
                        sessionStorage.setItem('token', response.data.token);
                        sessionStorage.setItem('username', response.data.username);
                        this.navigate('dashboard');
                    } else {
                        alert("שגיאה: " + response.message);
                    }
                });
            };
        }
        
        // --- עמוד הרשמה ---
        // --- עמוד הרשמה ---
        if (pageId === 'register') {
            document.getElementById('register-form').onsubmit = (e) => {
                e.preventDefault();
                const userData = {
                    username: document.getElementById('reg-username').value,
                    password: document.getElementById('reg-password').value,
                    email: document.getElementById('reg-email').value
                };

                this.sendWithRetry('POST', '/register', userData, null, (error, response) => {
                    // שגיאת רשת (למשל, ההודעה אבדה בדרך)
                    if (error) {
                        alert("שגיאת רשת: " + (error.message || "תקשורת נכשלה"));
                        return;
                    }
                    
                    // התקבלה תגובה מסודרת מהשרת - בודקים את הסטטוס
                    if (response.status === 201) {
                        alert("הרישום בוצע בהצלחה!");
                        this.navigate('login');
                    } else if (response.status === 409) {
                        // כאן אנחנו תופסים את המקרה שהשם או האימייל כבר קיימים!
                        alert(response.message); // יקפיץ את ההודעה המדויקת מהשרת
                    } else {
                        // שגיאות כלליות אחרות מהשרת (למשל חסרים שדות)
                        alert("שגיאה: " + response.message);
                    }
                });
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

            form.onsubmit = (e) => {
                e.preventDefault();
                const contactData = {
                    name: document.getElementById('contact-name').value,
                    phone: document.getElementById('contact-phone').value,
                    owner: sessionStorage.getItem('username') 
                };

                const method = params ? 'PUT' : 'POST';
                const url = params ? `/contacts/${params.id}` : '/contacts';
                const token = sessionStorage.getItem('token');

                this.sendWithRetry(method, url, contactData, token, (error, response) => {
                    if (error) {
                        alert("שגיאה בתקשורת: " + error.message);
                        return;
                    }
                    if (response.status === 200 || response.status === 201) {
                        alert(params ? "עודכן בהצלחה!" : "נוסף בהצלחה!");
                        this.navigate('dashboard');
                    }
                });
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

    loadContacts: function() {
        const token = sessionStorage.getItem('token');
        const username = sessionStorage.getItem('username');
        const data = { owner: username };

        const currentId = ++this.lastLoadRequestId;

        this.sendWithRetry('GET', '/contacts', data, token, (error, response) => {
            // התעלמות מתגובה ישנה שהגיעה באיחור
            if (currentId !== this.lastLoadRequestId) {
                console.warn("התעלמות מתגובה ישנה שהגיעה באיחור");
                return;
            }

            if (error) {
                console.error("נכשלה טעינת אנשי הקשר:", error);
                return;
            }

            if (response && response.status === 200) {
                this.allContacts = response.data;
                this.renderContacts(response.data);
            }
        });
    },

    editContact: function(id) {
        const contact = this.allContacts.find(c => c.id === id);
        if (contact) {
            this.navigate('add-contact', contact);
        }
    },

    deleteContact: function(id) {
        if (!confirm("האם אתה בטוח שברצונך למחוק?")) return;

        const token = sessionStorage.getItem('token');

        this.sendWithRetry('DELETE', `/contacts/${id}`, null, token, (error, response) => {
            if (error) {
                alert("מחיקה נכשלה עקב תקלת תקשורת.");
                return;
            }
            if (response && response.status === 200) {
                alert("נמחק בהצלחה");
                this.loadContacts();
            }
        });
    },

    handleSearch: function(query) {
        // בגלל שזה חיפוש מקומי במערך שכבר נטען, אין פה פניית רשת
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