import * as React from "react";
import { Map, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Libreline from "./Libreline";
import { useEffect } from "react";
import { useState } from "react";

function directionTo(initial, final) {
    return Math.atan2(final.lng - initial.lng, final.lat - initial.lat);
}

export default function Dronemapoffline({
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
    viewstate,
    setviewstate,
}) {
    const [dragpos, setdragpos] = React.useState({
        lat: radio.lat,
        lng: radio.lng,
    });

    useEffect(() => {
        setdragpos({ lat: radio.lat, lng: radio.lng });
        console.log("newpos: ", { lat: radio.lat, lng: radio.lng });
    }, [radio]);

    // Memoize the map style to prevent recreation on every render
    const mapStyle = React.useMemo(
        () => ({
            version: 8,
            name: "Offline map",
            sources: {
                "offline-tiles": {
                    type: "raster",
                    tiles: [
                        "http://localhost:8004/data/daytonsat/{z}/{x}/{y}.png",
                    ],
                    tileSize: 256,
                    minzoom: 12,
                    maxzoom: 19,
                },
            },
            layers: [
                {
                    id: "offline-raster-layer",
                    type: "raster",
                    source: "offline-tiles",
                    minzoom: 12,
                    maxzoom: 19,
                },
            ],
        }),
        []
    ); // Empty dependency array - never recreate

    return (
        <Map
            initialViewState={{
                minZoom: 12, // limit zoom out to tile coverage minzoom
                maxZoom: 19, // limit zoom in to tile maxzoom
            }}
            {...viewstate}
            onMove={(evt) => setviewstate(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapLib={import("maplibre-gl")}
            fadeDuration={300}
            /*ONLINE MAPS*/
            //custom dark
            //mapStyle="https://api.maptiler.com/maps/01989f9b-9dca-7b22-b3be-1db01440491d/style.json?key=nvNDT4UnrcQLPi8UBRlA"
            //satellite
            //mapStyle="https://api.maptiler.com/maps/satellite/style.json?key=nvNDT4UnrcQLPi8UBRlA"
            /*OFFLINE MAPS*/

            mapStyle={mapStyle}
        >
            {/*Drone Data*/}
            {dronesdata.map((dronedata, index) => {
                return (
                    <React.Fragment key={index}>
                        <Marker
                            longitude={dronedata.drone.lng}
                            latitude={dronedata.drone.lat}
                        >
                            <div
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: "#8E9DB4",
                                    borderRadius: "100%",
                                    border: "2px solid #CCE0FF",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "15px",
                                    //transform: "translate(-50%, -50%)",
                                }}
                            >
                                🚁{dronedata.drone.sysid}
                            </div>
                        </Marker>

                        {/*headingline*/}
                        <Libreline
                            start={{
                                lat: dronedata.drone.lat,
                                lng: dronedata.drone.lng,
                            }}
                            end={{
                                lat:
                                    dronedata.drone.lat +
                                    0.0003 *
                                        Math.cos(
                                            (dronedata.drone.hdg * Math.PI) /
                                                180
                                        ),
                                lng:
                                    dronedata.drone.lng +
                                    0.0003 *
                                        Math.sin(
                                            (dronedata.drone.hdg * Math.PI) /
                                                180
                                        ),
                            }}
                            color={"#0000FF"}
                            width={3}
                            id={`lineLayer-${dronedata.drone.sysid}`}
                        ></Libreline>
                        {/*Radio*/}
                        <Marker
                            longitude={dragpos.lng}
                            latitude={dragpos.lat}
                            draggable={true}
                            onDrag={(e) => {
                                setdragpos({
                                    lat: e.lngLat.lat ?? 0,
                                    lng: e.lngLat.lng ?? 0,
                                });
                            }}
                            onDragEnd={(e) => {
                                setradio({
                                    lat: e.lngLat.lat ?? 0,
                                    lng: e.lngLat.lng ?? 0,
                                });
                                console.log("lat: ", e.lngLat.lat);
                            }}
                        >
                            <div
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor: "#8E9DB4",
                                    borderRadius: "100%",
                                    border: "2px solid #CCE0FF",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "15px",
                                    //transform: "translate(-50%, -50%)",
                                }}
                            >
                                💥
                            </div>
                        </Marker>
                        {/*current DF line*/}
                        {dronedata.DFdata.recent && (
                            <Libreline
                                start={{
                                    lat: dronedata.DFdata.recent.lat * 1e-7,
                                    lng: dronedata.DFdata.recent.lng * 1e-7,
                                }}
                                end={{
                                    lat:
                                        dronedata.DFdata.recent.lat * 1e-7 +
                                        0.0005 *
                                            Math.cos(
                                                ((dronedata.DFdata.recent.hdg +
                                                    dronedata.DFdata.recent
                                                        .data) *
                                                    Math.PI) /
                                                    180
                                            ),
                                    lng:
                                        dronedata.DFdata.recent.lng * 1e-7 +
                                        0.0005 *
                                            Math.sin(
                                                ((dronedata.DFdata.recent.hdg +
                                                    dronedata.DFdata.recent
                                                        .data) *
                                                    Math.PI) /
                                                    180
                                            ),
                                }}
                                color={"#CCE0FF"}
                                width={2}
                                id={`DFlayer-${dronedata.drone.sysid}`}
                            ></Libreline>
                        )}
                        {/*All DFlines*/}
                        {dronedata.DFdata.measurements.length > 0 &&
                            dronedata.DFdata.measurements.map((line, index) => {
                                return (
                                    index < num2plot && (
                                        <Libreline
                                            start={{
                                                lat: line.lat * 1e-7,
                                                lng: line.lng * 1e-7,
                                            }}
                                            end={{
                                                lat:
                                                    line.lat * 1e-7 +
                                                    0.004 *
                                                        Math.cos(
                                                            ((line.hdg +
                                                                line.data) *
                                                                Math.PI) /
                                                                180
                                                        ),
                                                lng:
                                                    line.lng * 1e-7 +
                                                    0.004 *
                                                        Math.sin(
                                                            ((line.hdg +
                                                                line.data) *
                                                                Math.PI) /
                                                                180
                                                        ),
                                            }}
                                            color={"#CCE0FF"}
                                            width={2}
                                            id={`DFlayer-${dronedata.drone.sysid}-${index}`}
                                        ></Libreline>
                                    )
                                );
                            })}
                        {/*line to radio*/}
                        <Libreline
                            start={{
                                lat: dronedata.drone.lat,
                                lng: dronedata.drone.lng,
                            }}
                            end={{
                                lat:
                                    dronedata.drone.lat +
                                    0.0002 *
                                        Math.cos(
                                            directionTo(dronedata.drone, radio)
                                        ),
                                lng:
                                    dronedata.drone.lng +
                                    0.0002 *
                                        Math.sin(
                                            directionTo(dronedata.drone, radio)
                                        ),
                            }}
                            color={"#1DA746"}
                            width={2}
                            id={`radiolayer-${dronedata.drone.sysid}`}
                        ></Libreline>
                    </React.Fragment>
                );
            })}
        </Map>
    );
}
