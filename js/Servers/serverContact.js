/**
 * DataServer - אחראי על ניהול אנשי הקשר
 */
const DataServer = {
    handleRequest: function(request) {
        const { method, url, data, token } = request;

        // בדיקת אבטחה: האם המשתמש מורשה?
        if (!this.authenticate(token)) {
            return { status: 401, message: 'גישה נדחתה: משתמש לא מחובר' };
        }
        // ניתוח ה-URL וניתוב לפעולה המתאימה (REST)
        if (url === '/contacts') {
            if (method === 'GET') return this.getAll(data.owner);
            if (method === 'POST') return this.add(data);
        }
        
        if (url.startsWith('/contacts/')) {
            const id = url.split('/')[2];
            if (method === 'GET') return this.getOne(id);
            if (method === 'PUT') return this.update(id, data);
            if (method === 'DELETE') return this.remove(id);
        }

        return { status: 404, message: 'המשאב לא נמצא' };
    },

    authenticate: function(token) {
        // בשרת אמיתי נבדוק את תוקף הטוקן במאגר הסשנים
        return !!token;
    },

    getAll: function(username) {
        const data = DB.findAll(DB_DATA_KEY);
        const userContacts = data.filter(c => c.owner === username);
        return { status: 200, data: userContacts };
    },

    add: function(contact) {
        const newContact = DB.insert(DB_DATA_KEY, contact);
        return { status: 201, data: newContact };
    },

    update: function(id, data) {
        const updated = DB.update(DB_DATA_KEY, id, data);
        return updated ? { status: 200, data: updated } : { status: 404 };
    },

    remove: function(id) {
        const deleted = DB.delete(DB_DATA_KEY, id);
        return deleted ? { status: 200, message: 'נמחק בהצלחה' } : { status: 404 };
    }
};