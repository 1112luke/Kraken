# Kraken Direction Finder

Kraken is a radio direction finder system, made specifically for locating LoRa modulated signals. The Device can be used standalone or with UAV integration. A software package allows for control of the Kraken and real time signal monitoring. 

<img width="1913" height="1237" alt="Screenshot 2025-07-17 at 1 02 31 PM" src="https://github.com/user-attachments/assets/6aeb6dee-e072-4d0f-a87f-53f8c0e95bd9" />

## Specifications
- Can detect signals from 500kHz to 1.76GHz
- Ethernet Connectivity
- Input Voltage: 5v - 25.2v
- Effective Range: 1000ft -> Search Diameter 2000ft

## Hardware Requirements

For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. A PC or Laptop with [Docker](https://www.docker.com/) installed is required to act as the groundstation device. For UAV integration mode, a companion computer(raspberry pi) is required for combining the data from the Drone's flight controller and the Kraken. This flight computer should be run with a raspberry pi running [this](http://exmaple.com) image. 

## Usage:

### Standalone Mode

In Standalone Mode, the device has no information about its location. Only estimated transmitter direction is collected. This mode was used extensively for testing, and can be used in scenarious where the operator is mobile with the Kraken.

1. Establish a network connection to the Kraken, and ensure the groundstation device has an ip with subnet 10 (i.e. 192.168.10.X). This can be done directly via an ethernet cable or with an ethernet radio system.

2. Remote into the Kraken with the following command:

        ssh krakenrf@192.168.10.33

Password: kraken
This is the fixed IP address for the Kraken.

3. Once connected, "release" the Kraken:

    ~/kraken-DOA/release.sh

The Kraken is now active, and connections to the groundstation program can be made. Killing the terminal with this connection will deactivate the Kraken.

4. In a new terminal on the groundstation device with docker installed, pull the groundstation docker container from github with the following command:

    sudo docker pull 1112luke/krakenground

5. To run in standalone mode, execute the following:

    sudo docker run -it -p 5173:5173 -p 14553:14553/udp 1112luke/krakenground

Navigate to the local web url listed, and the interface will be visible. Upon connection, the meter will begin tracking the estimated direction of the emitter.

### UAV Integration Mode

In UAV integration mode, a companion computer is required and should be running [this](http://exmaple.com) image. We used Raspberry Pi 5 for all testing. The companion computer is resonsible for collecting data from both the flight computer and the raspberry pi and packaging the data to be sent over a mavlink connection. The GPS location data is combined with the Kraken's direction reading on the drone itself to ensure that all location-direction pairs are properly synchronized. The steps are as follows:

1. Connect the companion computer to the flight controller using [this](https://ardupilot.org/dev/docs/raspberry-pi-via-mavlink.html) guide.

2. Establish an internet connection to the companion computer. In our case, this was done by creating a virtual bridge device between the Pi's USB port and the ethernet port. Our Trellisware ethernet radio was connected to this pi at its USB port. ensure the groundstation device has an ip with subnet 10 (i.e. 192.168.10.X).

3. remote into the companion computer with the following:

        ssh radiohawk@192.168.10.2

Password: radiohawk
This is the fixed IP address for the companion computer.

4. The companion computer routes its mavlink packets using [mavlink-router](https://github.com/mavlink-router/mavlink-router). The endpoints can be edited by changing the config file at /etc/mavlink-router/main.conf. By default, it routes from the flight controller plugged into its USB port to a tcp server on port 14553

5. run the software on the companion computer by running:

        ~/connect.sh
  
7.   The companion computer should now be broadcasting all mavlink data from the flight computer, now with injected direction data, over the mavlink connection specified in the mavlink-router config file.

8. In a new terminal instance on the groundstation computer, complete steps 2-4 from the Standalone Mode setup listed above

9. On the groundstation computer, install [mavproxy](https://ardupilot.org/mavproxy/docs/getting_started/download_and_installation.html) and run it with the following command:

        mavproxy.py --master <mavlinksource> --baud 57600 --out 127.0.0.1:14553 --out 127.0.0.1:14550 --streamrate=-1
   where <mavlinksource> connects to the endpoint specified in the companion computer's mavlink-router config file. In our case, <mavlinksource> is tcp:192.168.10.2:14553
   the outbound route to 14553 is for the krakenground docker container. the route to 14550 is the default route for Qgroundcontrol, allowing both groundstation software and Kraken software to interface over the same Mavlink connection.
   
10. To run the groundstation software in UAV mode, execute the following 

        sudo docker run -it -p 5173:5173 -p 14553:14553/udp 1112luke/krakenground
After navigating to the weburl listed, connection can be made to the payload, there are multiple features on the left side for control of the Kraken Payload

## System Software Diagram
For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. 

## 
For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. 
