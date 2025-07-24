from pymavlink import mavutil
import time
import math
import json
from threading import Timer
import threading
from parseData import parseData
from Kraken import Kraken

def finishCircle(self, first, speed):
    self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,115,0,first,speed,1,0,0,0,0)


class Hounddrone:
    def __init__(self, radiomode="Kraken", radioaddress = None):
        self.boottime = time.time()
        self.connection = None
        self.alt = 0
        self.lat = 0
        self.lng = 0
        self.hdg = 0
        self.mode = 0
        self.radioaddress = radioaddress
        self.antennas = []
        self.count = 0
        self.radiorate = 6
        self.radiodata = {"data": 0, "hdg": 0, "lat": 0, "lng": 0, "num": 0}
        self.collecting = False
        self.radiomode = radiomode
        self.krakenthread = None
        self.connected = False
        self.thread_stop = False

        #initialize radio
        if (self.radiomode == "Kraken"):
            self.kraken = Kraken()
            self.krakenthread = threading.Thread(target = self.kraken.start)
            self.krakenthread.start()

        
        def onmessage(client, userdata, message):
            try:
                print("Parsed: ", parseData(message))
                self.radiodata = {"data": parseData(message), "hdg": self.hdg, "lat":self.lat, "lng": self.lng}
                #print("RADIODATA RECEIVED", self.radiodata)
            except:
                print("failed to parse radio data")

        def collect():

            print("RADIOMODE", self.radiomode)
            '''
            print("COLLECT")
            if(self.radiomode != "Kraken"):
                if(self.client != 0):
                    #send mqtt request and wait for response
                    payload = {
                        'task_name': 'tasks.legacy.rf.scan.periodogram',
                        'arguments': 
                        {
                            "output_topic":f"radiohound/clients/data/{self.radioaddress}",
                            "fmin":5730e6,
                            "fmax":5734e6,
                            "N_periodogram_points":512,
                            "gain":1,
                            "batch_id":0,# Can be set to link multiple scans together.  Not implemented in GUI yet.  
                        },
                    }   
                    while(1):
                        try:
                            if(self.collecting):
                                self.client.publish(f"radiohound/clients/command/{self.radioaddress}", payload=json.dumps(payload))
                                #self.client.publish(f"radiohound/clients/command/", payload=json.dumps(payload))
                                time.sleep(1/self.radiorate)
                                #print("sent collect request")
                        except:
                            print("Failed to publish to mqtt")
            '''
            if (self.radiomode == "Kraken"):
                while(1):
                    try:
                        if(self.collecting):
                            if("DATA:", self.kraken.gethasdata()):
                                self.kraken.getdata()
                                self.radiodata = {"data": self.kraken.getdata(), "hdg": self.hdg, "lat":self.lat, "lng": self.lng, "num": self.kraken.getcollectnum()}
                    except Exception as error:
                        print("UNABLE TO GET KRAKEN DATA: ", error)
                    time.sleep(1/10)
                            

        '''
        if(self.client):
            self.client.subscribe(f"radiohound/clients/data/{self.radioaddress}")
            #self.client.subscribe(f"radiohound/clients/data/#")
            self.client.on_message = onmessage
            self.client.loop_start()
        '''
        #run radiothread checker
        radiothread = threading.Thread(target = collect)
        radiothread.start()
        

    def monitormavlink(self):
        last_heartbeat_time = time.time()

        while True:
            try:
                msg = self.connection.recv_match(type='HEARTBEAT', blocking=True, timeout=1)
                if msg:
                    last_heartbeat_time = time.time()
                    self.connected = True
                if time.time() - last_heartbeat_time > 5:
                    print("⚠️ MAVLink heartbeat lost — reconnecting...")
                    self.connected = False
                    self.connectmavlink()
                    last_heartbeat_time = time.time()
            except Exception as e:
                print("⚠️ MAVLink monitor error:", e)
                time.sleep(1)
                self.connectmavlink()
    
    def connectmavlink(self):
        while True:
            try:
                print("Attempting MAVLink connection...")
                self.connection = mavutil.mavlink_connection("udp:0.0.0.0:14551", source_system=1, source_component=191)
                self.connection.wait_heartbeat(timeout=3)
                print(f"✅ Connected to MAVLink system {self.connection.target_system}, component {self.connection.target_component}")
                return  # Successful connection
            except:
                print("❌ MAVLink connection failed")
                time.sleep(2)  # Wait and retry

    def sendheartbeat(self):
        #send beats a 1hz
        while(1):
            if(self.thread_stop):
                break
            self.connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
            time.sleep(1)

    def requestMessageStream(self, message, hz):
        rate = 1000000/hz
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL,0,message,rate,0,0,0,0,0)

    def arm(self):
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,400,0,1,0,0,0,0,0,0)

    def disarm(self):
                self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,400,0,0,0,0,0,0,0,0)

    def setmode(self, mode):
        self.mode = mode
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,176,0,1,mode,0,0,0,0,0)  

    def setspeed(self, metersasecond):
            self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component, 178, 0, 1, metersasecond, -2, 0, 0, 0, 0)

    def takeoff(self, alt):
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,22,0,0,0,0,0,0,0,alt)

    def attatch(self, antenna):
        self.antennas.append(antenna)
    
    def goTo(self, lat, lng, alt):
        #print("goTo: ",lat*1E7, lng*1E7)
        self.connection.mav.set_position_target_global_int_send(0,self.connection.target_system, self.connection.target_component, 0,0x0DF8,int(lat*1E7), int(lng*1E7), self.alt,0,0,0,0,0,0,0,0)

    def yawTo(self, angle, speed):
        #print("yawTo: ", angle, speed)
        #self.connection.mav.set_position_target_global_int_send(0,self.connection.target_system, self.connection.target_component, 0,0x09FF ,int(self.lat*1E7), int(self.lng*1E7), self.alt,0,0,0,0,0,0,(angle*math.pi/180),0)
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,115,0,angle,speed,0,0,0,0,0)

    def circle(self, speed):
        first = self.hdg
        ##start cw spin
        target = self.hdg - 10
        if(target < 0):
            target += 360
        self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,115,0,target,speed,1,0,0,0,0)
        #wait async for a few seconds then call the finish circle command
        Timer(2, finishCircle, args = (self, first, speed)).start()
        return
        
    def attatchRadioHound(self, client):
        self.client = client

    def sendText(self, system, component, text):
        text = text.encode('utf-8')
        severity = mavutil.mavlink.MAV_SEVERITY_INFO
        self.connection.mav.statustext_send(severity, text)
    
    def sendData(self):
        #send antenna data
        self.connection.mav.command_int_send(0, 0, 0, 33339, 0, 0, float(self.radiodata["data"]), float(self.radiodata["num"]), float(self.radiodata["hdg"]), float(self.collecting), int(self.lat*1E7), int(self.lng*1E7), 0)

        #send sensor connection data
        self.connection.mav.command_long_send(0,0,33340,0,float(self.kraken.connected), float(self.kraken.freq),0,0,0,0,0)

    def startCollecting(self):
        self.collecting = True
        print("STARTED COLLECTING")
        
    
    def stopCollecting(self):
        self.collecting = False
        print("STOPPED COLLECTING")

    def startStream(self):

        GPI = None

        while(1):
            if(self.thread_stop):
                break
            #constantly get messages and set attributes
            msg = self.connection.recv_match(blocking=True)

            try:
                GPI = self.connection.messages["GLOBAL_POSITION_INT"]
            except:
                print("NO POSITION INFORMATION")
                
            if(GPI):
                self.alt = GPI.alt/1000
                self.lat = GPI.lat*1E-7
                self.lng = GPI.lon*1E-7
                self.hdg = GPI.hdg/100
            

            #if antenna is connected, update its position accordingly
            for antenna in self.antennas:
                #match antenna position and heading
                antenna.lat = self.lat
                antenna.lng = self.lng
                antenna.hdg = self.hdg

    #def land(self, alt):
        #self.connection.mav.command_long_send(self.connection.target_system, self.connection.target_component,22,0,0,0,0,0,0,0,alt)
    
