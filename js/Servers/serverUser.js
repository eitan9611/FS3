/**
 * AuthServer - אחראי על לוגיקת רישום וכניסה
 */
const AuthServer = {
    handleRequest: function(request) {
        const { method, url, data } = request;

        if (method === 'POST' && url === '/register') {
            return this.register(data);
        }
        if (method === 'POST' && url === '/login') {
            return this.login(data);
        }
        
        return { status: 404, message: 'נתיב לא נמצא' };
    },

    register: function(userData) {
        // 1. ולידציה בסיסית - האם השדות קיימים
        if (!userData.username || !userData.password || !userData.email) {
            return { status: 400, message: 'כל השדות (שם משתמש, סיסמה ואימייל) הם חובה' };
        }

        // 2. שליפת כל המשתמשים הקיימים מה-DB
        const users = DB.findAll(DB_USERS_KEY);

        // 3. בדיקה לוגית א': האם שם המשתמש כבר קיים?
        const isUsernameTaken = users.some(u => u.username === userData.username);
        if (isUsernameTaken) {
            return { status: 409, message: 'שם המשתמש כבר קיים במערכת' };
        }

        // 4. בדיקה לוגית ב': האם האימייל כבר קיים?
        const isEmailTaken = users.some(u => u.email === userData.email);
        if (isEmailTaken) {
            return { status: 409, message: 'כתובת האימייל כבר רשומה במערכת' };
        }

        // 5. אם הכל תקין - ביצוע ההכנסה למאגר
        const success = DB.insert(DB_USERS_KEY, userData);
        if (success) {
            return { status: 201, message: 'משתמש נרשם בהצלחה' };
        }
        
        return { status: 500, message: 'שגיאה בשמירת הנתונים' };
    },

    login: function(credentials) {
        const users = DB.findAll(DB_USERS_KEY);
        const user = users.find(u => 
            u.username === credentials.username && 
            u.password === credentials.password
        );

        if (user) {
            // יצירת "טוקן" פשוט לצורכי אבטחה (מבוסס זמן)
            const token = btoa(user.username + ":" + Date.now());
            return { 
                status: 200, 
                data: { 
                    token: token,
                    username: user.username 
                } 
            };
        }
        return { status: 401, message: 'שם משתמש או סיסמה שגויים' };
    }
};