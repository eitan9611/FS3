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
    }

    // constructor for the constructor function
    open(method, url) {
        this.request.method = method;
        this.request.url = url;
    }

    // הוספת טוקן אבטחה במידה וקיים (חשוב לפעולות על אנשי קשר) 
    setRequestHeader(name, value) {
        if (name === 'Authorization') {
            this.request.token = value;
        }
    }

    send(data = null) {
        this.request.data = data;

        return Network.send(this.request)
            .then(response => {
                this.status = response.status;
                this.responseText = JSON.stringify(response); 
                return response;
            })
            .catch(error => {
                this.status = error.status || 500;
                this.responseText = JSON.stringify(error);
                throw error; 
            });
    }
}