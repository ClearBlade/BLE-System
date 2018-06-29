from bluepy.btle import *
import struct, time, datetime, json, logging, os, socket, re, sys
from clearblade.ClearBladeCore import System, Query, Developer
from clearblade.ClearBladeCore import cbLogs

scanTimePeriod=20  # 20 seconds to look for new Bluetooth thunderboards
waitTimeBetweenReads=20  # wait and then process data. Let's say 1 second delay is the lowest
NumMotionPoints=100     # read 100 ax and 100 ox then stop

# credentials for connecting to clearblade platform
# `platformURL` - the platform where the system resides, 
# default is communicating to the edge, keep it unchanged. 
# 
# !!!!!! TODO EDIT CREDENTIALS  !!!!
# `systemKey` & `systemSecret` - The key & secret of the system, can be found by going in the 
# about section of the system of the clearblade developer console.
# `username` - the user which is there in the users table
# `password` - respective password for the above username

credentials = {}
credentials['platformURL'] = "http://localhost:9000"
credentials['systemKey'] = "c0abdfb20bd6f3a1bfbdc1cef0d401"
credentials['systemSecret'] = "C0ABDFB20BECBEDDF38FE1B7AA3F"
credentials['username'] = "yaassh28@gmail.com"  # from User table in CB platform
credentials['password'] = "clearblade"        # from User table in CB platform

# these variables control the lights that come on when we read data from the TB
R=0
G=255
B=32
L=255
BRIGHTNESS=5

# setting these determine whether debug statements are printed
# if you want to run this script in the background, set to false
cbLogs.DEBUG = True
cbLogs.MQTT_DEBUG = True

LOGLEVEL="INFO"
mqtt=""
MotionData = dict()    # for PrintMotion
starttime = time.time()   # for timer loop

# this array contains the list of discovered thunderboards.  We need to keep track and
# then have the platform/edge tell the adapter to read or stop
thunderboards = {}
authorized = False

# class used to send and recieve MQTT messages between adapter, edge, and platform
class MQTT:
    def __init__(self, credentials):
        self.systemKey = credentials['systemKey']
        self.systemSecret = credentials['systemSecret']
        self.platformURL = credentials['platformURL']
        self.gatewayAddress = self.GetMacAddress()

        #Connect to MQTT
        cbSystem=System(self.systemKey, self.systemSecret, self.platformURL)

        #authenticate this adapter with the edge
        cbAuth=cbSystem.User(credentials['username'], credentials['password'])

        self.gatewayName = "thunderboard"
        self.client = cbSystem.Messaging(cbAuth)
        self.client.connect()  # the on_connect is not working
        self.client.on_message = self.CommandCallback
        
    def Disconnect(self):
        self.client.disconnect()
        
    def PublishGatewayStatus (self, Online):
        topic = self.gatewayName + "/status"

        messageToPublish = {}
        messageToPublish["gatewayName"] = self.gatewayName 
        messageToPublish["gatewayAddress"] = self.gatewayAddress

        if Online is True:
            messageToPublish["status"] = "Online"
        else:
            messageToPublish["status"] = "Offline"

        self.client.publish(topic, json.dumps(messageToPublish))

    def PublishDeviceOffline (self, deviceId):
        topic = self.gatewayName + "/status/" + deviceId

        messageToPublish = {}
        messageToPublish["gatewayName"] = self.gatewayName 
        messageToPublish["gatewayAddress"] = self.gatewayAddress
        messageToPublish["deviceId"] = deviceId
        messageToPublish["status"] = "Offline"

        self.client.publish(topic, json.dumps(messageToPublish))
        
    def PublishTopic(self, topic, message):
        self.client.publish(topic,message)

    def SubscribeToTopic(self, topic):
        self.client.subscribe(topic)
    
    def PublishError(self, message):
	    topic = self.gatewayName + "/status"

	    messageToPublish = {}
	    messageToPublish["gatewayName"] = self.gatewayName
	    messageToPublish["gatewayAddress"] = self.gatewayAddress
	    messageToPublish["error"] = message

	    self.client.publish(topic, json.dumps(messageToPublish))
 
    # we ask the platform for authorization, this parses the message sent back to us
    def CommandCallback(self, client, obj, message ):
        parsedMessage = json.loads(message.payload)
        deviceAddress = parsedMessage["deviceAddress"]

        if "_edge" in message.topic:  # gw/command/dev/_edge/edge_id
            gw, q, deviceId, e, f = message.topic.split("/") 
        else:
            gw, q, deviceId = message.topic.split("/")

        logging.info("CommandCallback: " + message.payload + " on topic " + message.topic)

	global authorized

        if parsedMessage['status'] == "Authorized":
            logging.info("This should have stopped the first while loop")
	    authorized = True
            thunderboards[deviceAddress]["status"] = "Authorized"
        else:
            thunderboards[deviceAddress]["status"] = "UnAuthorized"

        if authorized:
            if parsedMessage['command'] == "ReadEnv":
                thunderboards[deviceAddress]["command"] = "ReadEnv"
            elif parsedMessage['command'] == "StopEnv":
                thunderboards[deviceAddress]["command"] = "StopEnv"
            elif parsedMessage['command'] == "ReadMotion":
                thunderboards[deviceAddress]["command"] = "ReadMotion"
            elif parsedMessage['command'] == "StopMotion":
                thunderboards[deviceAddress]["command"] = "StopMotion"
        elif parsedMessage['command'] == "disconnect":
            thunderboards[deviceAddress]["command"] = "disconnect"
        else:
            message = "CommandCallback: Unknown command [" + parsedMessage['command'] + "] on topic " + message.topic
            self.PublishError(message)
                     
    def GetMacAddress(self):
        #Execute the hcitool command and extract the mac address using a regular expression
        #mac = re.search('hci0\s*(([0-9a-fA-F]{2}:){5}([0-9a-fA-F]{2}))', os.popen('hcitool -i hci0 dev').read()).group(1)
        # this is a cross-platform way to do it
        from uuid import getnode as get_mac
        mac = get_mac()
        mac = ':'.join(("%012X" % mac)[i:i+2] for i in range(0, 12, 2))
        return mac

