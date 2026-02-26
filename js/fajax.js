class FXMLHttpRequest {
    constructor() {
        this.request = {
            method: '',
            url: '',
            data: null,
            token: null
        };
        this.status = 0;
        this.responseText = '';
        
        // הגדרת אירועים (Events) כמאפיינים שהלקוח יכול לדרוס
        this.onload = null;
        this.onerror = null;
    }

    open(method, url) {
        this.request.method = method;
        this.request.url = url;
    }

    setRequestHeader(name, value) {
        if (name === 'Authorization') {
            this.request.token = value;
        }
    }

    send(data = null) {
        this.request.data = data;

        // הפעלת הרשת עם Callback
        Network.send(this.request, (error, response) => {
            if (error) {
                this.status = error.status || 500;
                this.responseText = JSON.stringify(error);
                // הפעלת אירוע שגיאה אם הוגדר
                if (typeof this.onerror === 'function') { 
                    this.onerror();
                }
            } else {
                this.status = response.status;
                this.responseText = JSON.stringify(response); 
                // הפעלת אירוע סיום בהצלחה אם הוגדר
                if (typeof this.onload === 'function') {
                    this.onload();
                }
            }
        });
    }
}