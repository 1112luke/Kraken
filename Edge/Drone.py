from threading import Thread
from pymavlink import mavutil
from Hounddrone import Hounddrone
from flask import Flask, request
from  flask_cors import CORS
from Radios import RadioScene
import json
import logging
import math
import time

#mqtt
import paho.mqtt.client as mqtt

#configure connections
mavlink_router = True

'''
#create comm client
client = mqtt.Client() 
print("CLIENT1 CONNECTING...")                                                # Create MQTT object
client.connect('radiohound.ee.nd.edu', 1883, 60) # Requires firewall access
print("CLIENT1 CONNECTED") 
'''

#create radio client
client2 = mqtt.Client()
print("CLIENT2 CONNECTING...")  

#usb mqtt connection
#TODo -- make this go second and tell program it is connected to mavlink and then to radio, program won't run without radio though
while(1):
    try:
        client2.connect('192.168.6.2', 1883, 60)
        print("RADIOHOUND CONNECTED")
        break
    except:
        break
        print("RADIOHOUND CONNECTING...")


# Start a connection listening on a UDP port
print("MAKING MAVLINK CONNECTION...")
#the_connection = mavutil.mavlink_connection("udp:localhost:14551", source_system=1, source_component=191)

if(mavlink_router):
    the_connection = mavutil.mavlink_connection("udp:0.0.0.0:14551", source_system=1, source_component=191)
else:
    the_connection = mavutil.mavlink_connection("/dev/ttyAMA0", baud=921600, source_system=1, source_component=191)


# Wait for the first heartbeat
#   This sets the system and component ID of remote system for the link
the_connection.wait_heartbeat()

the_connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
print("Heartbeat from system (system %u component %u)" % (the_connection.target_system, the_connection.target_component))

#create object for simple commands
Drone = Hounddrone(the_connection, client2, "e415f6f662e5")

#prompt drone what messages to stream and how fast
#global_position_int
Drone.requestMessageStream(33, 10)

time.sleep(1) #sleep to allow drone to start producing relevant data

#configure radio simulation
scene = RadioScene()

radio = scene.addRadio(10)

antenna = scene.addAntenna(180,0,10)

Drone.attatch(antenna)

#define modes
#none, locationfollow, radiofollow, eyeofender
mode = "none"
status = "none"

lastmode = mode

#for eye of ender
circledata = []
sweepdata = []
maxlines = []
ROTATIONSPEED = 50
MOVEMENTSPEED = 0
DATARATE = 20
RADIOSOURCE = "simulation" #simulation or real

#for radiofollow
radiodirection = 0
sweepdir = 0 #1 for right, 2 for left
sweepwidth = 160 #sweepwidth in degrees


