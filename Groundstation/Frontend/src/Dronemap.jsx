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
    dronesdata,
    radio,
    antenna,
    setradio,
    circledata,
    sweepdata,
    status,
    mappos,
    DFdata,
    recentdf,
    num2plot,
    averagelines,
}) {
    return (
        <APIProvider apiKey={"AIzaSyAPlCn3s3ZjpUwKW6fqoKm5lXxpG3eHBCw"}>
            <Mapcontroller mappos={mappos}></Mapcontroller>
            <Map
                defaultCenter={{ lat: -35.3632621, lng: 149.1652374 }}
                gestureHandling={"greedy"}
                defaultZoom={18}
                disableDefaultUI={true}
                colorScheme="DARK"
                mapId={"56089b1b34f21274 "}
            >
                {/*Radio*/}
                <AdvancedMarker
                    position={radio}
                    draggable
                    onDragEnd={(e) => {
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
                        💥
                    </Pin>
                </AdvancedMarker>

                {dronesdata.map((dronedata) => {
                    return (
                        <>
                            <AdvancedMarker
                                position={{
                                    lat: dronedata.drone.lat,
                                    lng: dronedata.drone.lng,
                                }}
                                clickable={true}
                                onClick={() => alert("marker was clicked!")}
                                title={"Drone"}
                            >
                                <Pin
                                    background={"#8E9DB4"}
                                    borderColor={"#CCE0FF"}
                                    scale={1.6}
                                >
                                    🚁{dronedata.drone.sysid}
                                </Pin>
                            </AdvancedMarker>
                            <AdvancedMarker
                                position={{
                                    lat: dronedata.antenna.lat,
                                    lng: dronedata.antenna.lng,
                                }}
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
                                    {
                                        lat: dronedata.drone.lat,
                                        lng: dronedata.drone.lng,
                                    },
                                    {
                                        lat:
                                            dronedata.drone.lat +
                                            0.0003 *
                                                Math.cos(
                                                    (dronedata.drone.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                        lng:
                                            dronedata.drone.lng +
                                            0.0003 *
                                                Math.sin(
                                                    (dronedata.drone.hdg *
                                                        Math.PI) /
                                                        180
                                                ),
                                    },
                                ]}
                                strokeColor="#0000FF"
                                strokeOpacity={0.8}
                                strokeWeight={2}
                            />
                            {/*Current DFline*/}
                            {dronedata.DFdata.recent && (
                                <Polyline
                                    path={[
                                        {
                                            lat:
                                                dronedata.DFdata.recent.lat *
                                                1e-7,
                                            lng:
                                                dronedata.DFdata.recent.lng *
                                                1e-7,
                                        },
                                        {
                                            lat:
                                                dronedata.DFdata.recent.lat *
                                                    1e-7 +
                                                0.0005 *
                                                    Math.cos(
                                                        ((dronedata.DFdata
                                                            .recent.hdg +
                                                            dronedata.DFdata
                                                                .recent.data) *
                                                            Math.PI) /
                                                            180
                                                    ),
                                            lng:
                                                dronedata.DFdata.recent.lng *
                                                    1e-7 +
                                                0.0005 *
                                                    Math.sin(
                                                        ((dronedata.DFdata
                                                            .recent.hdg +
                                                            dronedata.DFdata
                                                                .recent.data) *
                                                            Math.PI) /
                                                            180
                                                    ),
                                        },
                                    ]}
                                    strokeColor="#CCE0FF"
                                    strokeOpacity={0.8}
                                    strokeWeight={3}
                                />
                            )}
                            {/*All DFlines*/}
                            {dronedata.DFdata.measurements.length > 0 &&
                                dronedata.DFdata.measurements.map(
                                    (line, index) => {
                                        return (
                                            index < num2plot && (
                                                <Polyline
                                                    key={index}
                                                    path={[
                                                        {
                                                            lat:
                                                                line.lat * 1e-7,
                                                            lng:
                                                                line.lng * 1e-7,
                                                        },
                                                        {
                                                            lat:
                                                                line.lat *
                                                                    1e-7 +
                                                                0.002 *
                                                                    Math.cos(
                                                                        ((line.hdg +
                                                                            line.data) *
                                                                            Math.PI) /
                                                                            180
                                                                    ),
                                                            lng:
                                                                line.lng *
                                                                    1e-7 +
                                                                0.002 *
                                                                    Math.sin(
                                                                        ((line.hdg +
                                                                            line.data) *
                                                                            Math.PI) /
                                                                            180
                                                                    ),
                                                        },
                                                    ]}
                                                    strokeColor="#CCE0FF"
                                                    strokeOpacity={0.8}
                                                    strokeWeight={3}
                                                />
                                            )
                                        );
                                    }
                                )}
                            {/* Averaged lines */}
                            {averagelines &&
                                averagelines.map((lineGroup, groupIndex) => {
                                    if (lineGroup.length === 0) return null;

                                    // Compute average lat, lng, and dir
                                    const avgLat =
                                        lineGroup.reduce(
                                            (sum, p) => sum + parseFloat(p.lat),
                                            0
                                        ) / lineGroup.length;
                                    const avgLng =
                                        lineGroup.reduce(
                                            (sum, p) => sum + parseFloat(p.lng),
                                            0
                                        ) / lineGroup.length;

                                    // Average direction is tricky due to circular nature, so use vector average
                                    const avgDirRad = Math.atan2(
                                        lineGroup.reduce(
                                            (sum, p) =>
                                                sum +
                                                Math.sin(
                                                    (p.dir * Math.PI) / 180
                                                ),
                                            0
                                        ) / lineGroup.length,
                                        lineGroup.reduce(
                                            (sum, p) =>
                                                sum +
                                                Math.cos(
                                                    (p.dir * Math.PI) / 180
                                                ),
                                            0
                                        ) / lineGroup.length
                                    );

                                    const avgDirDeg =
                                        (avgDirRad * 180) / Math.PI;

                                    return (
                                        <Polyline
                                            key={`avgline-${groupIndex}`}
                                            path={[
                                                { lat: avgLat, lng: avgLng },
                                                {
                                                    lat:
                                                        avgLat +
                                                        0.002 *
                                                            Math.cos(avgDirRad),
                                                    lng:
                                                        avgLng +
                                                        0.002 *
                                                            Math.sin(avgDirRad),
                                                },
                                            ]}
                                            strokeColor="yellow"
                                            strokeOpacity={0.9}
                                            strokeWeight={3}
                                        />
                                    );
                                })}
                            {/*lines for circledata*/}
                            {dronedata.circledata.circle &&
                                dronedata.circledata.circle.map(
                                    (measurement, index) => {
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
                                    }
                                )}
                            {dronedata.circledata.maxlines &&
                                dronedata.circledata.maxlines.map(
                                    (line, index) => {
                                        return (
                                            <Polyline
                                                key={index}
                                                path={[
                                                    {
                                                        lat: line.lat,
                                                        lng: line.lng,
                                                    },
                                                    {
                                                        lat:
                                                            line.lat +
                                                            0.002 *
                                                                Math.cos(
                                                                    (line.hdg *
                                                                        Math.PI) /
                                                                        180
                                                                ),
                                                        lng:
                                                            line.lng +
                                                            0.002 *
                                                                Math.sin(
                                                                    (line.hdg *
                                                                        Math.PI) /
                                                                        180
                                                                ),
                                                    },
                                                ]}
                                                strokeColor={"Green"}
                                                strokeOpacity={0.9}
                                                strokeWeight={3}
                                            ></Polyline>
                                        );
                                    }
                                )}
                            {/*lines for sweep*/}
                            {dronedata.sweepdata.sweep &&
                                dronedata.sweepdata.sweep.map(
                                    (measurement, index) => {
                                        return (
                                            <Polyline
                                                key={index}
                                                path={[
                                                    {
                                                        lat: dronedata.drone
                                                            .lat,
                                                        lng: dronedata.drone
                                                            .lng,
                                                    },
                                                    {
                                                        lat:
                                                            dronedata.drone
                                                                .lat +
                                                            0.0004 *
                                                                Math.cos(
                                                                    (measurement.hdg *
                                                                        Math.PI) /
                                                                        180
                                                                ),
                                                        lng:
                                                            dronedata.drone
                                                                .lng +
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
                                                    dronedata.sweepdata.sweep
                                                )}
                                                strokeOpacity={0.9}
                                                strokeWeight={3}
                                            ></Polyline>
                                        );
                                    }
                                )}
                            {dronedata.sweepdata.target &&
                                status == "tracking" && (
                                    <Polyline
                                        path={[
                                            {
                                                lat: dronedata.drone.lat,
                                                lng: dronedata.drone.lng,
                                            },
                                            {
                                                lat:
                                                    dronedata.drone.lat +
                                                    0.002 *
                                                        Math.cos(
                                                            (dronedata.sweepdata
                                                                .target *
                                                                Math.PI) /
                                                                180
                                                        ),
                                                lng:
                                                    dronedata.drone.lng +
                                                    0.002 *
                                                        Math.sin(
                                                            (dronedata.sweepdata
                                                                .target *
                                                                Math.PI) /
                                                                180
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
                                    {
                                        lat: dronedata.drone.lat,
                                        lng: dronedata.drone.lng,
                                    },
                                    {
                                        lat:
                                            dronedata.drone.lat +
                                            0.0002 *
                                                Math.cos(
                                                    directionTo(
                                                        dronedata.drone,
                                                        radio
                                                    )
                                                ),
                                        lng:
                                            dronedata.drone.lng +
                                            0.0002 *
                                                Math.sin(
                                                    directionTo(
                                                        dronedata.drone,
                                                        radio
                                                    )
                                                ),
                                    },
                                ]}
                                strokeColor="green"
                                strokeOpacity={0.8}
                                strokeWeight={2}
                            />
                        </>
                    );
                })}
            </Map>
        </APIProvider>
    );
}
