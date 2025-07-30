import socket
import threading
import time
import numpy as np
from threading import Thread

class Kraken:
    def __init__(self):
        self.hasdata = 0
        self.currdata = 0
        self.collectnum = 0
        self.s = socket.socket()
        self.connected = 0
        self.heartbeattime = time.time()
        self.freq = 915000000
        self.lasttried = 915
        self.collectdataflag = True

        self.checkthread = Thread(target = self.checkthread)

        self.freqthread = Thread(target = self.freqthread)
        self.udpsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        self.checkthread.start()
        self.freqthread.start()

    def collectdata(self):
      
        self.heartbeattime = time.time()
        while(self.connected):
            try:
                data = np.frombuffer(self.s.recv(1448), dtype = np.float32)

                sum = np.sum(data[1:-1])

                #validate received data
                if(abs(sum - data[-1]) < 1e-3):
                    pass
                else:
                    print("BAD KRAKEN PACKET: ", sum, data[-1])
                    continue

                #chop filler data
                data = data[1:-1]

                self.hasdata = 1
                self.heartbeattime = time.time()
                self.connected = 1
                self.collectnum += 1
                self.currdata = np.argmax(data)
            except:
                print("failed to get kraken data")


    def checkthread(self):
        while(1):
            #check if connected
            if(time.time() - self.heartbeattime > 1.5):
                self.connected = False
                self.collectdataflag  = False
            time.sleep(0.2)

    def freqthread(self):
        self.udpsock.bind(("0.0.0.0", 3331))
        while(1):
            data, addr = self.udpsock.recvfrom(1024)
            self.freq = data.decode().strip()

    def start(self):
        while(1):
            if not self.connected:
                try:
                    print("Attempting Kraken Connection: ")
                    self.s = socket.socket()
                    print(self.s)
                    self.s.connect(("192.168.10.33", 3333))
                    print("KRAKEN CONNNECTED")
                    self.connected = 1
                    self.collectdataflag = True
                    t1 = threading.Thread(target = self.collectdata)
                    t1.start()
                except:
                    print("UNABLE TO CONNECT TO KRAKEN")
            time.sleep(2)

    def setfreq(self, infreq):
        #create udp socket, send FREQ:self.freq to 192.168.10.33 port 3332
        
        if(self.lasttried != int(infreq)*10**6):
            newfreq = "FREQ:" + str(infreq)
            currsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            currsock.sendto(newfreq.encode(), (("192.168.10.33", 3332)))
        self.lasttried = int(infreq)*10**6
    def getdata(self):
        self.hasdata = 0
        return self.currdata

    def gethasdata(self):
        return self.hasdata

    def getcollectnum(self):
        return self.collectnum
    