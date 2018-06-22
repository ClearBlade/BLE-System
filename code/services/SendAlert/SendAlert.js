/**
 * This is triggered by an Anomaly being recorded, and inserted into the Anomalies Collection
 * 
 * - Fetches the anomaly row
 * - Checks for alerting configuration
 * - Sends email, text alert
 *
 * @param {number} item_id - the id of the anomaly in Anomalies collection to be retrieved
 * @returns {Object} response - simple response of success or error
 *
 */

function SendAlert(req, resp){
    log(req)
    var config = {}
    var anomaly;
    ClearBlade.init({request:req})
    var collectionName = "AnomalyConfiguration"
    ClearBlade.Collection({collectionName}).fetch(configure)
    
    function configure(err, data){
        if (err){
            var msg = "Failed to get anomaly configuration: " + JSON.stringify(data)
            log(msg); resp.error(msg)
        }
        data.DATA.forEach(function(setting){
            config[setting.key] = setting.val || setting.default_val
        })
        
        config["sms_alerts_enabled"] =  JSON.parse(config["sms_alerts_enabled"])
        config["email_alerts_recipients"] =  JSON.parse(config["email_alerts_recipients"])
        config["email_alerts_enabled"] =  JSON.parse(config["email_alerts_enabled"])
        
        log({config})
        getNewRow()
        
    }
    
    function getNewRow(){
        var item_id = req.params.items[0].item_id
        ClearBlade.Query({collectionName:"Anomalies"}).equalTo("item_id",item_id).fetch(function(err, data){
            if(err){
                var msg = "Failed to fetch from Anomalies: "+JSON.stringify(data)
                log(msg); resp.error(msg)
            }
            if(data.TOTAL != 1){
                var msg = "fetched incorrect number of Anomalies: "+JSON.stringify(data)
                log(msg); resp.error(msg)
            }
            anomaly = data.DATA[0]
            alert(anomaly)
        })
    }
    
    function alert(anomaly){
        if(config.sms_alerts_enabled){
            log("SMS Enabled")
            sendSMS(anomaly, config.sms_alerts_recipient, TWILIO_CONFIG)
        }
        if(config.email_alerts_enabled){
            log("EMAIL Enabled")
            sendEmail(anomaly, config.email_alerts_recipients, SENDGRID_CONFIG)
        }
        log("Done")
        resp.success("Done")
    }
    
    
    function sendEmail(anom, recipients, sendgridConfig){
        SendGridEmail.init(sendgridConfig.AUTH_TOKEN, sendgridConfig.ORIGIN_EMAIL)
        var message = anom.anomaly_timestamp
        var subject = "Alert"
        SendGridEmail.sendEmailToList(message, subject, recipients, function(err, data){
        if(err){
            log(JSON.stringify(err))
            resp.error(err)
        }
        var message = "Successful email sent!"
        log(message); 
    })
    }
    
    function sendSMS(anom, recipient, sms){
        var twilio = Twilio(sms.USER, sms.PASS, sms.SOURCE_NUMBER);
        var text = format(anom)
        log(text)
        twilio.sendSMS(text, recipient, callback);
        
        
        function callback(err, data){
            if(err){
                resp.error(err);
                log(err)
            }
            log("Successfully sent SMS")
        }
    }
    
    function format(row){
      var avg = (row.threshold_max - row.threshold_min) / 2
      var variance = Math.abs(row.val - avg) / avg
      var variancePercent = Math.round(variance * 100)
    
      row.variancePercent = variancePercent
      var output = "Sensor {{sensor_key}} breached threshold by {{variancePercent}}% with value of {{val}}";
      for(var i in row){
        output = output.replace("{{"+i+"}}",row[i])
      }
      return output
    }
    
}