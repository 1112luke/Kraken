import Button from "./Button";
import Dropdown from "./Dropdown";

export default function Dronescreen({
    drone,
    antenna,
    mode,
    setmode,
    movespeed,
}) {
    return (
        <>
            <div className="box" id="parameters">
                <br></br>
                {/* mode selector*/}
                {mode == "none" && <div>Select a Mode</div>}
                <Dropdown
                    value={mode}
                    values={[
                        "none",
                        "locationfollow",
                        "debug",
                        "radiofollow",
                        "eyeofender",
                    ]}
                    setvalue={setmode}
                ></Dropdown>
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
                                sendCommand("setmovespeed", e.target.value / 2);
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
                        {status == "searching" || status == "tracking" ? (
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
                                sendCommand("setrotationspeed", e.target.value);
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
                                sendCommand("setmovespeed", e.target.value / 2);
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
                                sendCommand("setdatarate", e.target.value);
                            }}
                        ></input>
                        Sweepwidth (degrees): {sweepwidth}
                        <input
                            type="range"
                            min={0}
                            max={360}
                            value={sweepwidth}
                            disabled={status == "tracking" ? true : false}
                            onChange={(e) => {
                                setsweepwidth(e.target.value);
                                sendCommand("setsweepwidth", e.target.value);
                            }}
                        ></input>
                        <div>
                            Radiomode:
                            <Button
                                text="Simulation"
                                onpress={() => [sendCommand("setradiomode", 0)]}
                            ></Button>
                            <br></br>
                            <Button
                                text="Real"
                                onpress={() => [sendCommand("setradiomode", 1)]}
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
                                sendCommand("setrotationspeed", e.target.value);
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
                                sendCommand("setdatarate", e.target.value);
                            }}
                        ></input>
                    </>
                )}
            </div>
        </>
    );
}
