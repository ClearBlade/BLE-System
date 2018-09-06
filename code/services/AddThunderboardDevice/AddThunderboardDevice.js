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
    const EDGE_NAME = "ThunderboardOnPi";
    ClearBlade.init({request: req});
    
    log(JSON.stringify(req));
   
    var body;
    
    if (req.params.body) {
        body = JSON.parse(req.params.body) ;  // this is sent by the trigger
        log("if statement succeeded!");
        log(req.params.body);
    }
    
    /** This ensures the gateway can't authenticate a device without checking the device table first. */
    if (body.status != "New") {
        log("Unknown command in payload. Expected 'New': " + JSON.stringify(body)) ;
        resp.error("Unknown command in payload. Expected 'New' " + JSON.stringify(body)) ;
    }

    var numberOfDevices;

    ClearBlade.getAllDevicesForSystem(function(err, data) {
		if(err){
			resp.error("Unable to get all devices: " + JSON.stringify(data))
		}

        numberOfDevices = data.length;

        for (var device = 0; device < numberOfDevices; device++) {
            log("device looks like: " + JSON.stringify(data[device]));

            if (data[device].deviceid == body.deviceId) {
                log("Device Found. Sending Authorized message back.");
                var topic = body.gatewayName +"/command/" + body.deviceId + "/_edge/"+ EDGE_NAME;
                var payload = {"command": "ReadEnv", "status": "Authorized", "gatewayName": body.gatewayName, "deviceId": body.deviceId, "deviceAddress": body.deviceAddress, "deviceType": body.deviceType, "deviceAddrType": body.deviceAddrType};
                log("Publishing topic: " + topic + " with payload " + JSON.stringify(payload));
                var msg = ClearBlade.Messaging();
                msg.publish(topic, JSON.stringify(payload));

                resp.success(body);
            }
        }
	});

    log("either there are no devices or we didn't find any with the right id");
    var generatedName = "thunderboard" + numberOfDevices;
    log("trying to name device: " + generatedName);

    var device = {
		name: generatedName,
		active_key: "clearblade",
		type: "",
		state: "",
		enabled: true,
		allow_key_auth: true,
		allow_certificate_auth: true,
        deviceid: body.deviceId
	};

    ClearBlade.createDevice(device.name, device, true, function(err, data) {
        if(err){
            resp.error("Unable to create device: " + JSON.stringify(data))
        }

        log("Made new device. Sending Authorized message back.");
        
        var topic = body.gatewayName +"/command/" + body.deviceId + "/_edge/"+ EDGE_NAME;
        var payload = {"command": "ReadEnv", "status": "Authorized", "gatewayName": body.gatewayName, "deviceId": body.deviceId, "deviceAddress": body.deviceAddress, "deviceType": body.deviceType, "deviceAddrType": body.deviceAddrType};
        log("Publishing topic: " + topic + " with payload " + JSON.stringify(payload));
        
        var msg = ClearBlade.Messaging();
        msg.publish(topic, JSON.stringify(payload));

        resp.success(data)
    });
}