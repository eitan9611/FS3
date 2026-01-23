/**
 * db.js - מנגנון ה-DB של המערכת
 * רכיב זה אחראי על הפעולות מול ה-LocalStorage.
 */

// מפתחות המאגרים ב-Local Storage
const DB_USERS_KEY = 'app_users';
const DB_DATA_KEY = 'app_contacts';

const DB = {
    // --- פעולות עזר פנימיות ---
    
    // שליפת מערך נתונים לפי מפתח
    _getAll: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // שמירת מערך נתונים לפי מפתח
    _saveAll: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- API-DB מוגדר ---

    /**
     * שליפת כל הרשומות ממאגר מסוים
     * @param {string} key - המפתח של המאגר (USERS או DATA)
     */
    findAll: function(key) {
        return this._getAll(key);
    },

    /**
     * שליפת רשומה לפי מזהה ייחודי (ID)
     */
    findById: function(key, id) {
        const items = this._getAll(key);
        return items.find(item => item.id === id) || null;
    },

    /**
     * הוספת רשומה חדשה
     * דרישה: כל רשומה תכלול שדה id מתאים
     */
    insert: function(key, newItem) {
        const items = this._getAll(key);
        // יצירת מזהה ייחודי פשוט מבוסס זמן
        newItem.id = Date.now().toString();
        items.push(newItem);
        this._saveAll(key, items);
        return newItem;
    },

    /**
     * עדכון רשומה קיימת
     */
    update: function(key, id, updatedData) {
        let items = this._getAll(key);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            // שמירה על ה-id המקורי ועדכון שאר השדות
            items[index] = { ...items[index], ...updatedData, id: id };
            this._saveAll(key, items);
            return items[index];
        }
        return null;
    },

    /**
     * מחיקת רשומה
     */
    delete: function(key, id) {
        let items = this._getAll(key);
        const originalLength = items.length;
        items = items.filter(item => item.id !== id);
        
        if (items.length < originalLength) {
            this._saveAll(key, items);
            return true;
        }
        return false;
    }
};