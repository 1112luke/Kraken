import json
import paho.mqtt.client as mqtt
from parseData import parseData

client = mqtt.Client()                           # Create MQTT object
client.connect('radiohound.ee.nd.edu', 1883, 60)
#send_heartbeat()                                 # User provided function to identify your node
#raw_data = get_data()                            # User provided driver code to interact with SDR 
#payload = process_data(raw_data)                 # User provided for FFT processing, if desired.  See 'Example from RadioHound' below
count = 0

client.subscribe("radiohound/clients/data/drone")

def onmessage(client, userdata, message):
  global count
  count+=1
  print("received", count)
  parseData(message)

client.on_message = onmessage
client.loop_forever()