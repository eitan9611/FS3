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
        // ולידציה בסיסית בשרת
        if (!userData.username || !userData.password) {
            return { status: 400, message: 'שם משתמש וסיסמה חובה' };
        }

        const success = DB.insert(DB_USERS_KEY, userData);
        if (success) {
            return { status: 201, message: 'משתמש נרשם בהצלחה' };
        }
        return { status: 409, message: 'שם משתמש כבר קיים' };
    },

    login: function(credentials) {
        const users = DB.findAll(DB_USERS_KEY);
        const user = users.find(u => 
            u.username === credentials.username && 
            u.password === credentials.password
        );

        if (user) {
            // יצירת "טוקן" פשוט לצורכי הדמיית אבטחה
            const token = btoa(user.username + ":" + Date.now());
            return { 
                status: 200, 
                message: 'כניסה הצליחה', 
                data: { username: user.username, token: token } 
            };
        }
        return { status: 401, message: 'שם משתמש או סיסמה שגויים' };
    }
};