import React, { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";

export default function Libreline({
    start,
    end,
    color = "#007cbf",
    width = 4,
    id,
}) {
    // Memoize GeoJSON source data:
    const geojson = useMemo(
        () => ({
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [start.lng, start.lat],
                    [end.lng, end.lat],
                ],
            },
        }),
        [start.lat, start.lng, end.lat, end.lng]
    );

    // Memoize layer style:
    const layerStyle = useMemo(
        () => ({
            id,
            type: "line",
            source: id + "Source",
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": color,
                "line-width": width,
            },
            minzoom: 12,
            maxzoom: 19,
        }),
        [id, color, width]
    );

    return (
        <>
            <Source id={id + "Source"} type="geojson" data={geojson} />
            <Layer {...layerStyle} />
        </>
    );
}
