# Kraken Direction Finder

Kraken is a radio direction finder system made specifically for locating LoRa modulated signals. The Device can be used standalone or with UAV integration. A software package allows for control of the Kraken and real time signal monitoring.

<img width="274" height="293" alt="image" src="https://github.com/user-attachments/assets/cb4021dc-bbc5-4cd4-a718-fe37225aaa21" />

![Aug-04-2025 14-11-56](https://github.com/user-attachments/assets/a341f2ce-2f59-45e0-87e4-d85faeb91126)

## Specifications

-   Can detect signals from 500kHz to 1.76GHz
-   Ethernet Connectivity
-   Input Voltage: 5v - 25.2v
-   Effective Range: 1000ft -> Search Diameter 2000ft

## Hardware Requirements

For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. A PC or Laptop with [Docker](https://www.docker.com/) installed is required to act as the groundstation device. For UAV integration, a companion computer(raspberry pi) is required for combining the data from the Drone's flight controller and the Kraken. This flight computer should be run with a raspberry pi running [this](http://exmaple.com) image.

## Installation:

### Hardware

assumptions about this being for ardupilot systems, how to connect the whole system

#### Kraken

#### Companion Computer

### Software

#### Groundstation

The groundstation software consists of three separate programs: a React web application, a python communication script, and MavProxy. They are packeged with all proper configuration and dependencies using docker, specifically docker-compose.

1.  To start, ensure both git and docker are installed on the groundstation laptop, and that docker desktop has been launched so that docker is active
2.  Create a new directory for the project and clone the repo:

        git clone https://github.com/1112luke/Kraken .

3.  Navigate to the correct folder

        cd Groundstation

4.  Run the following command build the docker containers for your system architecture and bring up the application

        docker compose up --build

5.  The program should build and begin. A link to the web interface should be listed. This is usually http://localhost:5173

#### Raspberry Pis

The system has two raspberry pis, each of which need only an sd card flashed with the following images:
[Kraken](https://example.com)
[Companion Computer](https://example.com)

## Configuration:

The system has four points of configuration which must be properly set by the user for proper functionality:

1. main.conf
2. vars.sh
3. ips configured using nmtui
4. compose.yaml on the ground

## Usage:

<!--
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

-->

### UAV Integration

#### Hardware

To connect the Kraken payload to a UAV, multiple connections need to be made:

-   Kraken Power: 5v -> 25.2V.
-   Kraken Data: TCP/IP VIA Ethernet. Connect Kraken ethernet output to companion computer input.
-   Companion Computer Data: Connect companion computer to Flight Controller running ardupilot using [this](https://ardupilot.org/dev/docs/raspberry-pi-via-mavlink.html) guide.
-   C2: Establish an internet connection from groundstation laptop to the companion computer. In our case, this was done by creating a virtual bridge device between the Pi's USB port and the ethernet port. Our Trellisware ethernet radio was connected to this pi at its USB port. ensure the groundstation laptop has an ip with subnet 10 (i.e. 192.168.10.X).

The system assumes a network of known IP addresses, as shown below:

<img width="4276" height="1805" alt="IPdiagram" src="https://github.com/user-attachments/assets/48858964-c3f3-4d12-be82-3b0f2d437ee4" />

#### Software

For UAV integration, a companion computer is required and should be running [this](http://exmaple.com) image. We used Raspberry Pi 5 for all testing. The companion computer is resonsible for collecting data from both the flight computer and the raspberry pi and packaging the data to be sent over a mavlink connection. The GPS location data is combined with the Kraken's direction reading on the drone itself to ensure that all location-direction pairs are properly synchronized. The steps are as follows:

1.  remote into the companion computer with the following:

        ssh radiohawk@192.168.10.3X

    where X is corresponds to the systemid as shown in the hardware section

    Password: radiohawk

2.  The companion computer routes its mavlink packets using [mavlink-router](https://github.com/mavlink-router/mavlink-router). The endpoints can be edited by changing the config file at /etc/mavlink-router/main.conf. By default, it routes from the flight controller plugged into its USB port to a tcp server on port 14553. See the example:

        [General]
             TcpServerPort=14553

        [UartEndpoint FC]
            Device=/dev/ttyACM0
            Baud=57600

        [UdpEndpoint Drone]
            Mode=normal
            Address=127.0.0.1
            Port=14551

        #[UartEndpoint Telemetry]
        #    Device=/dev/ttyUSB0
        #    Baud=57600

        #[TcpEndpoint SITL]
        #    Address=127.0.0.1
        #    Port=5760
        #    mode=server

In the above main.conf file, several endpoints are defined. for the purpose of this project, <b>the Drone endpoint and General endpoints should never be changed.</b> What can and should be changed is the FC endpoint. this is used to establish a serial connection to the flight controller. This can be done via the pi's GPIO serial interface on pins 14 and 15, or with a usb cable. Ensure the device is selected properly.

The raspberry pi image also has SITL installed. To use it, comment out the FC endpoint and comment in SITL. then run <i>sim_vehicle.py -v copter --no-mavproxy</i> on the companion computer in a new terminal. The system will connect to a simulated flight controller with built-in physics.

3.  Each companion computer needs to know the system's respecive systemid and its payload's IP address. These are to be edited on the companion computer at /etc/drone/vars.sh. generally, as listed in the above hardware section, sysid 1 will also be krakenip 192.168.10.31; 2 -> 192.168.10.32; etc.

4.  Once both config files have been edited, restart the companion computer

5.  To start the collection program on the kraken, connect to the kraken:

        ssh krakenrf@192.168.10.1X

    Where X corresponds to the systemid.
    password: kraken

    Then, start the program from the home directory with ./krakensdr_doa/release.sh
    This terminal needs to remain open for the duration of the flight to properly receive direction data.

6.  The companion computer should be broadcasting all mavlink data from the flight computer, now with injected direction data, over the mavlink connection specified in the mavlink-router config file.

7.  Complete setup for the groundstation as described in the above section

8.  After navigating to the weburl listed (usually http://localhost:5173), a connection can be made to the payload, there are multiple features on the left side for control of the Kraken Payload

## Multiship

## User-Defined Configuration Summary

A summary of all points of configuration is listed:

-   ensure all devices have a fixed ip address following the guidelines listed above
-   edit the file at /etc/mavlinkrouter/main.conf on all companion computers to properly communicate with the flight computer
-   edit the file at /etc/drone/vars.sh on all companion computers with the ip address of their respective Kraken payload and the system id of their flight controller.
-   edit the compose.yaml file in the groundstation to properly communicate with all UAS, as described in <b>Groundstation Setup</b>

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
