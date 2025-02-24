import json
import paho.mqtt.client as mqtt
import time
import threading
client = mqtt.Client()                           # Create MQTT object
client.connect('radiohound.ee.nd.edu', 1883, 60)
#send_heartbeat()                                 # User provided function to identify your node
#raw_data = get_data()                            # User provided driver code to interact with SDR 
#payload = process_data(raw_data)                 # User provided for FFT processing, if desired.  See 'Example from RadioHound' below

count = 0


payload = {
  'task_name': 'tasks.legacy.rf.scan.periodogram',
  'arguments': 
  {
    "output_topic":"radiohound/clients/data/drone",
    "fmin":5730e6,
    "fmax":5734e6,
    "N_periodogram_points":512,
    "gain":1,
    "batch_id":0, # Can be set to link multiple scans together.  Not implemented in GUI yet.  
  },
}

#e415f6f662e5

def request():
    global count
    rate = 1
    while(1):
        count += 1
        currtime = time.time() * 1000
        pub = client.publish("radiohound/clients/command/e415f6f662e5", payload=json.dumps(payload))
        pub.wait_for_publish()
        print("published", count, "time = ", time.time()*1000-currtime)
        time.sleep(1/rate)



t1 = threading.Thread(target = request)



t1.start()

client.loop_forever()

