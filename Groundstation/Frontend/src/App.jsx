import { useEffect, useState } from "react";

import "./App.css";
import Dronemap from "./Dronemap";
import Button from "./Button";
import Dronescreen from "./Dronescreen";
import Dropdown from "./Dropdown";
import Krakenscreen from "./Krakenscreen";

function App() {
    //stateful variables for Drone
    const [drone, setdrone] = useState({ alt: 0, lng: 0, lat: 0, hdg: 0 });
    const [radio, setradio] = useState({
        lat: -35.3632621,
        lng: 149.1651374,
    });

    //stateful variables for antenna
    const [antenna, setantenna] = useState({
        lng: 0,
        lat: 0,
        hdg: 0,
        ang: 0,
        gain: 0,
        toradio: 0,
        reading: 0,
    });

    //kraken stateful variables
    const [DFdata, setDFdata] = useState("none");
    const [plotting, setplotting] = useState(false);

    //stateful variables for mode and status display
    const [mode, setmode] = useState("none");
    const [status, setstatus] = useState("none");
    const [color, setcolor] = useState("none");

    //stateful variables for Dronemodes
    const [circledata, setcircledata] = useState([]);
    const [circlespeed, setcirclespeed] = useState(50);
    const [sweepwidth, setsweepwidth] = useState(160);
    const [sweepdata, setsweepdata] = useState([]);
    const [datarate, setdatarate] = useState(20);
    const [connected, setconnected] = useState(0);
    const [sensorconnected, setsensorconnected] = useState(0);
    const [movespeed, setmovespeed] = useState(8.5);

    //stateful vaiables for map
    const [mappos, setmapppos] = useState({
        lat: -35.3632621,
        lng: 149.1652374,
    });

    //global stateful variables
    const [vehicle, setvehicle] = useState("Kraken");
    const [vehicles, setvehicles] = useState(["None", "Radiohound", "Kraken"]);

    async function getData() {
        await fetch("http://localhost:3003/data")
            .then((res) => res.json())
            .then((data) => {
                setdrone(data.drone);
                setantenna(data.antenna);
                setstatus(data.program.status);
                setconnected(data.program.connected);
                setsensorconnected(data.antenna.connected);
                setcircledata(data.circledata);
                setsweepdata(data.sweepdata);
                setDFdata([...data.DFdata.measurements]);
                console.log(data.DFdata.measurements);
            });
    }

    async function sendRadioPos() {
        await fetch("http://localhost:3003/setradio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(radio),
        });
    }

    async function sendCommand(command, value) {
        var payload = { command: command, value: value };
        await fetch("http://localhost:3003/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    }

    useEffect(() => {
        const int = setInterval(getData, 1000 / 10);
        return () => clearInterval(int);
    }, []);

    useEffect(() => {
        sendCommand("setradiopos", JSON.stringify(radio));
    }, [radio]);

    useEffect(() => {
        sendCommand("setmode", mode);
    }, [mode]);

    useEffect(() => {
        var color;
        switch (status) {
            case "none":
                color = "var(--light)";
                break;
            case "inprogress":
                color = "yellow";
                break;
            case "targetlocked":
                color = "rgb(0, 197, 0)";
                break;
            case "searching":
                color = "yellow";
                break;
            case "tracking":
                color = "yellow";
                break;
            case "circling":
                color = "yellow";
                break;
            case "done":
                color = "green";
        }
        setcolor(color);
    }, [status]);

    return (
        <>
            <div className="header">
                <div style={{ flex: 1 }}>
                    <Dropdown
                        value={vehicle}
                        values={vehicles}
                        setvalue={setvehicle}
                    ></Dropdown>
                </div>
                <div
                    style={{
                        textAlign: "center",
                        fontSize: 40,
                        fontFamily: "system-ui",
                    }}
                >
                    Kraken
                </div>

                <div
                    style={{
                        flex: 0.5,
                        fontFamily: "system-ui",
                        color: connected ? "lightgreen" : "red",
                        fontSize: 20,
                    }}
                >
                    System: {connected ? "CONNECTED" : "DISCONNECTED"}
                </div>
                <div
                    style={{
                        flex: 0.4,
                        fontFamily: "system-ui",
                        color: sensorconnected ? "lightgreen" : "red",
                        fontSize: 20,
                    }}
                >
                    Sensor: {sensorconnected ? "CONNECTED" : "DISCONNECTED"}
                    {!sensorconnected && (
                        <Button
                            onpress={() => {
                                sendCommand("connectsensor", 0);
                            }}
                            text="Connect"
                        ></Button>
                    )}
                </div>
            </div>
            <div className="container">
                <div className="left">
                    <div className="box">
                        <div className="divider">Drone Data</div>
                        Altitude: {drone.alt}
                        <br></br>
                        Longitude: {drone.lng.toFixed(7)}
                        <br></br>
                        Latitude: {drone.lat.toFixed(7)}
                        <br></br>
                        Heading: {drone.hdg}°
                    </div>
                    <div className="box">
                        <div className="divider">Antenna Data</div>
                        Longitude: {antenna.lng.toFixed(7)}
                        <br></br>
                        Latitude: {antenna.lat.toFixed(7)}
                        <br></br>
                        Heading: {antenna.hdg}°<br></br>
                        Angle: {antenna.ang}
                        <br></br>
                        Gain: {antenna.gain}
                        <br></br>
                        Power Reading: {antenna.reading.toFixed(2)}
                        <br></br>
                        Collecting: {antenna.collecting ? "🟢" : "🔴"}
                        <br></br>
                        Center Frequency: {antenna.frequency}
                    </div>

                    {vehicle == "Radiohound" && (
                        <Dronescreen
                            drone={drone}
                            antenna={antenna}
                            mode={mode}
                            setmode={setmode}
                        ></Dronescreen>
                    )}
                    {vehicle == "Kraken" && (
                        <Krakenscreen
                            drone={drone}
                            antenna={antenna}
                            mode={mode}
                            setmode={setmode}
                            sendCommand={sendCommand}
                            setplotting={setplotting}
                        ></Krakenscreen>
                    )}
                </div>
                <div className="right" style={{ borderColor: color }}>
                    <div
                        className="rightheader"
                        style={{
                            backgroundColor: color,
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            Mode: {mode}
                        </div>
                        <div
                            style={{
                                flex: 2,
                                fontSize: 30,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            STATUS: {status}
                        </div>
                        <div
                            style={{
                                flex: 1,
                                fontSize: 15,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Button
                                text={"Center Drone"}
                                onpress={() => {
                                    setmapppos({
                                        lat: drone.lat,
                                        lng: drone.lng,
                                    });
                                }}
                                style={{ flex: 1 }}
                            ></Button>
                            <Button
                                text={"Get radio"}
                                onpress={() => {
                                    setradio({
                                        lat: drone.lat,
                                        lng: drone.lng,
                                    });
                                }}
                                style={{ flex: 1 }}
                            ></Button>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}></div>
                    <Dronemap
                        drone={drone}
                        radio={radio}
                        antenna={antenna}
                        setradio={setradio}
                        circledata={circledata}
                        sweepdata={sweepdata}
                        status={status}
                        mappos={mappos}
                        DFdata={DFdata}
                        plotting={plotting}
                    ></Dronemap>
                </div>
            </div>
        </>
    );
}

export default App;
