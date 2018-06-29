/** 
 *
 * @typedef {data} 
 * @property {number} CURRENTPAGE - the results from the colleciton are all from one page
 * @property {Object[]} DATA - each Object in the array contains: 
 * @property {boolean} above_threshold - true if this datapoint is an anomaly
 * @property {string} anomaly_timestamp - when the anomaly was detected
 * @property {number} item_id - uuid
 * @property {string} sensor_key - which sensor this anomaly is from
 * @property {number} threshold_max - if the value is higher than this then its an anomaly
 * @property {number} threshold_min - if the value is lower than this then its an anomaly
 * @property {number} val - the actual value retrieved from the sensor
 */

 /**
 * This service retrieves the 10 most recent data points from the Anomalies collection.
 * @returns {data} response
 */

function GetRecentAnomalies(req, resp){
    ClearBlade.init({request:req}); 
    ClearBlade.Query({collectionName:"anomalies"}).descending("anomaly_timestamp").setPage(10,1).fetch(function(err, data){ 
        if(err){resp.error(data)} 
        resp.success(data)
        
    })
}