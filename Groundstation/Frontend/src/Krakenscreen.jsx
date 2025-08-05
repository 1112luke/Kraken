import { useState } from "react";
import Button from "./Button";
import Dropdown from "./Dropdown";

export default function Krakenscreen({
    mode,
    setmode,
    sendCommand,
    setplotting,
    DFdata,
    setnum2plot,
    activesys,
    radio,
}) {
    const [currfreq, setcurrfreq] = useState(915);

    return (
        <>
            <div className="box">
                <div>KRAKEN {activesys} CONTROL:</div>
                <br></br>
                <div>
                    <Button
                        onpress={() => {
                            sendCommand("setcollecting", 1);
                        }}
                        text={"Start Collecting"}
                    ></Button>
                    <br></br>
                    <Button
                        onpress={() => {
                            sendCommand("setcollecting", 0);
                        }}
                        text={"Stop Collecting"}
                    ></Button>
                    <br></br>
                    <Button
                        onpress={() => {
                            sendCommand("clearlines", 0);
                            setnum2plot(1000);
                            setplotting(true);
                        }}
                        text={"Start Plotting"}
                    ></Button>
                    <br></br>
                    <Button
                        onpress={() => {
                            console.log(DFdata);
                            setplotting(false);
                            setnum2plot(DFdata.length);
                            console.log("settingnum2plot: ", DFdata.length);
                        }}
                        text={"Stop Plotting"}
                    ></Button>
                    <br></br>
                    <Button
                        onpress={() => {
                            sendCommand("clearlines", 0);
                            setnum2plot(0);
                        }}
                        text={"Clear Lines"}
                    ></Button>
                    <br></br>
                    <div style={{ margin: "auto", textAlign: "center" }}>
                        Enter Center Frequency (MHZ): <br></br>
                        <br></br>
                        <input
                            type="text"
                            value={currfreq}
                            onChange={(e) => {
                                setcurrfreq(e.target.value);
                            }}
                        ></input>
                    </div>
                    <br></br>
                    <Button
                        onpress={() => {
                            sendCommand("setfrequency", currfreq);
                        }}
                        text={"Change Center Frequency"}
                    ></Button>
                    <br></br>
                </div>
            </div>
        </>
    );
}
