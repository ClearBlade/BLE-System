/**
 * @typedef {VisualPoints} 
 * @property {number} sensorValue - value retrieved by sensor to be displayed in portal
 * @property {number} min - determined by anomaly detection algorithm, if sensorValue is lower than this
 * then it is an anomaly
 * @property {number} max - determined by anomaly detection algorithm, if sensorValue is higher than this
 * then it is an anomaly
 */

/**
 * @typedef {Object} AnomalyVisual
 * @property {VisualPoints[]} toViz - array of points to be displayed in graph in portal
 * @property {Anomaly[]} anomalies - these are datapoints considered to be anomalies
 */

/**
 * Detects an anomaly in the last X MQTT Messages
 * Uses 'AnomalyConfiguration' config to check for a key in the JSON of each message.
 * ex. 'sensor_key' will be set to 'temperature', so we know to pull the temperature key/value pair from a mqtt message like this:
 * {"temperature":40,"humidity":31}
 * 
 * @returns {AnomalyVisual} data to visualize this anomaly detection
 */
function DetectAnomaly(req, resp){
    var config = {}
    const STRICTNESS_GUIDE = {
        "OFF": 15,
        "LOW": 8,
        "MODERATE": 2,
        "HIGH": 1
    }

    ClearBlade.init({request:req})
    var collectionName = "AnomalyConfiguration"
    ClearBlade.Collection({collectionName}).fetch(configure)
    
    function configure(err, data){
        if (err){
            var msg = "Failed to get anomaly configuration: " + JSON.stringify(data)
            log(msg);
            resp.error(msg)
        }
        data.DATA.forEach(function(setting){
            config[setting.key] = setting.val || setting.default_val
        })
        
        config.strictnessStdDev = STRICTNESS_GUIDE[config.strictness]
        
        log({config})
        fetchMessages()
        
    }
    
    function fetchMessages(){
            
        var msg = ClearBlade.Messaging();
        var unixTimeMilli = new Date().getTime() / 1000;
    	msg.getMessageHistory(config.topic, unixTimeMilli, 50, detect);
    	
    	detect()
    	
    }

    function detect(err, messages){
        if (err){
            var msg = "Failed to get anomaly configuration: " + JSON.stringify(messages)
            log(msg); resp.error(msg)
        }
        var datafeed = messages.map(function(e){
            log({config})
            var msg = JSON.parse(e.message)
            e.parsedMessage = msg
            log({msg})
            var sensor_key = config.sensor_key
            log({sensor_key})
            var sensorValue = msg[sensor_key]
            log({sensorValue})
            return sensorValue
        })
        
        var anom = AnomalyDetection(datafeed)
        var anomalies = anom.detect(config.strictnessStdDev)
        
        var cal = anom.getCalibration()
        // TODO viz min, max
        var toViz = [];
        var min = cal.min
        var max = cal.max
        appendMessageContentsTo(anomalies, messages)
        createEntryFor(anomalies, min, max)
        datafeed.forEach(function(sensorValue,i){
            toViz.push({sensorValue,min,max})
        })
        var median = cal.median
        resp.success({toViz,anomalies})
    }
    
    
    function createEntryFor(anomalies,min,max){
        for(var i in anomalies){
            var anomaly = anomalies[i]
            var entry = {
                sensor_key: config.sensor_key,
                anomaly_timestamp: new Date(anomaly.timestamp),
                val: new String(anomaly.value),
                threshold_min: min,
                threshold_max: max,
                above_threshold: (anomaly.value > max)
            }
            log({entry})
            ClearBlade.Collection({collectionName:"Anomalies"}).create(entry,function(err, data){log(data)}) // todo callbacks....
        }
    }
    
    function appendMessageContentsTo(anomalies, messages){
        anomalies.forEach(function(e){
            var indexOfAnomaly = e.index
            var correspondingMessage = messages[indexOfAnomaly]
            var timestampMilli = correspondingMessage["send-date"] * 1000
            e.timestamp = new Date(timestampMilli)
        })
    }
    
} 