# used for Bluetooth scanning
class ScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)

    def handleDiscovery(self, dev, isNewDev, isNewData):
        if isNewDev:
            logging.info("Discovered device %s", dev.addr)
        elif isNewData:
            logging.debug("Received new data from %s", dev.addr)

    def scanProcess(self):
        scanner = Scanner().withDelegate(ScanDelegate())

        try:
            devices = scanner.scan(scanTimePeriod)
        except KeyboardInterrupt:
            if mqtt:
                mqtt.PublishGatewayStatus(False)
                mqtt.Disconnect()
                time.sleep(1)
            os._exit(0)
            raise
        return devices
        
class MotionScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)
        
    def handleNotification(self, cHandle, data):
        PrintMotion(data, cHandle)
            
# make sure this is not in the ScanDelegate class
def PrintMotion (data, handle):
        import struct
        global MotionData

        acc_handle = 78  # from getHandle()
        orient_handle = 81 # from getHandle() 
        x_y_z = struct.unpack('<HHH', data)
        #print "PrintMotion: handle ["+str(handle)+"]"
        if handle == acc_handle :
            t = tuple([(val/100.0) for val in x_y_z])
            #print "axayaz",t
            ax, ay, az = t
            MotionData['ax'] = ax
            MotionData['ay'] = ay
            MotionData['az'] = az           
        elif handle == orient_handle:
            t = tuple([(val/1000.0) for val in x_y_z])
            #print "oxoyoz",t
            ox, oy, oz = t
            MotionData['ox'] = ox
            MotionData['oy'] = oy
            MotionData['oz'] = oz

# this section is for finding, authenticating, and retrieving data from Thunderboards

def sendThunderboardsToPlatform(devices):
    for dev in devices:
        if gotThunderboard(dev) == False:
            for (adtype, desc, value) in dev.getScanData():
                logging.debug("sending device: adtype: " + str(adtype) + " desc: " + desc + " value: " + value)

                if desc == 'Complete Local Name' and 'Thunder Sense #' in value and adtype == 9:
                    try:
                        device = {}
                        device["status"] = "New"
                        device["command"] = "ReadEnv" # default desire by adapter
                        device["deviceAddress"] = dev.addr
                        device["gatewayName"] = mqtt.gatewayName
                        device["deviceType"] = value
                        device["deviceId"] =  str(int(value.split('#')[-1]))
                        device["gatewayAddress"] = mqtt.gatewayAddress
                        device["connectionType"] = "bluetooth"

                        thunderboards[dev.addr] = device
                    except Exception as e:
                        logging.info("EXCEPTION:: %s", str(e))
                        mqtt.PublishError("sending device: exception: " + str(e))

    for tb in thunderboards:
        topic = mqtt.gatewayName + "/command/" + thunderboards[tb]["deviceId"] + "/_edge/ThunderNXP"
        mqtt.SubscribeToTopic(topic)
        topic = mqtt.gatewayName + "/status/" + thunderboards[tb]["deviceId"] + "/_platform"
        mqtt.PublishTopic(topic, json.dumps(thunderboards[tb]))
        topic = mqtt.gatewayName + "/list/_platform"
        mqtt.PublishTopic(topic, json.dumps(thunderboards[tb]["deviceId"]))

