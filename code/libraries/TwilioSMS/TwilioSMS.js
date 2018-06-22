/**
 * Sends a text message using Twilio's REST API.
 * 
 * @param {string} user Twilio API account ex. "BC218b72987d86855a5adb921370115a20"
 * @param {string} pass Twilio API passcode ex. "4579ac6ba4fae7b452c03c64aeae40e7"
 * @param {string} sourceNumber Origin phone number of text message, ex "(+1 512-713-2783)"
 */
function Twilio(user, pass, originNumber){
    
    if(!user || !pass || !originNumber){
        throw new Error("Falsey Twilio configuration found.");
    }
    
 /**
  * Send SMS message
  * @param {string} text text body
  * @param {string} recipientNumber Formatted phone number ex. "(+1 339-987-2816)"
  * @param {callback} callback ex. function(err, data){}
  */
    function sendSMS(text, recipientNumber, callback){
        var options = {
            auth:{ user, pass },
            uri : "https://api.twilio.com/2010-04-01/Accounts/"+user+"/SMS/Messages.json",
            body:{
                Body:   text,
                To:     recipientNumber,
                From:   originNumber
            },
            form:true
        };
        
        var requestObject = Requests();
        requestObject.post(options,callback);   
    }
    return {
        sendSMS 
    };
};