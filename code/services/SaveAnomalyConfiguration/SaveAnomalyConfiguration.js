/**
 * Ingests updated anomaly configuration, and saves to AnomalyConfiguration Collection
 * 
 * @param {AnomalyConfiguration} anomalyConfiguration - map of settings to update
 */
function SaveAnomalyConfiguration(req, resp){
    const collectionName = "AnomalyConfiguration"
    var count = 0;
    log(req)
    ClearBlade.init({request:req})
    for(key in req.params){
        var val = req.params[key]
        var query = ClearBlade.Query({collectionName}).equalTo('key',key).update({val},callback)
    }
    
    function callback(err, data){
        count++
        if(err){
            var msg = "Failed to update settings: " + JSON.stringify(data)
            log(err); resp.error(msg)
        }
        if(count == Object.keys(req.params).length) {
            log("Done")
            resp.success("Done")
        }
    }    
}