def processDeviceList(devices):
    for dev in devices:
        for tb in thunderboards:   
            if dev.addr == thunderboards[tb]['deviceAddress']:
                if thunderboards[tb]['status'] == "Authorized" and thunderboards[tb]['command'] == "ReadEnv":
                    global starttime
                    rightnow = time.time()
                    if ( rightnow > starttime + waitTimeBetweenReads ):
                        processEnv(dev)
                        starttime = time.time()  # reset timer
                elif thunderboards[tb]['status'] == "New" and thunderboards[tb]['command'] == "ReadEnv":
		            logging.debug("processDeviceList: device [" + thunderboards[tb]['deviceId'] + "] not yet Authorized")
                
                if thunderboards[tb]['status'] == "Authorized" and thunderboards[tb]['command'] == "ReadMotion":
                    processMotion(dev)
                    
def processMotion(dev):
    print "processDeviceMotion: starting"

    acc_uuid = "c4c1f6e2-4be5-11e5-885dfeff819cdc9f"  #accelerometer
    orient_uuid = 'b7c4b694-bee3-45dd-ba9ff3b5e994f49a'

    if gotThunderboard(dev) or isThunderboard(dev):
        try:
            tbDevice=Peripheral()
            tbDevice.setDelegate(MotionScanDelegate())
            tbDevice.connect(dev.addr, dev.addrType)

            logging.debug("processDeviceMotion: connected to device.")
            
            # handle for accelerometer
            setup_data = b"\x01\x00"
            notify = tbDevice.getCharacteristics(uuid=acc_uuid)[0]
            notify_handle = notify.getHandle() + 1
            tbDevice.writeCharacteristic(notify_handle, setup_data, withResponse=True)

            # handle for orient
            notify = tbDevice.getCharacteristics(uuid=orient_uuid)[0]
            notify_handle = notify.getHandle() + 1
            tbDevice.writeCharacteristic(notify_handle, setup_data, withResponse=True)

            logging.debug("processDeviceMotion: writing done")
            time.sleep(1) # to let the notifications get cracking


            for ctr in Range(NumMotionPoints):
                global MotionData
                if tbDevice.waitForNotifications(1.0):
                    # a notification came in from the tboard, search the global array 
                    if 'ox' in MotionData and 'ax' in MotionData:
                        topic = thunderboards[dev.addr]['gatewayName'] + "/motion/" + thunderboards[dev.addr]['deviceId']
                        mqtt.PublishTopic(topic, json.dumps(MotionData))
                        logging.debug("published motion data message")
                        MotionData = dict() # reset for the rest

        except KeyboardInterrupt:
            exitapp = True
            os._exit(0)
            raise
        except Exception as e:
            logging.info("EXCEPTION:: %s", str(e))
            mqtt.PublishError("processDeviceMotion: exception: " + str(e))
        finally:
            tbDevice.disconnect()
        
def isThunderboard(dev):
    for (adtype, desc, value) in dev.getScanData():
        if desc == 'Complete Local Name':
            if 'Thunder Sense #' in value and adtype==9:
                return True
    return False

def gotThunderboard(dev):
    for tb in thunderboards:   
        if dev.addr == thunderboards[tb]['deviceAddress']:  
            return True
    return False
    
