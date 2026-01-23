/**
 * network.js - רכיב רשת התקשורת
 */
const Network = {
    // השמטה בהסתברות נשלטת (בין 10% ל-50%)
    lossProbability: 0.2, 

    /**
     * "מסירה" של הודעה לנמען המתאים
     */
    send: function(request, callback) {
        console.log(`Network: Received request for ${request.url}. Checking for packet loss...`);

        // הדמיית השמטת הודעה
        if (Math.random() < this.lossProbability) {
            console.error("Network: Packet dropped (Random loss simulation).");
            // ההודעה "הושמטה" - לא נקרא ל-callback, והלקוח לא יקבל תגובה
            return; 
        }

        // השהיה אקראית של לפחות 1 שניה ועד 3 שניות
        const delay = Math.floor(Math.random() * 2000) + 1000;

            // js/network.js
    setTimeout(() => {
        let response;
        // ניתוב לפי ה-URL
        if (request.url === '/login' || request.url === '/register') {
            // וודא שהאובייקט בתוך serverUser.js נקרא AuthServer
            response = AuthServer.handleRequest(request); 
        } else if (request.url.startsWith('/contacts')) {
            // וודא שהאובייקט בתוך serverContact.js נקרא ContactServer
            response = ContactServer.handleRequest(request);
        }
        callback(response);
    }, delay);
    }
};