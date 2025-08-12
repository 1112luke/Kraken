import { useEffect, useState } from "react";

import "./App.css";
import Dronemap from "./Dronemap";
import Button from "./Button";
import Dronescreen from "./Dronescreen";
import Dropdown from "./Dropdown";
import Krakenscreen from "./Krakenscreen";
import Dronemapoffline from "./Dronemapoffline";

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

    const [dronesdata, setdronesdata] = useState([]);
    const [sysids, setsysids] = useState([]);
    const [activesys, setactivesys] = useState(1);

    const [averagelines, setaveragelines] = useState([]);

    const [averaging, setaveraging] = useState(false);

    //kraken stateful variables
    const [DFdata, setDFdata] = useState([]);
    const [recentdf, setrecentdf] = useState("none");
    const [plotting, setplotting] = useState(false);
    const [num2plot, setnum2plot] = useState(1000);

    //stateful variables for mode and status display
    const [mode, setmode] = useState("none");
    const [status, setstatus] = useState("none");
    const [color, setcolor] = useState("none");

    //stateful vaiables for map
    const [mappos, setmapppos] = useState({
        lat: -35.3632621,
        lng: 149.1652374,
    });
    //stateful variables for offline map
    const [viewstate, setviewstate] = useState({
        latitude: 39.778815,
        longitude: -84.104479,
        zoom: 15,
    });

    //global stateful variables
    const [vehicle, setvehicle] = useState("Kraken");
    const [vehicles, setvehicles] = useState(["None", "Radiohound", "Kraken"]);

    async function getData() {
        //use localhost instead of backend if not running in docker compose
        await fetch("http://localhost:3003/data")
            .then((res) => res.json())
            .then((data) => {
                //set drones recent data
                for (var i = 0; i < data.length; i++) {
                    data[i].DFdata.recent =
                        data[i].DFdata.measurements[
                            data[i].DFdata.measurements.length - 1
                        ];
                }
                setdronesdata([...data]);

                if (averaging) {
                    const newdata = [...averagelines];
                    if (!newdata[0]) newdata[0] = []; // ensure first line exists
                    newdata[0] = [
                        ...newdata[0],
                        {
                            dir: data[0].DFdata.recent,
                            lat: data[0].drone.lat.toFixed(7),
                            lng: data[0].drone.lng.toFixed(7),
                        },
                    ];
                    setaveragelines(newdata);
                }
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
        var payload = { command: command, value: value, sysid: activesys };
        console.log("SENTSYS: ", activesys);
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
        sendCommand("clearlines", 0);
        return () => clearInterval(int);
    }, []);

    useEffect(() => {
        sendCommand("setradiopos", JSON.stringify(radio));
    }, [radio]);

    useEffect(() => {
        sendCommand("setmode", mode);
    }, [mode]);

    useEffect(() => {
        //get sysids
        var newarr = [];
        for (var i = 0; i < dronesdata.length; i++) {
            newarr.push(dronesdata[i].drone.sysid);
        }
        setsysids(newarr);
        try {
            console.log(
                "Antenna location",
                dronesdata[0].DFdata.recent.lat,
                dronesdata[0].DFdata.recent.lng
            );
        } catch {
            console.log("No Recent Data");
        }

        console.log("DRONES: ", dronesdata);
    }, [dronesdata]);

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

                {dronesdata.map((dronedata) => {
                    //console.log("SYSID", dronedata.drone, activesys);
                    if (dronedata.drone.sysid == activesys) {
                        return (
                            <>
                                <div
                                    style={{
                                        flex: 0.5,
                                        fontFamily: "system-ui",
                                        color: dronedata.program.connected
                                            ? "lightgreen"
                                            : "red",
                                        fontSize: 20,
                                    }}
                                >
                                    System:{" "}
                                    {dronedata.program.connected
                                        ? "CONNECTED"
                                        : "DISCONNECTED"}
                                </div>
                                <div
                                    style={{
                                        flex: 0.4,
                                        fontFamily: "system-ui",
                                        color:
                                            dronedata.antenna.connected &&
                                            dronedata.program.connected
                                                ? "lightgreen"
                                                : "red",
                                        fontSize: 20,
                                    }}
                                >
                                    Sensor:{" "}
                                    {dronedata.antenna.connected &&
                                    dronedata.program.connected
                                        ? "CONNECTED"
                                        : "DISCONNECTED"}
                                    {!dronedata.antenna.connected && (
                                        <Button
                                            onpress={() => {
                                                sendCommand("connectsensor", 0);
                                            }}
                                            text="Connect"
                                        ></Button>
                                    )}
                                </div>
                            </>
                        );
                    }
                })}
            </div>
            <div className="container">
                <div className="left">
                    <Dropdown
                        value={activesys}
                        values={sysids}
                        setvalue={setactivesys}
                    ></Dropdown>

                    <div className="box">
                        {dronesdata.map((drone) => {
                            if (drone.drone.sysid == activesys) {
                                return (
                                    <>
                                        <div className="divider">
                                            Drone {drone.drone.sysid} Data{" "}
                                        </div>
                                        Altitude: {drone.drone.alt.toFixed(3)}
                                        <br></br>
                                        Longitude: {drone.drone.lng.toFixed(7)}
                                        <br></br>
                                        Latitude: {drone.drone.lat.toFixed(7)}
                                        <br></br>
                                        Heading: {drone.drone.hdg}°
                                    </>
                                );
                            }
                        })}
                    </div>
                    <div className="box">
                        <div className="divider">Marker</div>
                        Longitude: {radio.lng.toFixed(7)}
                        <br></br>
                        Latitude: {radio.lat.toFixed(7)}
                    </div>

                    {dronesdata.map((dronedata) => {
                        if (dronedata.drone.sysid == activesys) {
                            return dronedata.antenna.connected ? (
                                <>
                                    <div className="box">
                                        <div className="divider">
                                            Kraken {activesys} Data
                                        </div>
                                        Direction Reading:{" "}
                                        {dronedata.antenna.reading.toFixed(2)}
                                        <br></br>
                                        Collecting:{" "}
                                        {dronedata.antenna.collecting
                                            ? "🟢"
                                            : "🔴"}
                                        <br></br>
                                        Center Frequency:{" "}
                                        {dronedata.antenna.frequency}
                                    </div>
                                </>
                            ) : (
                                <div style={{ color: "red" }}>
                                    Sensor Not Connected
                                </div>
                            );
                        }
                    })}

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
                            dronesdata={dronesdata}
                            antenna={antenna}
                            mode={mode}
                            setmode={setmode}
                            activesys={activesys}
                            sendCommand={sendCommand}
                            setplotting={setplotting}
                            DFdata={
                                dronesdata[activesys - 1]
                                    ? dronesdata[activesys - 1].DFdata
                                          .measurements
                                    : []
                            }
                            setnum2plot={setnum2plot}
                            averagelines={averagelines}
                            setaveragelines={setaveragelines}
                            setaveraging={setaveraging}
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
                        {/*
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
                        */}
                        <div
                            style={{
                                flex: 1,
                                fontSize: 15,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "30px",
                            }}
                        >
                            <Button
                                text={"Center Drone"}
                                onpress={() => {
                                    setmapppos({
                                        lat: dronesdata[activesys - 1].drone
                                            .lat,
                                        lng: dronesdata[activesys - 1].drone
                                            .lng,
                                    });
                                    setviewstate({
                                        latitude:
                                            dronesdata[activesys - 1].drone.lat,
                                        longitude:
                                            dronesdata[activesys - 1].drone.lng,
                                        zoom: 16,
                                    });
                                }}
                                style={{ flex: 1 }}
                            ></Button>
                            <Button
                                text={"Get radio"}
                                onpress={() => {
                                    setradio({
                                        lat: dronesdata[activesys - 1].drone
                                            .lat,
                                        lng: dronesdata[activesys - 1].drone
                                            .lng,
                                    });
                                }}
                                style={{ flex: 1 }}
                            ></Button>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}></div>
                    {/*

                    <Dronemap
                        dronesdata={dronesdata}
                        radio={radio}
                        setradio={setradio}
                        antenna={antenna}
                        status={status}
                        mappos={mappos}
                        DFdata={DFdata}
                        recentdf={recentdf}
                        num2plot={num2plot}
                        plotting={plotting}
                        averagelines={averagelines}
                    ></Dronemap>

                    */}
                    {/*  */}
                    <Dronemapoffline
                        style={{ width: "100%", height: "100%" }}
                        width={"10"}
                        dronesdata={dronesdata}
                        radio={radio}
                        setradio={setradio}
                        antenna={antenna}
                        status={status}
                        mappos={mappos}
                        DFdata={DFdata}
                        recentdf={recentdf}
                        num2plot={num2plot}
                        plotting={plotting}
                        averagelines={averagelines}
                        viewstate={viewstate}
                        setviewstate={setviewstate}
                    ></Dronemapoffline>
                </div>
            </div>
        </>
    );
}

export default App;
