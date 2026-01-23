/**
 * fajax.js - מנגנון הדמיית התקשורת (Fake AJAX)
 */
class FXMLHttpRequest {
    constructor() {
        // שדות דומים למחלקת XMLHttpRequest הסטנדרטית
        this.readyState = 0; // 0: UNSENT
        this.status = 0;
        this.responseText = "";
        this.onreadystatechange = null;
    }

    /**
     * הגדרת אובייקט התקשורת (שיטה וכתובת)
     */
    open(method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1; // 1: OPENED
        if (typeof this.onreadystatechange === 'function') {
            this.onreadystatechange();
        }
    }

    /**
     * שליחת הפנייה אל השרת דרך רשת התקשורת
     */
    send(data = null) {
        // אריזת המידע בפורמט JSON
        const requestObject = {
            method: this.method,
            url: this.url,
            data: data,
            token: localStorage.getItem('user_token') // העברת "טוקן" אימות אם קיים
        };

        // הלקוח "שולח" את הפנייה דרך הרשת
        Network.send(requestObject, (response) => {
            // השרת "מחזיר" תגובה הכוללת מצב טיפול ומידע
            this.status = response.status;
            this.responseText = JSON.stringify(response);
            this.readyState = 4; // 4: DONE

            if (typeof this.onreadystatechange === 'function') {
                this.onreadystatechange();
            }
        });
    }
}