def main():
    global lastmode
    global status
    global circledata
    global maxlines
    global radiodirection
    global sweepdirection
    global sweepwidth
    global sweepdir
    global sweepdata
    global ROTATIONSPEED
    global DATARATE

    while(1):

        #check for change of mode
        if(lastmode != mode):
            #mode changed
            #loiter mode
            Drone.setmode(5)
        lastmode = mode

        #select main mode
        if(mode == "none"):
            status = "none"
            pass
        #location follow
        elif(mode == "locationfollow"):
            if(Drone.mode != 4):
                Drone.setmode(4)
            status = "tracking"
            time.sleep(0.5)
            Drone.goTo(radio.lat, radio.lng, Drone.alt)

        #radiofollow
        elif(mode == "radiofollow"):
            if(Drone.mode != 4):
                Drone.setmode(4)
                

            if(status == "initsearch"):
                circledata = []
                sweepdata = []
                radiodirection = 0
                sweepdir = 0


                #start collecting
                Drone.stopCollecting()
                Drone.startCollecting()

                lastradiodata = Drone.radiodata.get("data")

                #start circling
                initial,lastheading = Drone.hdg, Drone.hdg
                status = "searching"
                Drone.circle(ROTATIONSPEED)
            
            if(status == "searching"):
                #similar to circle from eyeofender
                #get data depending of DATARATE
                if(angleTo(Drone.hdg, lastheading, 1) > ROTATIONSPEED/DATARATE):
                    lastheading = Drone.hdg

                    if(RADIOSOURCE == "simulation"):
                        circledata.append({"data": Drone.antennas[0].getData(), "hdg": Drone.hdg, "lat": Drone.lat, "lng": Drone.lng})

                    elif(RADIOSOURCE == "real"):
                        lastradiodata = Drone.radiodata.get("data")
                        circledata.append({"data": Drone.radiodata.get("data"), "hdg": Drone.radiodata.get("hdg"), "lat": Drone.radiodata.get("lat"), "lng": Drone.radiodata.get("lng")})

                #wait for circle to finish
                #might be issue with this triggering inadvertantly/not triggering
                if(angleTo(Drone.hdg, initial, 0) < -1 and angleTo(Drone.hdg, initial, 0) > -10):

                    Drone.stopCollecting()

                    #check for maximum line
                    maxline = {"data": -100000000}
                    for line in circledata:
                        if(line.get("data") > maxline.get("data")):
                            maxline = line
                            
                    #set intended direction for the direction of that line and initialize tracking
                    radiodirection = maxline.get("hdg")
                    lat = Drone.lat + math.cos(math.radians(radiodirection))
                    lng = Drone.lng + math.sin(math.radians(radiodirection))
                    Drone.goTo(lat, lng, Drone.alt)
                    status = "tracking"
                    circledata = []

            #tracking
            if(status == "tracking"):
                
                #handle sweeping and data collection
                if(sweepdir == 0):
                    #not sweeping, initialize sweep to right

                    #start drone data collection
                    Drone.startCollecting()

                    #normalize dir
                    dir = radiodirection + sweepwidth/2
                    if(dir > 360):
                        dir -=360
                    if(dir < 0):
                        dir += 360
                    Drone.yawTo(dir, ROTATIONSPEED)
                    sweepdir = 1

                if(sweepdir == 1):
                    #check if sweep is done
                    if(angleTo(Drone.hdg, radiodirection + sweepwidth/2, 1) < 4):
                        
                        #reset collecting in case datarate has changed
                        #Drone.stopCollecting()
                        #Drone.startCollecting()
                        

                        #get max line and change radio direction if drone has collected data (drone might not if it yaws around the opposite direction)
                        if(len(sweepdata) > 0):
                            maxline = {"data": -100000000}

                            for line in sweepdata:
                                if(line.get("data") > maxline.get("data")):
                                    maxline = line

                            radiodirection = maxline.get("hdg")

                        lat = Drone.lat + math.cos(math.radians(radiodirection))
                        lng = Drone.lng + math.sin(math.radians(radiodirection))
                        Drone.goTo(lat, lng, Drone.alt)
                        sweepdata = []
                        #initialize sweep to left
                        #normalize dir
                        dir = radiodirection - sweepwidth/2
                        if(dir > 360):
                            dir -=360
                        if(dir < 0):
                            dir += 360
                        Drone.yawTo(dir, ROTATIONSPEED)
                        sweepdir = -1
                
                if(sweepdir == -1):
                    #check if sweep is done
                    if(angleTo(Drone.hdg, radiodirection - sweepwidth/2, 1) < 4):

                        #reset collecting in case datarate has changed
                        #Drone.stopCollecting()
                        #Drone.startCollecting()

                        #get max line and change radio direction if drone has collected data (drone might not if it yaws around the opposite direction)
                        if(len(sweepdata) > 0):
                            maxline = {"data": -10000000000}

                            for line in sweepdata:
                                if(line.get("data") > maxline.get("data")):
                                    maxline = line

                            radiodirection = maxline.get("hdg")

                        radiodirection = maxline.get("hdg")
                        lat = Drone.lat + math.cos(math.radians(radiodirection))
                        lng = Drone.lng + math.sin(math.radians(radiodirection))
                        Drone.goTo(lat, lng, Drone.alt)
                        sweepdata = []
                        #initialize sweep to left
                        #normalize dir
                        dir = radiodirection + sweepwidth/2
                        if(dir > 360):
                            dir -=360
                        if(dir < 0):
                            dir += 360
                        Drone.yawTo(dir, ROTATIONSPEED)
                        sweepdir = 1

                #collect data if sweeping
                if(sweepdir == 1 or sweepdir == -1 and angleTo(Drone.hdg, radiodirection, 1) < sweepwidth/2):
                    #sweeping to right, collect data and wait for it to finish
                    if(angleTo(Drone.hdg, lastheading, 1) > ROTATIONSPEED/DATARATE):
                        lastheading = Drone.hdg

                        if(RADIOSOURCE == "simulation"):
                            sweepdata.append({"data": Drone.antennas[0].getData(), "hdg": Drone.hdg, "lat": Drone.lat, "lng": Drone.lng})
                        
                        elif(Drone.radiodata != lastradiodata):
                            lastradiodata = Drone.radiodata.get("data")
                            sweepdata.append({"data": Drone.radiodata.get("data"), "hdg": Drone.radiodata.get("hdg"), "lat": Drone.radiodata.get("lat"), "lng": Drone.radiodata.get("lng")})

                        
            pass

        elif(mode == "eyeofender"):
            if(Drone.mode != 4):
                Drone.setmode(4)
            
            if(status == "none"):
                pass

            if(status == "initcircle"):
                #create new data array
                circledata = []
                if(Drone.mode != 4):
                    Drone.setmode(4)

                #get data depending of DATARATE
                Drone.startCollecting()

                #start circling
                initial,lastheading = Drone.hdg, Drone.hdg
                lastradiodata = Drone.radiodata.get("data")
                status = "circling"
                Drone.circle(ROTATIONSPEED)

            if(status == "circling"):
                #collect data
                if(angleTo(Drone.hdg, lastheading, 1) > ROTATIONSPEED/DATARATE):
                    lastheading = Drone.hdg

                    if(RADIOSOURCE == "simulation"):
                        circledata.append({"data": Drone.antennas[0].getData(), "hdg": Drone.hdg, "lat": Drone.lat, "lng": Drone.lng})

                    elif(RADIOSOURCE == "real"):
                        lastradiodata = Drone.radiodata.get("data")
                        circledata.append({"data": Drone.radiodata.get("data"), "hdg": Drone.radiodata.get("hdg"), "lat": Drone.radiodata.get("lat"), "lng": Drone.radiodata.get("lng")})

                #wait for circle to finish
                if(angleTo(Drone.hdg, initial, 0) < -1 and angleTo(Drone.hdg, initial, 0) > -6):
                    status = "done"
                    Drone.stopCollecting()
                    
                    #check for maximum line
                    maxline = {"data": -10000000000}
                    for line in circledata:
                        if(line.get("data") > maxline.get("data")):
                            maxline = line
                    maxlines.append(maxline)          
                pass
            

