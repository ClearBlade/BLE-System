/** 
 * When the gateway detects a thunderboard via BLE, it checks to see if it 
 * has configuration values that match a device in the device table. This code
 * service triggers when a MQQT message is sent for the above reason, and if 
 * there does exist a matching device then it sends a message back to the 
 * gateway authenticating the device so it can start gathering data.
 * 
 * @param {Object} body contains the MQQT status message
 * sent from the gateway
 * @param {string} body.status should always be "New" if it exists
 * @param {int} body.deviceId is the name of the device specified
 * in the adapter, should match the name of a device in the device table
 */

function AddThunderboardDevice(req, resp){
    ClearBlade.init({request: req});
    
    log(JSON.stringify(req));
   
    var body;
    
    if (req.params.body) {
        body = JSON.parse(req.params.body) ;  // this is sent by the trigger
        log("if statement succeeded!");
        log(req.params.body);
        deviceId = body.deviceId;
        gatewayName = body.topicName;
    }
    
    /** This ensures the gateway can't authenticate a device without checking the device table first. */
    if (body.status != "New") {
        log("Unknown command in payload. Expected 'New': " + JSON.stringify(body)) ;
        resp.error("Unknown command in payload. Expected 'New' " + JSON.stringify(body)) ;
    }

    ClearBlade.getDeviceByName(body.deviceId, function(err, data) {
		if(err){
			log("Unable to find device: " + JSON.stringify(data)) ;
			resp.error("Unable to get device: " + JSON.stringify(data));
		} else {
		    log("Device Found. Sending Authorized message back.");
			log(JSON.stringify(data));
			
			var topic = body.gatewayName +"/command/" + body.deviceId;
	        var payload = {"command": "ReadEnv", "status": "Authorized", "gatewayName": body.gatewayName, "deviceId": body.deviceId, "deviceAddress": body.deviceAddress, "deviceType": body.deviceType, "deviceAddrType": body.deviceAddrType};
	        log("Publishing topic: " + topic + " with payload " + JSON.stringify(payload));
	        
	        var msg = ClearBlade.Messaging();
            msg.publish(topic, JSON.stringify(payload));
            resp.success("Done");  
		}
	});
}