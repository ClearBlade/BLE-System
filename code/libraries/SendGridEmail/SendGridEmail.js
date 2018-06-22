/**
 * Creator: Robert Reinold
 * Updated: 2017-10-02T00:00:00Z
 * Version: v2.0
 * Tags: email, sendgrid, marketing, mail, api, rest, http
 * 
 * Usage:
 * 1. Create a free SendGrid Account. 
 * 2. Log into your SendGrid account, and view the Settings > API Keys tab. Create an API Key with full access to "Mail Send" rights.
 * 3. Replace <SEND_GRID_API_KEY> with SendGrid API key
 * 4. Replace <ORIGIN_EMAIL_ADDRESS> with your desired email address. This will be the 'sender' of the email.
 * 5. Add 'SendGridEmail' as a dependency to your code services (Settings > Requires > Add)
 * 
*/
var SEND_GRID_API_URI = "https://api.sendgrid.com/v3/mail/send";
var DEFAULT_AUTH_TOKEN = ""
var DEFAULT_ORIGIN_EMAIL = ""

SendGridEmail = {
    authToken: DEFAULT_AUTH_TOKEN,
    originEmail: DEFAULT_ORIGIN_EMAIL
}
SendGridEmail.init = function(authToken, originEmail){
    if( authToken ){
        this.authToken = authToken;
    }
    if( originEmail ){
        this.originEmail = originEmail;
    }
}

SendGridEmail.validate = function(){
    if(this.authToken == DEFAULT_AUTH_TOKEN){
        return {
            err: true,
            message: "Auth Token not set. Please get auth token from Send Grid Developer Console"
        }
    }
    if(this.originEmail == DEFAULT_ORIGIN_EMAIL){
        return {
            err: true,
            message: "Origin email not set. Please configure with an approved email from Send Grid Developer Console"
        }
    }
    return {
        err: false,
        message:"Successful init. Auth Token: " + this.authToken + ", Origin Email: " + this.originEmail
    }
}
SendGridEmail.sendEmailToList = function(emailBody, subject, recipientList, callback){
    var initStatus = this.validate()
    
    log(initStatus)
    
    if( initStatus.err ){
        if(callback){
            callback(initStatus.err, initStatus.message)
        }
    }
    
    var toField = recipientList.map(function(addr){return {email:addr}})
    var requestObject = Requests();
    var payload = {
            personalizations: [
              {
                to: toField,
                subject: subject,
              },
            ],
            from: {
              email: this.originEmail,
            },
            content: [
              {
                type: 'text/html',
                value: emailBody,
              },
            ],
          }
    var httpBody = JSON.stringify(payload)
    var authTokenFormal = "Bearer " + this.authToken
    
    var options = {
        uri: SEND_GRID_API_URI,
        headers: {"Authorization": authTokenFormal ,'Content-Type': 'application/json'},
        body: httpBody
    };
    
    log("Request Configuration:")
    log(options)
    
    requestObject.post(options, function (err, resp) {
            if( callback ){
                callback(err, resp);
            }
    });
    
};