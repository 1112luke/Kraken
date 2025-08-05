# forward data from web interface to mqtt
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import threading
import time
from Dronedata import DroneData
from pymavlink import mavutil

counter = 0
print("Beginning Handoff.py...")

# Connect to MAVLink via UDP
the_connection = mavutil.mavlink_connection('udp:0.0.0.0:14553', source_system=3, source_component=3)
the_connection.wait_heartbeat()
the_connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
print("Heartbeat from system (system %u component %u)" % (the_connection.target_system, the_connection.target_component))

def sendheartbeat():
    while True:
        the_connection.mav.heartbeat_send(mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER, mavutil.mavlink.MAV_AUTOPILOT_INVALID, 0, 0, 0)
        time.sleep(1)

def connectcountdown():
    global counter
    while True:
        for drone in dronedata:
            drone.program["connected"] = 1 if counter > 0 else 0
        counter = max(0, counter - 1)
        time.sleep(0.01)

# Multi-drone state
dronedata = []

def getData():
    global dronedata, counter

    GPI = None
    collected = set()
    first = True
    offset = 0

    while True:
        msg = the_connection.recv_match(blocking=True)
        currsysid = msg.get_srcSystem()
        if currsysid <= 0 or currsysid >= 255:
            continue
        currdroneindex = None

        # Match drone by sysid
        for index, drone in enumerate(dronedata):
            if drone.drone["sysid"] == currsysid:
                currdroneindex = index
                break

        if currdroneindex is None:
            new_drone = DroneData()
            new_drone.drone["sysid"] = currsysid  # ✅ FIXED
            dronedata.append(new_drone)
            currdroneindex = len(dronedata) - 1

        drone = dronedata[currdroneindex]

        if msg.get_type() == "GLOBAL_POSITION_INT":
            try:
                drone.drone["alt"] = msg.relative_alt / 1000 * 3.28084 #go from mm to feet
                drone.drone["lat"] = msg.lat * 1e-7
                drone.drone["lng"] = msg.lon * 1e-7
                drone.drone["hdg"] = msg.hdg / 100
            except:
                print("NO POSITION INFORMATION")

        elif msg.get_type() == "COMMAND_INT" and msg.command == 33339:
            drone.antenna["reading"] = msg.param1
            drone.antenna["collecting"] = msg.param4

            if first:
                first = False
                offset = msg.param2

            if msg.param2 not in collected:
                collected.add(msg.param2)
                measurement = {
                    "lat": msg.x,
                    "lng": msg.y,
                    "hdg": msg.param3,
                    "data": msg.param1
                }
                drone.DFdata["measurements"].append(measurement)

        elif msg.get_type() == "COMMAND_LONG" and msg.command == 33340:
            drone.antenna["connected"] = msg.param1
            drone.antenna["frequency"] = msg.param2

        elif msg.get_type() == "HEARTBEAT":
            if msg.get_srcComponent() == 191:
                counter = 300

def Server():
    app = Flask(__name__)
    app.logger.setLevel(logging.ERROR)
    logging.getLogger('werkzeug').disabled = True
    CORS(app)

    @app.route('/data')
    def getDrone():
        return jsonify([drone.to_dict() for drone in dronedata])

    @app.route("/command", methods=['POST'])
    def doCommand():
        data = request.get_json()
        payload = {
            "command": data.get("command"),
            "value": data.get("value"),
            "sysid": data.get("sysid"),
        }

        text = json.dumps(payload).encode('utf-8')

        cmdnum = 0
        param1 = param2 = param3 = param4 = param5 = param6 = param7 = 0

        command = payload["command"]
        value = payload["value"]
        thissysid = payload["sysid"]

        if command == "setradiopos":
            cmdnum = 33333
            pos = json.loads(value)
            param1 = pos.get("lat")
            param2 = pos.get("lng")
        elif command == "setmode":
            cmdnum = 33334
            match value:
                case "none": param1 = 1
                case "locationfollow": param2 = 1
                case "radiofollow": param3 = 1
                case "eyeofender": param4 = 1
                case "debug": param5 = 1
        elif command == "follow":
            cmdnum = 33336
            param1 = 1 if value else 0
            param2 = 0 if value else 1
        elif command == "setrotationspeed":
            cmdnum = 33336
            param3 = value
        elif command == "setdatarate":
            cmdnum = 33336
            param4 = value
        elif command == "setsweepwidth":
            cmdnum = 33336
            param5 = value
        elif command == "setmovespeed":
            cmdnum = 33336
            param6 = value
        elif command == "circle":
            cmdnum = 33337
            param1 = 1
        elif command == "clearlines":
            for drone in dronedata:
                drone.DFdata["measurements"].clear()  # ✅ FIXED
            cmdnum = 33337
            param2 = 1
        elif command == "setcollecting":
            cmdnum = 33338
            param1 = 1 if value else 0
            param2 = 0 if value else 1
        elif command == "setradiomode":
            cmdnum = 33338
            param3 = 1 if value else 0
            param4 = 0 if value else 1
        elif command == "connectsensor":
            cmdnum = 33338
            param5 = 1
        elif command == "setfrequency":
            cmdnum = 33341
            param1 = value

        for _ in range(50):
            print("sent to sys: ", thissysid)
            the_connection.mav.command_long_send(int(thissysid), 191, cmdnum, 0,
                                                    float(param1), float(param2), float(param3),
                                                    float(param4), float(param5), float(param6), float(param7))
            time.sleep(0.01)

        return "amazing"

    if __name__ == "__main__":
        app.run(host="0.0.0.0", port=3003)

# Launch Threads
t1 = threading.Thread(target=Server)
t2 = threading.Thread(target=getData)
t3 = threading.Thread(target=sendheartbeat)
t4 = threading.Thread(target=connectcountdown)

t1.start()
t2.start()
t3.start()
t4.start()
