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

#create drone object
Drone = Hounddrone(radiomode="Kraken", radioaddress="e415f6f662e5") 

#initialize connection
monitorthread = Thread(target = Drone.monitormavlink)
Drone.connectmavlink()
monitorthread.start()

#prompt flight controller what messages to stream and how fast
#global_position_int -- tell FC to stream position
Drone.requestMessageStream(33, 10)

time.sleep(1) #sleep to allow drone to start producing relevant data

#--------------Main Code for Drone Control---------------

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
RADIOPOS = {"lat": 0, "lng": 0}

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
    global RADIOSOURCE
    global DATARATE

    while(1):
        if(Drone.thread_stop):
            break
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
                
            #first mode to be called for radiofollow
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

                #first status to initiate
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
        time.sleep(1/100)
        #run at 100 fps

#get angle between two angles
def angleTo(a1, a2, flag):
    out = (((a1 - a2) + 180) % 360 - 180)
    if(flag):
        return abs(out)
    else:
        return out

#--------------Communication Handling---------------

def sendData(): #send data from drone to groundstation
    rate = 10
    while(1):
        if(Drone.thread_stop):
            break
        #send data
        '''
        33333  data = {"drone": {"alt": Drone.alt, "lng":Drone.lng,"lat":Drone.lat, "hdg": Drone.hdg},
        33334 "antenna": {"lng":antenna.lng, "lat":antenna.lat, "hdg": antenna.hdg, "ang": antenna.angle, "gain": antenna.gain, "toradio": antenna.toradio, "reading": antenna.getData()},
        33335 "program": {"status":status},
        33336 "circledata": {"circle": circledata, "maxlines": maxlines},
        33337 "sweepdata": {"sweep": sweepdata, "target": radiodirection}}
        '''

        try:
            #send status data
            Drone.sendText(0,0,f'status:{status}')
            Drone.sendData()
        except e as Exception:
            print("drone unable to senddata: ", e)

        time.sleep(1/rate)
    


#Mavlink Incoming Message Handling from Groundstation
def receiveData():

    global status
    global mode
    global circledata
    global maxlines
    global sweepwidth
    global sweepdata
    global ROTATIONSPEED
    global RADIOSOURCE
    global DATARATE

    while(1):
        if(Drone.thread_stop):
            break
        try:    
            msg = Drone.connection.recv_match(blocking=True, timeout = 1)
        except:
            print("drone unable to reveive data")

        if not msg:
            continue

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
                
        #if commamnd long message
        elif msg.get_type() == "COMMAND_LONG":
            
            #setradiopos
            if msg.command == 33333:
                print("got position")
                Drone.fakeradiopos["lat"] = msg.param1
                Drone.fakeradiopos["lng"] = msg.param2
            '''
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
                elif msg.param6:
                    Drone.setspeed(msg.param6)
            elif msg.command == 33337:
                if msg.param1:
                    status = "initcircle"
                elif msg.param2:
                    circledata, maxlines, sweepdata = [], [], []
            '''
            if msg.command == 33338:
                if msg.param1:
                    Drone.startCollecting()
                elif msg.param2:
                    Drone.stopCollecting()
                elif msg.param3:
                    print("real")
                    RADIOSOURCE = "real"
                elif msg.param4:
                    print("simulation")
                    RADIOSOURCE = "simulation"
                elif msg.param5:
                    print("Connecting Sensor")
                    Drone.kraken.start()
                elif msg.param6:
                    print("setfreq?:", msg.param6)
            elif msg.command == 33341:
                Drone.kraken.setfreq(int(msg.param1))
    return "amazing" 


Threads_started = False
threads = {}

def threadmonitor():
    global Threads_started, threads

    while True:
        try:
            print(f"[MONITOR] Drone connected: {Drone.connected}, Threads started: {Threads_started}")
            
            if Drone.connected and not Threads_started:
                Drone.thread_stop = False
                Threads_started = True

                threads['stream'] = Thread(target=Drone.startStream, name="startStream")
                threads['main'] = Thread(target=main, name="main")
                threads['send'] = Thread(target=sendData, name="sendData")
                threads['recv'] = Thread(target=receiveData, name="receiveData")
                threads['heartbeat'] = Thread(target=Drone.sendheartbeat, name="sendHeartbeat")

                for name, t in threads.items():
                    print(f"[MONITOR] Starting thread: {name}")
                    t.daemon = True
                    t.start()

            elif not Drone.connected and Threads_started:
                print("[MONITOR] Drone disconnected, stopping threads...")
                Drone.thread_stop = True

                for name, t in threads.items():
                    print(f"[MONITOR] Joining thread: {name}")
                    if t.is_alive():
                        t.join(timeout=3)  # Optionally add timeout
                threads.clear()
                Threads_started = False

        except Exception as e:
            print(f"[MONITOR] Exception: {e}")

        time.sleep(1)




t6 = Thread(target = threadmonitor)
t6.start()





