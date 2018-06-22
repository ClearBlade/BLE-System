/**
 * @typedef Calibration
 * @property {number} min min value within threshold
 * @property {number} max max value within threshold
 * @property {number} strictness how strict the threshold is against the dataset
 * @property {number} medians intermediary dataset representing the moving medians
 * @property {number} pointsPerWindow calibration, number of points per processing window. may be increased for larger datasets
 * @property {number} numWindows calibration metric derived from pointsPerWindow
 */

/**
 * @typedef Anomaly
 * @property {number} index - index in the provided dataset
 * @property {number} value - value of the data point that is detected as an anomaly
*/

/**
 * Detects Anomalies with Moving Median Decomposition
 * See attached whitepaper for Anomaly Detection for Predictive Maintenance
 * https://files.knime.com/sites/default/files/inline-images/Anomaly_Detection_Time_Series_final.pdf
 * 
 * Run a self-training anomaly detection algorithm against a given dataset
 * @parameter {number[]} dataset array of numbers
 */
function AnomalyDetection(dataset){
    
    var DEFAULT_PTS_PER_WINDOW = 10;
    // Note: this is the number of std deviations from median
    var DEFAULT_STRICTNESS = 3; 
    
    var strictness = DEFAULT_STRICTNESS
    var min = Number.MAX_VALUE
    var max = Number.MIN_VALUE
    medians = []
    pointsPerWindow = DEFAULT_PTS_PER_WINDOW
    var numWindows = 1;
    
    /**
     * Use precomputed anomaly detection calibration profile
     * This can be used to speed up performance for real-time anomaly detection
     */
    function calibrate(avgMedian, strictnessOverride){
        strict = strictnessOverride
    }
    
    /**
     * Run the algorithm against the provided dataset.
     * 
     * Note: This is the most computation-heavy method in this library
     * 
     * @parameter {number} strictnessOverride (optional) Set the strictness of the anomaly detection
     * @returns {Anomaly[]} anomalies - the list of anomalies found in dataset
     */
    function detect(strictnessOverride){
        strictness = strictnessOverride !== null ? strictnessOverride : DEFAULT_STRICTNESS
        
        numWindows =  dataset.length <= pointsPerWindow ? 1 : dataset.length - (pointsPerWindow - 1);
        var lastIndex = dataset.length <= pointsPerWindow - 1 ? dataset.length - 1  : pointsPerWindow - 1
        var theWindow = dataset.slice(0,lastIndex + 1)
        medians = [jStat.median(theWindow)]
        log({numWindows})
        log({theWindow})
        log({medians})
        for(var i = pointsPerWindow ; i < dataset.length ; i++){
            theWindow.shift();
            theWindow.push(dataset[i])
            medians.push(jStat.median(theWindow))
        }
        
        var avgOfMed = jStat.mean(medians);
        var stdDev = jStat.stdev(dataset)
        min = avgOfMed - strictness*stdDev
        max = avgOfMed + strictness*stdDev
        
        var anomalies = []
        
        dataset.forEach(function(value,index){
            if( max < value || value < min){
                anomalies.push({value, index})
            }
        })
        
        return anomalies;
    }
    
    /**
     * Fetch the computed anomaly detection calibration parameters
     * @returns {Calibration} calibration
     */
    function getCalibration(){
        return {
            min,max,strictness, medians, pointsPerWindow, numWindows
        }
    }
    
    return {
        detect,
        calibrate,
        getCalibration
    }
}