import { useEffect, useState } from "react";

import "./App.css";
import Dronemap from "./Dronemap";
import Button from "./button";

function App() {
    const [drone, setdrone] = useState({ alt: 0, lng: 0, lat: 0, hdg: 0 });
    const [radio, setradio] = useState({
        lat: -35.3632621,
        lng: 149.1651374,
    });
    const [mode, setmode] = useState("none");
    const [status, setstatus] = useState("none");
    const [color, setcolor] = useState("none");
    const [antenna, setantenna] = useState({
        lng: 0,
        lat: 0,
        hdg: 0,
        ang: 0,
        gain: 0,
        toradio: 0,
        reading: 0,
    });
    const [circledata, setcircledata] = useState([]);
    const [circlespeed, setcirclespeed] = useState(50);
    const [sweepwidth, setsweepwidth] = useState(160);
    const [sweepdata, setsweepdata] = useState([]);
    const [datarate, setdatarate] = useState(20);
    const [connected, setconnected] = useState(0);
    const [movespeed, setmovespeed] = useState(8.5);

    //map state
    const [mappos, setmapppos] = useState({
        lat: -35.3632621,
        lng: 149.1652374,
    });

    async function getData() {
        await fetch("http://localhost:3003/data")
            .then((res) => res.json())
            .then((data) => {
                setdrone(data.drone);
                setantenna(data.antenna);
                setstatus(data.program.status);
                setconnected(data.program.connected);
                setcircledata(data.circledata);
                setsweepdata(data.sweepdata);
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
                color = "lightgrey";
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
                <div style={{ flex: 1 }}>&nbsp;</div>
                <div
                    style={{
                        textAlign: "center",
                        fontSize: 40,
                        fontFamily: "Nabla",
                    }}
                >
                    RadioHawk
                </div>
                <div
                    style={{
                        flex: 1,
                        fontFamily: "barlow",
                        color: connected ? "lightgreen" : "red",
                        fontSize: 30,
                    }}
                >
                    {connected ? "CONNECTED" : "DISCONNECTED"}
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
                    </div>
                    <div className="box" id="parameters">
                        <div className="divider">Parameters</div>
                        Mode Select
                        <select
                            type="dropdown"
                            onChange={(e) => {
                                setmode(e.target.value);
                            }}
                            value={mode}
                            style={{
                                width: "80%",
                                margin: "auto",
                                marginTop: 0,
                                marginBottom: 0,
                            }}
                        >
                            <option value="none">None</option>
                            <option value="locationfollow">
                                Location Follow
                            </option>
                            <option value="radiofollow">Radio Follow</option>
                            <option value="eyeofender">Eye of Ender</option>
                            <option value="debug">Debug</option>
                        </select>
                        <br></br>
                        {/* mode selector*/}
                        {mode == "none" && <div>Select a Mode</div>}
                        {mode == "locationfollow" && (
                            <div>
                                Movement Speed (m/s): {movespeed}
                                <input
                                    type="range"
                                    min={0}
                                    max={18}
                                    value={movespeed * 2}
                                    onChange={(e) => {
                                        setmovespeed(e.target.value / 2);
                                        sendCommand(
                                            "setmovespeed",
                                            e.target.value / 2
                                        );
                                    }}
                                ></input>
                            </div>
                        )}
                        {mode == "debug" && (
                            <>
                                <Button
                                    text="Collect"
                                    onpress={() => {
                                        sendCommand("setcollecting", 1);
                                    }}
                                ></Button>
                                <br></br>
                                <Button
                                    text="Stop Collect"
                                    onpress={() => {
                                        sendCommand("setcollecting", 0);
                                    }}
                                ></Button>
                            </>
                        )}
                        {mode == "radiofollow" && (
                            <>
                                {status == "searching" ||
                                status == "tracking" ? (
                                    <Button
                                        onpress={() => {
                                            sendCommand("follow", 0);
                                        }}
                                        text={"Stop"}
                                    ></Button>
                                ) : (
                                    <Button
                                        onpress={() => {
                                            sendCommand("follow", 1);
                                        }}
                                        text={"Begin"}
                                    ></Button>
                                )}
                                <br></br>
                                <Button
                                    onpress={() => {
                                        sendCommand("clearlines", 1);
                                        setsweepdata([]);
                                    }}
                                    text={"Clear lines"}
                                ></Button>
                                Rotation Speed (degrees/s): {circlespeed}
                                <input
                                    type="range"
                                    min={0}
                                    max={80}
                                    value={circlespeed}
                                    onChange={(e) => {
                                        setcirclespeed(e.target.value);
                                        sendCommand(
                                            "setrotationspeed",
                                            e.target.value
                                        );
                                    }}
                                ></input>
                                Movement Speed (m/s): {movespeed}
                                <input
                                    type="range"
                                    min={0}
                                    max={18}
                                    value={movespeed * 2}
                                    onChange={(e) => {
                                        setmovespeed(e.target.value / 2);
                                        sendCommand(
                                            "setmovespeed",
                                            e.target.value / 2
                                        );
                                    }}
                                ></input>
                                Datarate (hz): {datarate}
                                <input
                                    type="range"
                                    min={0}
                                    max={30}
                                    value={datarate}
                                    onChange={(e) => {
                                        setdatarate(e.target.value);
                                        sendCommand(
                                            "setdatarate",
                                            e.target.value
                                        );
                                    }}
                                ></input>
                                Sweepwidth (degrees): {sweepwidth}
                                <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    value={sweepwidth}
                                    disabled={
                                        status == "tracking" ? true : false
                                    }
                                    onChange={(e) => {
                                        setsweepwidth(e.target.value);
                                        sendCommand(
                                            "setsweepwidth",
                                            e.target.value
                                        );
                                    }}
                                ></input>
                                <div>
                                    Radiomode:
                                    <Button
                                        text="Simulation"
                                        onpress={() => [
                                            sendCommand("setradiomode", 0),
                                        ]}
                                    ></Button>
                                    <br></br>
                                    <Button
                                        text="Real"
                                        onpress={() => [
                                            sendCommand("setradiomode", 1),
                                        ]}
                                    ></Button>
                                </div>
                            </>
                        )}
                        {mode == "eyeofender" && (
                            <>
                                <Button
                                    onpress={() => {
                                        sendCommand("circle", 1);
                                    }}
                                    text={"Circle"}
                                ></Button>
                                <br></br>
                                <Button
                                    onpress={() => {
                                        sendCommand("clearlines", 1);
                                    }}
                                    text={"Clear lines"}
                                ></Button>
                                Circle Speed (degrees/s): {circlespeed}
                                <input
                                    type="range"
                                    min={0}
                                    max={50}
                                    value={circlespeed}
                                    onChange={(e) => {
                                        setcirclespeed(e.target.value);
                                        sendCommand(
                                            "setrotationspeed",
                                            e.target.value
                                        );
                                    }}
                                ></input>
                                Datarate (hz): {datarate}
                                <input
                                    type="range"
                                    min={0}
                                    max={30}
                                    value={datarate}
                                    onChange={(e) => {
                                        setdatarate(e.target.value);
                                        sendCommand(
                                            "setdatarate",
                                            e.target.value
                                        );
                                    }}
                                ></input>
                            </>
                        )}
                    </div>
                    <div style={{ backgroundColor: "white", width: "100%" }}>
                        <span style={{ color: "green" }}>
                            Radio Direction: {antenna.toradio.toFixed(2)},{" "}
                        </span>
                        <span style={{ color: "blue" }}>Heading</span>
                    </div>
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
                    ></Dronemap>
                </div>
            </div>
        </>
    );
}

export default App;
