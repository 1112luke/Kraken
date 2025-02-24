import numpy
import json
import base64

#takes in message.payload from scan
def parseData(message):
    input = message.payload
    input = input.decode("utf-8")
    input = json.loads(input)
    dt = numpy.dtype(input["type"])
    data = numpy.frombuffer(base64.b64decode(input["data"]), dtype=dt)

    
    #print("data: " + str(data))
    #print("len(data): " + str(len(data)))
    #freq_array = numpy.linspace(input['metadata']['fmin'], input['metadata']['fmax'], input['metadata']['xcount'])
    #print(len(freq_array), len(data))
    #print(data)
    dbm = 10*numpy.log10(data) + 30
    dbm = dbm[250:300]
    return(float(numpy.max(dbm)))

    #max = numpy.max(dbm)
    #print("max power is " + str(max) + " at " + str(freq_array[numpy.where(dbm == max)]/1e6) + " MHz")