def angleTo(a1, a2, flag):
    out = (((a1 - a2) + 180) % 360 - 180)
    if(flag):
        return abs(out)
    else:
        return out

#mqtt communication handling
'''
client.subscribe("drone/command")

def onmessage(client, userdata, message):
    global status
    global mode
    global circledata
    global maxlines
    global sweepwidth
    global sweepdata
    global ROTATIONSPEED
    global DATARATE

    msg = json.loads(message.payload)

    if(msg.get("message") == "circle"):
        status = "initcircle"
    if(msg.get("message") == "clearlines"):
        circledata, maxlines, sweepdata = [], [], []
    if(msg.get("message") == "setrotationspeed"):
        ROTATIONSPEED = int(msg.get("value"))
    if(msg.get("message") == "setdatarate"):
        Drone.radiorate = int(msg.get("value"))
        DATARATE = int(msg.get("value"))
    if(msg.get("message") == "setsweepwidth"):
        sweepwidth = int(msg.get("value"))
    if(msg.get("message") == "follow"):
        status = "initsearch"
    if(msg.get("message") == "setmode"):
        mode = msg.get("value")
    if(msg.get("message") == "stopfollow"):
        Drone.setmode(5)
        Drone.stopCollecting()
        status = "none"
        sweepdata = []
    if(msg.get("message") == "setradiopos"):
        data = json.loads(msg.get("value"))
        radio.lat = data.get("lat")
        radio.lng = data.get("lng")
        return "amazing"


client.on_message = onmessage

def sendData():
    rate = 10
    while(1):
        data = {"drone": {"alt": Drone.alt, "lng":Drone.lng,"lat":Drone.lat, "hdg": Drone.hdg},
        "antenna": {"lng":antenna.lng, "lat":antenna.lat, "hdg": antenna.hdg, "ang": antenna.angle, "gain": antenna.gain, "toradio": antenna.toradio, "reading": antenna.getData()},
        "program": {"status":status},
        "circledata": {"circle": circledata, "maxlines": maxlines},
        "sweepdata": {"sweep": sweepdata, "target": radiodirection}}

        client.publish("drone/data", payload = json.dumps(data))

        time.sleep(1/rate)
'''

