const STRICTNESS_GUIDE = {
    "LOW": 8,
    "MODERATE": 2,
    "HIGH": 1
}

/**
 * Example logic for detecting anomalies in a dataset of sensor values
 * @returns {Anomaly[]} anomalies
 */
function ExampleDetectAnomaly(req, resp){
    
    var strictness = STRICTNESS_GUIDE["HIGH"]
    var input = [3,4,7,1,1,7,6,3,7,10,3,6,7,0,0,9,0,10,5,5,0,6,1,7,4,40,1,9,8,2,1,8,1,1,6,8,4,2,7,8,6,3,5,5,5,1,9,8,2,9,6,2,10,3,3,3,7,1,5,60,5,6,1,10,9,1,3,8,3,6,10,2,1,8,2,5,6,2,1,1,4,8,6,8,7,30,8,1,1,2,0,6,5,5,7,3,6,4,3,2];
    var anom = AnomalyDetection(input)
    
    var anomalies = anom.detect(strictness)
    
    resp.success(anomalies)
}