import {
    AdvancedMarker,
    APIProvider,
    Map,
    Marker,
    Pin,
    useMap,
} from "@vis.gl/react-google-maps";
import { Polyline } from "./components/polyline";
import chroma from "chroma-js";
import { useEffect, useRef } from "react";
import Mapcontroller from "./Mapcontroller";

function directionTo(initial, final) {
    return Math.atan2(final.lng - initial.lng, final.lat - initial.lat);
}

function colorScale(m1, list) {
    //get value from 0 to 1
    //get min and max
    var min = Infinity;
    var max = -1;
    for (var i = 0; i < list.length; i++) {
        if (list[i].data < min) {
            min = list[i].data;
        }
        if (list[i].data > max) {
            max = list[i].data;
        }
    }
    var scale = chroma.scale(["red", "yellow", "green"]);
    var value = (m1 - min) / (max - min);
    return scale(value).hex();
}

export default function Dronemap({
    drone,
    radio,
    antenna,
    setradio,
    circledata,
    sweepdata,
    status,
    mappos,
}) {
    return (
        <APIProvider apiKey={"AIzaSyAPlCn3s3ZjpUwKW6fqoKm5lXxpG3eHBCw"}>
            <Mapcontroller mappos={mappos}></Mapcontroller>
            <Map
                defaultCenter={{ lat: -35.3632621, lng: 149.1652374 }}
                gestureHandling={"greedy"}
                defaultZoom={18}
                disableDefaultUI={true}
                mapId={"56089b1b34f21274 "}
            >
                <AdvancedMarker
                    position={radio}
                    draggable
                    onDrag={(e) => {
                        setradio({
                            lat: e.latLng?.lat() ?? 0,
                            lng: e.latLng?.lng() ?? 0,
                        });
                    }}
                    title={"Radio"}
                >
                    <Pin
                        background={"#22ccff"}
                        borderColor={"#1e89a1"}
                        scale={1.4}
                    >
                        📻
                    </Pin>
                </AdvancedMarker>
                <AdvancedMarker
                    position={{ lat: drone.lat, lng: drone.lng }}
                    clickable={true}
                    onClick={() => alert("marker was clicked!")}
                    title={"Drone"}
                >
                    <Pin scale={1.6}>🚁</Pin>
                </AdvancedMarker>
                <AdvancedMarker
                    position={{ lat: antenna.lat, lng: antenna.lng }}
                    clickable={true}
                    title={"Antenna"}
                >
                    <Pin
                        background={"#22ccff"}
                        borderColor={"#1e89a1"}
                        scale={0.7}
                    >
                        📡
                    </Pin>
                </AdvancedMarker>

                {/*headingline*/}
                <Polyline
                    path={[
                        { lat: drone.lat, lng: drone.lng },
                        {
                            lat:
                                drone.lat +
                                0.0003 * Math.cos((drone.hdg * Math.PI) / 180),
                            lng:
                                drone.lng +
                                0.0003 * Math.sin((drone.hdg * Math.PI) / 180),
                        },
                    ]}
                    strokeColor="#0000FF"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                />

                {/*lines for circledata*/}
                {circledata.circle &&
                    circledata.circle.map((measurement, index) => {
                        return (
                            <Polyline
                                key={index}
                                path={[
                                    {
                                        lat: measurement.lat,
                                        lng: measurement.lng,
                                    },
                                    {
                                        lat:
                                            measurement.lat +
                                            0.0004 *
                                                Math.cos(
                                                    (measurement.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                        lng:
                                            measurement.lng +
                                            0.0004 *
                                                Math.sin(
                                                    (measurement.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                    },
                                ]}
                                strokeColor={colorScale(
                                    measurement.data,
                                    circledata.circle
                                )}
                                strokeOpacity={0.9}
                                strokeWeight={3}
                            ></Polyline>
                        );
                    })}
                {circledata.maxlines &&
                    circledata.maxlines.map((line, index) => {
                        return (
                            <Polyline
                                key={index}
                                path={[
                                    { lat: line.lat, lng: line.lng },
                                    {
                                        lat:
                                            line.lat +
                                            0.002 *
                                                Math.cos(
                                                    (line.hdg * Math.PI) / 180
                                                ),
                                        lng:
                                            line.lng +
                                            0.002 *
                                                Math.sin(
                                                    (line.hdg * Math.PI) / 180
                                                ),
                                    },
                                ]}
                                strokeColor={"Green"}
                                strokeOpacity={0.9}
                                strokeWeight={3}
                            ></Polyline>
                        );
                    })}

                {/*lines for sweep*/}
                {sweepdata.sweep &&
                    sweepdata.sweep.map((measurement, index) => {
                        return (
                            <Polyline
                                key={index}
                                path={[
                                    { lat: drone.lat, lng: drone.lng },
                                    {
                                        lat:
                                            drone.lat +
                                            0.0004 *
                                                Math.cos(
                                                    (measurement.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                        lng:
                                            drone.lng +
                                            0.0004 *
                                                Math.sin(
                                                    (measurement.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                    },
                                ]}
                                strokeColor={colorScale(
                                    measurement.data,
                                    sweepdata.sweep
                                )}
                                strokeOpacity={0.9}
                                strokeWeight={3}
                            ></Polyline>
                        );
                    })}

                {sweepdata.target && status == "tracking" && (
                    <Polyline
                        path={[
                            { lat: drone.lat, lng: drone.lng },
                            {
                                lat:
                                    drone.lat +
                                    0.002 *
                                        Math.cos(
                                            (sweepdata.target * Math.PI) / 180
                                        ),
                                lng:
                                    drone.lng +
                                    0.002 *
                                        Math.sin(
                                            (sweepdata.target * Math.PI) / 180
                                        ),
                            },
                        ]}
                        strokeColor={"Green"}
                        strokeOpacity={0.9}
                        strokeWeight={2}
                    ></Polyline>
                )}

                {/*line to radio*/}
                <Polyline
                    path={[
                        { lat: drone.lat, lng: drone.lng },
                        {
                            lat:
                                drone.lat +
                                0.0002 * Math.cos(directionTo(drone, radio)),
                            lng:
                                drone.lng +
                                0.0002 * Math.sin(directionTo(drone, radio)),
                        },
                    ]}
                    strokeColor="green"
                    strokeOpacity={0.8}
                    strokeWeight={2}
                />
            </Map>
        </APIProvider>
    );
}
