import numpy as np
import matplotlib.pyplot as plt
import math

class RadioScene:
    def __init__(self):
        self.radios = []
        self.antennas = []

    def addRadio(self, power):
        radio = Radio(self, power)
        self.radios.append(radio)
        return radio

    def addAntenna(self, angle, heading, gain):
        antenna = Antenna(self, angle, heading, gain)
        self.antennas.append(antenna)
        return antenna

class Radio:
    def __init__(self, scene, power):
        self.power = power
        self.lat =  -35.3533621
        self.lng = 149.1652374

class Antenna:
    def __init__(self, scene, angle, heading, gain):
        self.angle = angle
        self.gain = gain
        self.hdg = heading
        self.scene = scene
        self.lat = -35.3632621
        self.lng = 149.1652374
        self.toradio = 0

    def getData(self):
        #get single digit number based on distance to radio, radio power, andtenna gain, and angle with antenna
        for radio in self.scene.radios:
            Pt = radio.power
            max_gain = self.gain
            min_gain = 0

            #calculate direction to radio
            self.toradio = 360 + directionTo(self, radio)*180/math.pi
            while(self.toradio > 360):
                self.toradio -= 360

            #fix this diff angle not working
            #calculate angle between heading and radio
            diff_angle = self.toradio-self.hdg

            #depending of rules, calculate Ga
            #Ga between 0.1 and 0.4
            #if not within beam angle, min value
            diff = abs(diff_angle)
            if (diff > 180):
                diff = 360- diff
            #print("diff",diff)
            if(diff > self.angle/2):
                #min
                Ga = 0.1
            else:
                #set ga depending of relative direction to radio
                Ga = 0.1 + (0.3-(diff/(self.angle/2)*0.3))
            '''
            print("antenna:")
            print(self.lng)
            print("radio:")
            print(radio.lng)
            '''
            d = distanceTo(self, radio)
            P = 0.001*(Pt*Ga)/pow(d,2)
            return P


def distanceTo(initial, final):
    return math.sqrt(math.pow(initial.lat-final.lat,2) + math.pow(initial.lng - final.lng,2))

def directionTo(initial, final):
    return math.atan2(final.lng-initial.lng, final.lat-initial.lat)

'''
class RadioScene:
    def __init__(self):
        self.radios = []
        self.antennas = []
        self.noise = 0

    def addRadio(self, frequency, amplitude):
        self.radios.append(Radio(self, frequency, amplitude))

    def addAntenna(self, angle, heading, gain):
        self.antennas.append(Antenna(self, angle, heading, gain))


class Radio:
    def __init__(self, scene, frequency, amplitude):
        self.frequency = frequency
        self.amplitude = amplitude
        self.position = {
        "lat": -35.3632621,
        "lng": 149.1652374,
    }


class Antenna:
    def __init__(self, scene, angle, heading, gain):
        self.angle = angle
        self.gain = gain
        self.heading = heading
        self.scene = scene
        self.position = {
        "lat": -35.3632621,
        "lng": 149.1652374,
    }

    def getData(self, center):

        Fc = center-1E7 #carrier frequency

        for radio in self.scene.radios:
            #create sine wave based on its amplitude and distance from the wave; simulated scenario sampling the downscaled signal
            Fs = 4E7 #for 20 mhz range
            N = 1024 #for 1024 points

            #frequency of radio wave after downsampling
            ff = radio.frequency-Fc

            t = np.arange(0,N/Fs, 1/Fs)
            print(t.size)
            sine_wave = radio.amplitude*np.sin(2*np.pi*ff*t)


            #simulate the fft of this scenario
            plt.plot(t,sine_wave)
            plt.show()
            #perform fft
            S = np.fft.rfft(sine_wave)
            #process
            S_mag = np.abs(S)
            f = np.arange(Fc-1, Fc+ Fs/2, Fs/N)
            
            #plt.figure(0)
            plt.plot(f, S_mag,'.-')
            plt.show()
            return {"frequencies":f, "samples": S_mag}
'''