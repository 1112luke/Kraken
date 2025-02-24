#forward data from web interface to mqtt
from flask import Flask, request
from  flask_cors import CORS
import paho.mqtt.client as mqtt
import logging
import json
import threading
import time
from pymavlink import mavutil

counter = 0

#client = mqtt.Client()                           # Create MQTT object
#client.connect('radiohound.ee.nd.edu', 1883, 60) # Requires firewall access
#client.subscribe("drone/data")

# Start a connection listening on a UDP port
the_connection = mavutil.mavlink_connection('udp:localhost:14553', source_system=3, source_component=3)

# Wait for the first heartbeat
# This sets the system and component ID of remote system for the link
the_connection.wait_heartbeat()

the_connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
print("Heartbeat from system (system %u component %u)" % (the_connection.target_system, the_connection.target_component))


def sendheartbeat():
        #send beats a 1hz
        while(1):
            the_connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
            time.sleep(1)

def connectcountdown():
    #decrement counter for connection status of raspberry pi
    global counter
    while(1):
        #print(counter)
        if counter == 0:
            dronedata["program"]["connected"] = 0
        else:
            dronedata["program"]["connected"] = 1
            counter-=1
        time.sleep(0.01)

#holds drone data to be sent from program to drone. Currently the python program sends at 10 hz and the frontend requests at 10 hz and I just hope they kinda matchup. No communication of the datarate is implemented.
dronedata = {"drone": {"alt": 0, "lng":0,"lat":0, "hdg": 0,},
        "antenna": {"lng":0, "lat":0, "hdg": 0, "ang": 0, "gain": 0, "toradio": 0, "reading": 0},
        "program": {"status":"", "connected": 0},
        "circledata": {"circle": None, "maxlines": None},
        "sweepdata": {"sweep": None, "target": None}}

def getData():
    global dronedata
    global alt
    global counter

    GPI = None

    while(1):
        #constantly get messages and set attributes
            msg = the_connection.recv_match(blocking=True)
            try:
                GPI = the_connection.messages["GLOBAL_POSITION_INT"]
            except:
                print("NO POSITION INFORMATION")
                
            if(msg.get_type() == "GLOBAL_POSITION_INT"):
                dronedata["drone"]["alt"] = GPI.alt/1000
                dronedata["drone"]["lat"] = GPI.lat*1E-7
                dronedata["drone"]["lng"] = GPI.lon*1E-7
                dronedata["drone"]["hdg"] = GPI.hdg/100
                #print(GPI.lat*1E-7)
                #print(GPI.lon*1E-7)

            if(msg.get_type() == "COMMAND_LONG"):
                #print(msg.command)
                if(msg.command == 33339):
                    print("antenna")
                    dronedata["antenna"]["reading"] = msg.param1
            if msg.get_type() == "HEARTBEAT":
                if(msg.get_srcComponent() == 191):
                    counter = 300
                


'''
#mqtt -> frontend
def onmessage(client, userdata, message):
    global dronedata
    dronedata = message.payload.decode("utf-8")
client.on_message = onmessage
'''


def Server():
    app = Flask(__name__)
    app.logger.setLevel(logging.ERROR)
    logging.getLogger('werkzeug').disabled = True
    CORS(app)
    
    #radio > frontent
    @app.route('/data')
    def getDrone():
        global dronedata
        return dronedata
       
    #frontend -> telemetry/mqtt

    @app.route("/command", methods = ['POST'])
    def doCommand():
        #global client
        data = request.get_json()
        payload = {
            "command": data.get("command"),
            "value": data.get("value")
        }

        text = json.dumps(payload)
        text=text.encode('utf-8')

        print("sentexec")

        #send mavlink
        param1 = 0
        param2 = 0
        param3 = 0
        param4 = 0
        param5 = 0
        param6 = 0
        param7 = 0

        command = payload["command"]

        if command == "setradiopos":
            cmdnum = 33333
            param1 = json.loads(payload["value"]).get("lat")
            param2 = json.loads(payload["value"]).get("lng")
        elif command == "setmode":
            cmdnum = 33334
            match payload["value"]:
                case "none":
                    param1 = 1
                case "locationfollow":
                    param2 = 1
                case "radiofollow":
                    param3 = 1
                case "eyeofender":
                    param4 = 1
                case "debug":
                    param5 = 1
        
        elif command == "follow":
            cmdnum = 33336
            if payload["value"]:
                param1 = 1
            else:
                param2 = 1
        
        elif command == "setrotationspeed":
            cmdnum = 33336
            param3 = payload["value"]

        elif command == "setdatarate":
            cmdnum = 33336
            param4 = payload["value"]

        elif command == "setsweepwidth":
            cmdnum = 33336
            param5 = payload["value"]

        elif command == "circle":
            cmdnum = 33337
            param1 = 1

        elif command == "clearlines":
            cmdnum = 33337
            param2 = 1

        elif command == "setcollecting":
            cmdnum = 33338
            if payload["value"]:
                param1 = 1
            else:
                param2 = 1


        #send message
        the_connection.mav.command_long_send(1, 191, cmdnum, 0, float(param1), float(param2), float(param3), float(param4), float(param5), float(param6), float(param7))


        #send mqtt
        #client.publish("drone/command", payload=json.dumps(payload))
        return "amazing"

    

    if(__name__ == "__main__"):
        app.run(port = 3003)


t1 = threading.Thread(target = Server)
t2 = threading.Thread(target = getData)
t3 = threading.Thread(target = sendheartbeat)
t4 = threading.Thread(target = connectcountdown)

t1.start()
t2.start()
t3.start()
t4.start()
#client.loop_forever()







'''
command table

------Outgoing------
33333: radio position
    param1: lat
    param2: lng

33334 & 33335: setmode => 7 per, 14 total starting with 33334 param1
    param1: none
    param2: locationfollow
    param3: radiofollow
    param4: eyeofender
    param5: debug

33336: radiofollow commands
    param1: follow
    param2: stopfollow
    param3: rotationspeed
    param4: datarate
    param5: sweepwidth

33337: eyeofender commands
    param1: circle
    param2: clearlines
    param3: rotationspeed
    param4: datarate

33338: debug commands
    param1: collect
    param2: stop collect


------Incoming------
33339: antenna power data
    param1: flaot

'''