![alt text](https://i.imgur.com/dmtaj3d.jpg)

# ipm package: thunderboard-visualization

## Overview

This package deploys to an NXP imx6 gateway, which tries to connect to any nearby Thunderboards via BLE. The Thunderboard sends any data it gathers to the gateway, which then forwards it to the platform. The platform then displays the data in a graph in the AnomalyDetection portal.

This is an ipm package, which contains one or more reusable assets within the ipm Community. The 'package.json' in this repo is a ipm spec's package.json, [here](https://docs.clearblade.com/v/3/6-ipm/spec), which is a superset of npm's package.json spec, [here](https://docs.npmjs.com/files/package.json).

[Browse ipm Packages](https://ipm.clearblade.com)

## Setup
1. Flash the firmware of your Thunderboard so the advertisement period for connecting via BLE lasts indefinitely. See https://drive.google.com/file/d/1IKI7dMM06SRRPKHS4E41vE-PMXk9SQw1/view?usp=sharing for reference.
2. Create a system on the ClearBlade platform and install this IPM.
3. Go to the Users tab and create a user. Make sure the user has the Authenticated role.
4. Go to the Devices tab and create a device. MAKE SURE you copy the Active key and save it somewhere before you finish making the device. 
5. Go to the Edges tab and add an edge. Click on Setup instructions and set the architecture of your gateway. (If you are using the NXP imx6 it will be Linux 32 bit - ARM)
6. SSH into your gateway and follow the instructions. You need to copy the Download, Unzip, Install, Permission, and very bottom commands and run them on your gateway in the directory you want your Edge to be in. Make sure to put nohup in front of the very last command, you will need to exit this shell session and SSH back into the gateway. Run top and verify the edge is running by looking for the word edge in the COMMAND column on the far right.
7. Change the directory to adapters/thunder2 and open the pythonScanner.py file. Update the credentials at the beginning to match your own. Save and exit the file.
8. Go back to your ClearBlade system, and go to the Adapters tab. Select the thunder2 adapter, select your edge, and press the play button.
9. Congratualtions, your IoT system should now be working!

## Usage
To see a visualization of the data, go to the Portals tab and click on the AnomalyDetection portal. Change the topic field on the right to be thunderboard/environment/YOURDEVICENAME/_platform, and change the Sensor Key field to one of sound, co2, temperature, voc, battery, light, uv, humidity, pressure.

#Assets	

## Code Services
<span style="color:red">  AddThunderboardDevice</span> - Checks if a thunderboard device exists in the device table, if yes then sends authentication message back to gateway.  
<span style="color:red">  DetectAnomaly</span> - Detects an anomaly in the last X MQTT Messages  
<span style="color:red">  ExampleDetectAnomaly</span> - Runs anomaly detection against an example dataset, returns an array of Anomalies with metadata.  
<span style="color:red">  GetRecentAnomalies</span> - This service retrieves the 10 most recent data points from the Anomalies collection  
<span style="color:red">  SaveAnomalyConfiguration</span> - Ingests updated anomaly configuration, and saves to AnomalyConfiguration Collection  
<span style="color:red">  SendAlert</span> - Fetches the anomaly row, checks for alerting configuration, and sends email, text alerts  


## Code Libraries
<span style="color:red">  AnomalyDetection</span> - Core library for detecting anomalies in datasets  
<span style="color:red">  AnomalyDetectionConstants</span> - Optional credentials for Alerting (SMS via Twilio, Email via Sendgrid)  
<span style="color:red">  jStat</span> - Dependency on [jstat-statistics-toolkit](https://github.com/rreinold/jstat-statistics-toolkit)   
<span style="color:red">  SendGridEmail</span> -  Dependency on [send-grid-email](https://github.com/rreinold/clearblade-sendgrid-email-integration)  
<span style="color:red">  TwilioSMS</span> - Dependency on [twilio-sms-library](https://github.com/rreinold/twilio-sms-library)

## Code Triggers
<span style="color:red">  NewThunderboardDevice</span> - triggers on MQQT message published to +/status/+  
<span style="color:red">  SendAlertsTrigger</span> - triggers when item created in Anomalies collection  

## Portals
<span style="color:red"> AnomalyDetection </span> - Portal for viewing and configuring live datafeeds, rules, and alerts

# API

## Members

<dl>
<dt><a href="#SEND_GRID_API_URI">SEND_GRID_API_URI</a></dt>
<dd><p>Creator: Robert Reinold
Updated: 2017-10-02T00:00:00Z
Version: v2.0
Tags: email, sendgrid, marketing, mail, api, rest, http</p>
<p>Usage:</p>
<ol>
<li>Create a free SendGrid Account. </li>
<li>Log into your SendGrid account, and view the Settings &gt; API Keys tab. Create an API Key with full access to &quot;Mail Send&quot; rights.</li>
<li>Replace &lt;SEND_GRID_API_KEY&gt; with SendGrid API key</li>
<li>Replace &lt;ORIGIN_EMAIL_ADDRESS&gt; with your desired email address. This will be the &#39;sender&#39; of the email.</li>
<li>Add &#39;SendGridEmail&#39; as a dependency to your code services (Settings &gt; Requires &gt; Add)</li>
</ol>
</dd>
<dt><a href="#template">template</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#AnomalyDetection">AnomalyDetection()</a></dt>
<dd><p>Detects Anomalies with Moving Median Decomposition
See attached whitepaper for Anomaly Detection for Predictive Maintenance
<a href="https://files.knime.com/sites/default/files/inline-images/Anomaly_Detection_Time_Series_final.pdf">https://files.knime.com/sites/default/files/inline-images/Anomaly_Detection_Time_Series_final.pdf</a></p>
<p>Run a self-training anomaly detection algorithm against a given dataset</p>
</dd>
<dt><a href="#Twilio">Twilio(user, pass, sourceNumber)</a></dt>
<dd><p>Sends a text message using Twilio&#39;s REST API.</p>
</dd>
<dt><a href="#AddThunderboardDevice">AddThunderboardDevice(body)</a></dt>
<dd><p>When the gateway detects a thunderboard via BLE, it checks to see if it 
has configuration values that match a device in the device table. This code
service triggers when a MQQT message is sent for the above reason, and if 
there does exist a matching device then it sends a message back to the 
gateway authenticating the device so it can start gathering data.</p>
</dd>
<dt><a href="#DetectAnomaly">DetectAnomaly()</a> ⇒ <code><a href="#AnomalyVisual">AnomalyVisual</a></code></dt>
<dd><p>Detects an anomaly in the last X MQTT Messages
Uses &#39;AnomalyConfiguration&#39; config to check for a key in the JSON of each message.
ex. &#39;sensor_key&#39; will be set to &#39;temperature&#39;, so we know to pull the temperature key/value pair from a mqtt message like this:
{&quot;temperature&quot;:40,&quot;humidity&quot;:31}</p>
</dd>
<dt><a href="#ExampleDetectAnomaly">ExampleDetectAnomaly()</a> ⇒ <code><a href="#Anomaly">Array.&lt;Anomaly&gt;</a></code></dt>
<dd><p>Example logic for detecting anomalies in a dataset of sensor values</p>
</dd>
<dt><a href="#SaveAnomalyConfiguration">SaveAnomalyConfiguration(anomalyConfiguration)</a></dt>
<dd><p>Ingests updated anomaly configuration, and saves to AnomalyConfiguration Collection</p>
</dd>
<dt><a href="#SendAlert">SendAlert(item_id)</a> ⇒ <code>Object</code></dt>
<dd><p>This is triggered by an Anomaly being recorded, and inserted into the Anomalies Collection</p>
<ul>
<li>Fetches the anomaly row</li>
<li>Checks for alerting configuration</li>
<li>Sends email, text alert</li>
</ul>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Calibration">Calibration</a></dt>
<dd></dd>
<dt><a href="#Anomaly">Anomaly</a></dt>
<dd></dd>
<dt><a href="#AnomalyVisual">AnomalyVisual</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#self-explanatory">self-explanatory</a> ⇒ <code>data</code></dt>
<dd><p>This service retrieves the 10 most recent data points from the Anomalies collection.</p>
</dd>
</dl>

<a name="SEND_GRID_API_URI"></a>

## SEND_GRID_API_URI
Creator: Robert Reinold
Updated: 2017-10-02T00:00:00Z
Version: v2.0
Tags: email, sendgrid, marketing, mail, api, rest, http

Usage:
1. Create a free SendGrid Account. 
2. Log into your SendGrid account, and view the Settings > API Keys tab. Create an API Key with full access to "Mail Send" rights.
3. Replace <SEND_GRID_API_KEY> with SendGrid API key
4. Replace <ORIGIN_EMAIL_ADDRESS> with your desired email address. This will be the 'sender' of the email.
5. Add 'SendGridEmail' as a dependency to your code services (Settings > Requires > Add)

**Kind**: global variable  
<a name="template"></a>

## template
**Kind**: global variable  
<a name="AnomalyDetection"></a>

## AnomalyDetection()
Detects Anomalies with Moving Median Decomposition
See attached whitepaper for Anomaly Detection for Predictive Maintenance
https://files.knime.com/sites/default/files/inline-images/Anomaly_Detection_Time_Series_final.pdf

Run a self-training anomaly detection algorithm against a given dataset

**Kind**: global function  
**Parameter**: <code>number[]</code> dataset array of numbers  

* [AnomalyDetection()](#AnomalyDetection)
    * [~calibrate()](#AnomalyDetection..calibrate)
    * [~detect()](#AnomalyDetection..detect) ⇒ [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly)
    * [~getCalibration()](#AnomalyDetection..getCalibration) ⇒ [<code>Calibration</code>](#Calibration)

<a name="AnomalyDetection..calibrate"></a>

### AnomalyDetection~calibrate()
Use precomputed anomaly detection calibration profile
This can be used to speed up performance for real-time anomaly detection

**Kind**: inner method of [<code>AnomalyDetection</code>](#AnomalyDetection)  
<a name="AnomalyDetection..detect"></a>

### AnomalyDetection~detect() ⇒ [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly)
Run the algorithm against the provided dataset.

Note: This is the most computation-heavy method in this library

**Kind**: inner method of [<code>AnomalyDetection</code>](#AnomalyDetection)  
**Returns**: [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly) - anomalies - the list of anomalies found in dataset  
**Parameter**: <code>number</code> strictnessOverride (optional) Set the strictness of the anomaly detection  
<a name="AnomalyDetection..getCalibration"></a>

### AnomalyDetection~getCalibration() ⇒ [<code>Calibration</code>](#Calibration)
Fetch the computed anomaly detection calibration parameters

**Kind**: inner method of [<code>AnomalyDetection</code>](#AnomalyDetection)  
**Returns**: [<code>Calibration</code>](#Calibration) - calibration  
<a name="Twilio"></a>

## Twilio(user, pass, sourceNumber)
Sends a text message using Twilio's REST API.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> | Twilio API account ex. "BC218b72987d86855a5adb921370115a20" |
| pass | <code>string</code> | Twilio API passcode ex. "4579ac6ba4fae7b452c03c64aeae40e7" |
| sourceNumber | <code>string</code> | Origin phone number of text message, ex "(+1 512-713-2783)" |

<a name="Twilio..sendSMS"></a>

### Twilio~sendSMS(text, recipientNumber, callback)
Send SMS message

**Kind**: inner method of [<code>Twilio</code>](#Twilio)  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | text body |
| recipientNumber | <code>string</code> | Formatted phone number ex. "(+1 339-987-2816)" |
| callback | <code>callback</code> | ex. function(err, data){} |

<a name="AddThunderboardDevice"></a>

## AddThunderboardDevice(body)
When the gateway detects a thunderboard via BLE, it checks to see if it 
has configuration values that match a device in the device table. This code
service triggers when a MQQT message is sent for the above reason, and if 
there does exist a matching device then it sends a message back to the 
gateway authenticating the device so it can start gathering data.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>Object</code> | contains the MQQT status message sent from the gateway |
| body.status | <code>string</code> | should always be "New" if it exists |
| body.deviceId | <code>int</code> | is the name of the device specified in the adapter, should match the name of a device in the device table |

<a name="DetectAnomaly"></a>

## DetectAnomaly() ⇒ [<code>AnomalyVisual</code>](#AnomalyVisual)
Detects an anomaly in the last X MQTT Messages
Uses 'AnomalyConfiguration' config to check for a key in the JSON of each message.
ex. 'sensor_key' will be set to 'temperature', so we know to pull the temperature key/value pair from a mqtt message like this:
{"temperature":40,"humidity":31}

**Kind**: global function  
**Returns**: [<code>AnomalyVisual</code>](#AnomalyVisual) - data to visualize this anomaly detection  
<a name="ExampleDetectAnomaly"></a>

## ExampleDetectAnomaly() ⇒ [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly)
Example logic for detecting anomalies in a dataset of sensor values

**Kind**: global function  
**Returns**: [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly) - anomalies  
<a name="SaveAnomalyConfiguration"></a>

## SaveAnomalyConfiguration(anomalyConfiguration)
Ingests updated anomaly configuration, and saves to AnomalyConfiguration Collection

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| anomalyConfiguration | <code>AnomalyConfiguration</code> | map of settings to update |

<a name="SendAlert"></a>

## SendAlert(item_id) ⇒ <code>Object</code>
This is triggered by an Anomaly being recorded, and inserted into the Anomalies Collection

- Fetches the anomaly row
- Checks for alerting configuration
- Sends email, text alert

**Kind**: global function  
**Returns**: <code>Object</code> - response - simple response of success or error  

| Param | Type | Description |
| --- | --- | --- |
| item_id | <code>number</code> | the id of the anomaly in Anomalies collection to be retrieved |

<a name="Calibration"></a>

## Calibration
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| min | <code>number</code> | min value within threshold |
| max | <code>number</code> | max value within threshold |
| strictness | <code>number</code> | how strict the threshold is against the dataset |
| medians | <code>number</code> | intermediary dataset representing the moving medians |
| pointsPerWindow | <code>number</code> | calibration, number of points per processing window. may be increased for larger datasets |
| numWindows | <code>number</code> | calibration metric derived from pointsPerWindow |

<a name="Anomaly"></a>

## Anomaly
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | index in the provided dataset |
| value | <code>number</code> | value of the data point that is detected as an anomaly |

<a name="AnomalyVisual"></a>

## AnomalyVisual : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| toViz | <code>Array.&lt;VisualPoints&gt;</code> | array of points to be displayed in graph in portal |
| anomalies | [<code>Array.&lt;Anomaly&gt;</code>](#Anomaly) | these are datapoints considered to be anomalies |

<a name="self-explanatory"></a>

## self-explanatory ⇒ <code>data</code>
This service retrieves the 10 most recent data points from the Anomalies collection.

**Kind**: global typedef  
**Returns**: <code>data</code> - response  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| CURRENTPAGE | <code>number</code> | the results from the colleciton are all from one page |
| DATA | <code>Array.&lt;Object&gt;</code> | each Object in the array contains: |
| above_threshold | <code>boolean</code> | true if this datapoint is an anomaly |
| anomaly_timestamp | <code>timestamp</code> | when the anomaly was detected |
| item_id | <code>number</code> | uuid |
| sensor_key | <code>string</code> | which sensor this anomaly is from |
| threshold_max | <code>number</code> | if the value is higher than this then its an anomaly |
| threshold_min | <code>number</code> | if the value is lower than this then its an anomaly |
| val | <code>number</code> | the actual value retrieved from the sensor |