def sendData():
    rate = 3
    while(1):

        #send data
        '''
        33333  data = {"drone": {"alt": Drone.alt, "lng":Drone.lng,"lat":Drone.lat, "hdg": Drone.hdg},
        33334 "antenna": {"lng":antenna.lng, "lat":antenna.lat, "hdg": antenna.hdg, "ang": antenna.angle, "gain": antenna.gain, "toradio": antenna.toradio, "reading": antenna.getData()},
        33335 "program": {"status":status},
        33336 "circledata": {"circle": circledata, "maxlines": maxlines},
        33337 "sweepdata": {"sweep": sweepdata, "target": radiodirection}}
        '''

        #send status data
        Drone.sendText(0,0,f'status:{status}')

        Drone.sendData("antenna", Drone.radiodata)

        time.sleep(1/rate)
    


#Mavlink Message Handling
def receiveData():
    global status
    global mode
    global circledata
    global maxlines
    global sweepwidth
    global sweepdata
    global ROTATIONSPEED
    global DATARATE

    while(1):
        msg = Drone.connection.recv_match(blocking=True)

        if msg and msg.get_type() == 'STATUSTEXT' and msg.get_srcSystem() == 3:
            msg = msg.text
            try:
                msg = json.loads(msg)
            except:
                print(f"Message Failed: {msg}")
                continue

            #if(msg.get("message") == "circle"):
            #    status = "initcircle"
            #if(msg.get("message") == "clearlines"):
            #    circledata, maxlines, sweepdata = [], [], []
            if(msg.get("message") == "setrotationspeed"):
                ROTATIONSPEED = int(msg.get("value"))
            if(msg.get("message") == "setdatarate"):
                Drone.radiorate = int(msg.get("value"))
                DATARATE = int(msg.get("value"))
            if(msg.get("message") == "setsweepwidth"):
                sweepwidth = int(msg.get("value"))
            #if(msg.get("message") == "follow"):
                #status = "initsearch"
            #if(msg.get("message") == "setmode"):
                #print(msg.get("value"))
                #mode = msg.get("value")
            #if(msg.get("message") == "setcollecting"):
            #    if(int(msg.get("value"))):
            #        Drone.startCollecting()
            #        #print("Start Collecting")
            #    else:
            #        Drone.stopCollecting()
            #        #print("Stop Collecting")
            #if(msg.get("message") == "stopfollow"):
            #    Drone.setmode(5)
            #    Drone.stopCollecting()
            #    status = "none"
            #    sweepdata = []
                
        elif msg.get_type() == "COMMAND_LONG":
            #setradiopos
            if msg.command == 33333:
                #print("got position")
                radio.lat = msg.param1
                radio.lng = msg.param2
            elif msg.command == 33334:
                if msg.param1:
                    print("none")
                    mode = "none"
                elif msg.param2:
                    mode = "locationfollow"
                elif msg.param3:
                    mode = "radiofollow"
                elif msg.param4:
                    mode = "eyeofender"
                elif msg.param5:
                    mode = "debug"
            elif msg.command == 33336:
                if msg.param1:
                    status = "initsearch"
                elif msg.param2:
                    Drone.setmode(5)
                    Drone.stopCollecting()
                    status = "none"
                    sweepdata = []
                elif msg.param3:
                    ROTATIONSPEED = msg.param3
                    print("ROTATE:", ROTATIONSPEED)
                elif msg.param4:
                    DATARATE = msg.param4
                    print("Data:", DATARATE)
                elif msg.param5:
                    sweepwidth = msg.param5
                    print("Sweep: ", sweepwidth)
            elif msg.command == 33337:
                if msg.param1:
                    status = "initcircle"
                elif msg.param2:
                    circledata, maxlines, sweepdata = [], [], []
            elif msg.command == 33338:
                if msg.param1:
                    Drone.startCollecting()
                elif msg.param2:
                    Drone.stopCollecting()



            elif msg.command == 33338:
                if param1:
                    Drone.startCollecting()
                elif param2:
                    Drone.stopCollecting()
    return "amazing" 
                


#start async processes
t1 = Thread(target = Drone.startStream)
t2 = Thread(target = main)
t3 = Thread(target = sendData)
t4 = Thread(target = receiveData)
t5 = Thread(target = Drone.sendheartbeat)
#t3 = Thread(target = Server)

t1.start()
t2.start()
t3.start()
t4.start()
t5.start()
#start comm client
#client.loop_forever()





