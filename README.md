# Kraken Direction Finder

Kraken is a radio direction finder system, made specifically for locating LoRa modulated signals. The Device can be used standalone or with UAV integration. A software package allows for control of the Kraken and real time signal monitoring.

<img width="274" height="293" alt="image" src="https://github.com/user-attachments/assets/cb4021dc-bbc5-4cd4-a718-fe37225aaa21" />

<img width="1913" height="1237" alt="Screenshot 2025-07-17 at 1 02 31 PM" src="https://github.com/user-attachments/assets/6aeb6dee-e072-4d0f-a87f-53f8c0e95bd9" />

## Specifications

-   Can detect signals from 500kHz to 1.76GHz
-   Ethernet Connectivity
-   Input Voltage: 5v - 25.2v
-   Effective Range: 1000ft -> Search Diameter 2000ft

## Hardware Requirements

For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. A PC or Laptop with [Docker](https://www.docker.com/) installed is required to act as the groundstation device. For UAV integration mode, a companion computer(raspberry pi) is required for combining the data from the Drone's flight controller and the Kraken. This flight computer should be run with a raspberry pi running [this](http://exmaple.com) image.

## Usage:

### Standalone Mode

In Standalone Mode, the device has no information about its location. Only estimated transmitter direction is collected. This mode was used extensively for testing, and can be used in scenarious where the operator is mobile with the Kraken.

1.  Establish a network connection to the Kraken, and ensure the groundstation device has an ip with subnet 10 (i.e. 192.168.10.X). This can be done directly via an ethernet cable or with an ethernet radio system.

2.  Remote into the Kraken with the following command:

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

1.  Connect the companion computer to the flight controller using [this](https://ardupilot.org/dev/docs/raspberry-pi-via-mavlink.html) guide.

2.  Establish an internet connection to the companion computer. In our case, this was done by creating a virtual bridge device between the Pi's USB port and the ethernet port. Our Trellisware ethernet radio was connected to this pi at its USB port. ensure the groundstation device has an ip with subnet 10 (i.e. 192.168.10.X).

3.  remote into the companion computer with the following:

        ssh radiohawk@192.168.10.2

Password: radiohawk
This is the fixed IP address for the companion computer.

4.  The companion computer routes its mavlink packets using [mavlink-router](https://github.com/mavlink-router/mavlink-router). The endpoints can be edited by changing the config file at /etc/mavlink-router/main.conf. By default, it routes from the flight controller plugged into its USB port to a tcp server on port 14553

5.  run the software on the companion computer by running:

        ~/connect.sh

6.  The companion computer should now be broadcasting all mavlink data from the flight computer, now with injected direction data, over the mavlink connection specified in the mavlink-router config file.

7.  In a new terminal instance on the groundstation computer, complete steps 2-4 from the Standalone Mode setup listed above

8.  On the groundstation computer, install [mavproxy](https://ardupilot.org/mavproxy/docs/getting_started/download_and_installation.html) and run it with the following command:

         mavproxy.py --master <mavlinksource> --baud 57600 --out 127.0.0.1:14553 --out 127.0.0.1:14550 --streamrate=-1

    where mavlinksource connects to the endpoint specified in the companion computer's mavlink-router config file. In our case, mavlinksource is tcp:192.168.10.2:14553
    the outbound route to 14553 is for the krakenground docker container. the route to 14550 is the default route for Qgroundcontrol, allowing both groundstation software and Kraken software to interface over the same Mavlink connection.

9.  To run the groundstation software in UAV mode, execute the following

            sudo docker run -it -p 5173:5173 -p 14553:14553/udp 1112luke/krakenground

    After navigating to the weburl listed, connection can be made to the payload, there are multiple features on the left side for control of the Kraken Payload

## Accessing the Kraken's output Directly

The Kraken has three interfaces by dafault:

-   TCP server (192.168.10.33:3333)
    This interface outputs a start bit (0x33) followed by 360 data points, followed by a checksum. An example for reading from this interface is at \*/Examples/NUMBERVIEWERTCP.PY
-   UDP broadcasts its current frequency on port 3331 as a string every 0.5 seconds

-   INPUT: The frequency of the Kraken can be changed by sending via udp to 192.168.10.33 port 3332 “FREQ:<freq>” where freq is the desired frequency.

These interfaces become active only after the kraken has been "released", as in steps 2-3 form the Standalone Mode setup above. The Kraken python class from [Kraken/Edge](https://github.com/1112luke/Kraken/blob/main/Edge/Kraken.py) may also be useful.

## Software overview

This repository contains the software for the companion computer as well as all ground station software. The docker images for the companion computer and the grounstation are built from the Dockerfiles in the Edge and Groundstation folders, respectively. To change the docker containers, build from these dockerfiles and run the built images in place of 1112luke/drone and 1112luke/krakenground. An overview of all software and communications is shown:<img width="1126" height="836" alt="Screenshot 2025-07-21 at 12 09 32 PM" src="https://github.com/user-attachments/assets/7a0fc882-7932-4dd9-bb5b-08f5cad4ae44" />

### Release.sh

Release.sh is run on the Kraken's raspberry pi. Release.sh runs two things:

1. ./heimdall_only_start
   This program was provided by the KrakenSDR and is responsible for ensuring phase coherent data aquisition among the 5 receivers in the KrakenSDR.
2. GNUradio generated python file.
   This python file runs a direction-finding algorithm and implements TCP/IP communications to and from the Kraken. The GNUradio file it was generated from uses [this custom KrakenSDR source block](https://github.com/1112luke/gr-krakensdr-radiohawk), and implements the MUSIC algorithm for direction estimation.

### 1112luke/drone

This docker container's entry point is Drone.py, which can be found [here](https://github.com/1112luke/Kraken/blob/main/Edge/Drone.py). It is responsible for collecting GPS data from the flight controller, direction data from the Kraken, and sending these packages down via custom MAVLINK commands. Packaging the data on the edge ensures the smallest possible time discrepancy between GPS position and direction data. This file can be modified to implement autonomous seeking capability if necessary.

### mavlink-router

The mavlink router file has multiple routes:

1. Drone:
   This route should never be edited. It connects to 1112luke/drone dockerfile
2. FC:
   This is the route to the flight controller. Modify Baud and serial device as needed depending on how your companion computer is implemented
3. Telemetry
   This routes Mavlink packets to your telemetry device. In our case, it is the trellisware ethernet radio. RFD900x can also be used here. If there is an RFD900x on the flight controller, mavlink packets will still be routed and this endpoint is not necessary. Note that if no ethenet radio is connected, there will be no way to ssh into the systems to start programs, and startup automation will need to be implemented.
4. SITL
   This endpoint and FC should be mutually exclusively enabled. Enable this endpoint to connect to an SITL simulation that can be run on the companion computer using:
   sim_vehicle.py -v copter --no-mavproxy
   This is only installed by default if using the provided companion computer pi image.

### handoff.py

handoff.py is responsible for communication between mavlink and the React web application. handoff.py and the web application communicate via localhost. The program mostly contains tables for interpreting specific commands.

### React Web Application

The react web application launches its own server using the vite build system which is accessible on the host machine. It implements communication to handoff.py, google maps, and more.
