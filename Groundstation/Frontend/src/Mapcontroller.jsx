import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

export default function Mapcontroller({ mappos }) {
    var mapRef = useMap();

    useEffect(() => {
        mapRef && mapRef.panTo(mappos);
    }, [mappos]);

    return;
}