def processEnv(dev):
    if gotThunderboard(dev) or isThunderboard(dev):
        try:
            tbdata = dict()
            tbDevice = Peripheral()
            tbDevice.connect(dev.addr, dev.addrType)
            characteristics = tbDevice.getCharacteristics()
            
            for k in characteristics:
                logging.debug("characteristic value: %s", k.uuid)

                if k.uuid == '2a6e':
                    value = k.read()
                    value = struct.unpack('<H', value)
                    value = value[0] / 100
                    tbdata['temperature'] = value
                                        
                elif k.uuid == '2a6f':
                    value = k.read()
                    value = struct.unpack('<H', value)
                    value = value[0] / 100
                    tbdata['humidity'] = value
                                        
                elif k.uuid == '2a76':
                    value = k.read()
                    value = ord(value)
                    tbdata['uv'] = value
                                        
                elif k.uuid == '2a6d':
                    value = k.read()
                    value = struct.unpack('<L', value)
                    value = value[0] / 1000
                    tbdata['pressure'] = value
                                        
                elif k.uuid == 'c8546913-bfd9-45eb-8dde-9f8754f4a32e':
                    value = k.read()
                    value = struct.unpack('<L', value)
                    value = value[0] / 100
                    tbdata['light'] = value
                                        
                elif k.uuid == 'c8546913-bf02-45eb-8dde-9f8754f4a32e':
                    value = k.read()
                    value = struct.unpack('<h', value)
                    value = value[0] / 100
                    tbdata['sound'] = value
                                        
                elif k.uuid == 'efd658ae-c401-ef33-76e7-91b00019103b':
                    value = k.read()
                    value = struct.unpack('<h', value)
                    value = value[0]
                    tbdata['co2'] = value
                                        
                elif k.uuid == 'efd658ae-c402-ef33-76e7-91b00019103b':
                    value = k.read()
                    value = struct.unpack('<h', value)
                    value = value[0]
                    tbdata['voc'] = value
                                        
                elif k.uuid == 'ec61a454-ed01-a5e8-b8f9-de9ec026ec51':
                    value = k.read()
                    value = ord(value)
                    tbdata['battery'] = value

                elif k.uuid == 'fcb89c40-c603-59f3-7dc3-5ece444a401b':
                    s = chr(L)+chr(R*BRIGHTNESS//100)+chr(G*BRIGHTNESS//100)+chr(B*BRIGHTNESS//100)
                    k.write(s, True)

            topic = thunderboards[dev.addr]['gatewayName'] + "/environment/" \
                + thunderboards[dev.addr]['deviceId'] + "/_platform"
            logging.debug("publishing environment data")
            logging.debug(json.dumps(tbdata))
            mqtt.PublishTopic(topic, json.dumps(tbdata))

        except KeyboardInterrupt:
            exitapp = True
            os._exit(0)
            raise
        except Exception as e:
            logging.info("EXEPTION:: %s", str(e))
            mqtt.PublishError("processDevice: exception: " + str(e))
        finally:
            tbDevice.disconnect()

def CleanUp():
    for tb in thunderboards:   
        mqtt.PublishDeviceOffline(thunderboards[tb]['deviceId'])

    mqtt.PublishGatewayStatus(False)
    mqtt.Disconnect()
    os._exit(0)
    
def setup_custom_logger(name):
    formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s',datefmt='%m-%d-%Y %H:%M:%S %p')
    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(formatter)
    logger = logging.getLogger(name)
    logging.basicConfig(level=os.environ.get("LOGLEVEL", LOGLEVEL))
    logger.addHandler(handler)
    return logger

# Main
if __name__ == '__main__':
    logger = setup_custom_logger('scanner adapter')

    scanner = ScanDelegate()
    exitapp = False
    mqtt = MQTT(credentials)
    time.sleep(5)   # to make sure we connect okay
    mqtt.PublishGatewayStatus(True)
    start = time.time()  # start the clock for environmental polling

    # two stages, showing devices to choose, and reading data from device
    while True:
        logging.info('Scan Cycle Complete: %s', datetime.datetime.now().strftime('%m-%d-%Y %H:%M:%S'))
        logging.info("Scan Period: %s seconds", scanTimePeriod)
        devices = scanner.scanProcess()
        sendThunderboardsToPlatform(devices)
	if authorized:
	    break	    

    logging.info("onto phase 2!")	

    while not exitapp:
        try:
            processDeviceList(devices)
        except KeyboardInterrupt:
            exitapp = True
            mqtt.PublishGatewayStatus(False)
            mqtt.Disconnect()
            os._exit(0)
            raise
        except Exception as e:
            logging.info ("EXCEPTION:: %s", str(e))
            mqtt.PublishError("main: exception: " + str(e))
        