# Kraken Direction Finder

Kraken is a radio direction finder system, made specifically for locating LoRa modulated signals. The Device can be used standalone or with UAV integration. A software package allows for control of the Kraken and real time signal monitoring. 

<img width="1913" height="1237" alt="Screenshot 2025-07-17 at 1 02 31 PM" src="https://github.com/user-attachments/assets/6aeb6dee-e072-4d0f-a87f-53f8c0e95bd9" />

## Specifications
- Can detect signals from 500kHz to 1.76GHz
- Ethernet Connectivity
- Input Voltage: 5v - 25.2v
- Effective Range: 1000ft -> Search Diameter 2000ft
- A PC or Laptop with [Docker](https://www.docker.com/) installed.

## Usage:

### Standalone Mode

In Standalone Mode, the device has no information about its location. Only estimated transmitter direction is collected. This mode was used extensively for testing, and can be used in scenarious where the operator is mobile with the Kraken.

First, ssh establish a network connection to the Kraken, and ensure the host device has an ip with subnet 10 (i.e. 192.168.10.X).

Next, remote into the Kraken with the following command:

    ssh krakenrf@192.168.10.33
    
This is the fixed IP address for the Kraken.

Once connected, "release" the Kraken:

    ./kraken-DOA/release.sh

The Kraken is now active, and connections to the groundstation program can be made.

Pull the groundstation docker container from github with the following command:

    sudo docker pull 1112luke/krakenground

To run in standalone mode, execute the following:

    sudo docker run -it -p 5173:5173 -p 14553:14553/udp 1112luke/krakenground

The navigate to the local web url, and the interface will be visible. Upon connection, the meter will begin tracking the estimated direction of the emitter.

### UAV integration Mode


## Hardware Requirements

For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. 

## System Software Diagram
For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. 

## 
For all current modes of operation, it is required that the Kraken be connected to the same tcp/ip network as the groundstation device. For our testing, we used Trellisware Ethernet radios, with the [Ghost 850](https://www.trellisware.com/trellisware-radios/tw-ghost-870/) mounted to the UAV. 
