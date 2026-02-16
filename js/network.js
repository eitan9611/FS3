/**
 * Network.js - רכיב האחראי על העברת הודעות בין הלקוח לשרת
 */
const Network = {
    // הגדרת הסתברות להשמטת הודעה (למשל 20%)
    DROP_PROBABILITY: 0.0000000000000001,

    /**
     * פונקציית השליחה המרכזית
     * param Object request - כולל method, url, data, token
     * returns Promise - מחזיר Response או הודעת שגיאה
     */
    send: function(request) {
        return new Promise((resolve, reject) => {
            console.log(`%c[Network] שולח בקשה ל: ${request.url}`, "color: pink");

            // 1. הדמיית השהיה אקראית (1-3 שניות)
            const delay = Math.floor(Math.random() * 2000) + 1000;

            setTimeout(() => {
                // 2. הדמיית השמטת הודעות (Network Error)
                if (Math.random() < this.DROP_PROBABILITY) {
                    console.error("[Network] ההודעה אבדה ברשת!");
                    return reject({ status: 500, message: "תקלת תקשורת: ההודעה לא הגיעה ליעדה" });
                }

                // 3. ניתוב לשרת המתאים לפי ה-URL
                let response;
                
                if (request.url === '/login' || request.url === '/register') {
                    // שליחה לשרת המשתמשים
                    response = AuthServer.handleRequest(request);
                } else if (request.url.startsWith('/contacts')) {
                    // שליחה לשרת אנשי הקשר
                    response = DataServer.handleRequest(request);
                } else {
                    response = { status: 404, message: "כתובת לא נמצאה" };
                }

                console.log(`%c[Network] תגובה התקבלה עם סטטוס ${response.status}`, "color: green");
                resolve(response);

            }, delay);
        });
    }
};