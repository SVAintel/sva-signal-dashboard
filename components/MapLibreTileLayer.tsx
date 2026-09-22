"use client";

import { createLayerComponent, LayerProps, withPane } from "@react-leaflet/core";
import L from "leaflet";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapLibreTileLayerProps extends LayerProps {
  styleUrl: string;
  attribution?: string;
}

export const MapLibreTileLayer = createLayerComponent<L.MaplibreGL, MapLibreTileLayerProps>(
  function createTileLayer({ styleUrl, attribution, ...options }, context) {
    const layerOptions = {
      style: styleUrl,
      attributionControl: { customAttribution: attribution || "" },
      ...withPane(options, context),
    };
    const layer = L.maplibreGL(layerOptions);
    // The bridge creates its GL map during Leaflet's onAdd, not construction.
    layer.on("add", () => {
      const map = layer.getMaplibreMap();
      const tuneStyle = () => {
        if (map.getSource("ne2_shaded") && !map.getLayer("relief-shading")) {
          map.addLayer({
            id: "relief-shading", type: "raster", source: "ne2_shaded",
            paint: {
              "raster-opacity": 0.36, "raster-saturation": -1,
              "raster-brightness-max": 0.45, "raster-contrast": 0.1,
            },
          }, map.getLayer("water") ? "water" : undefined);
        }
        for (const id of ["place_country_other", "place_country_minor", "place_country_major"]) {
          if (!map.getLayer(id)) continue;
          map.setPaintProperty(id, "text-color", "#c4c7bd");
          map.setPaintProperty(id, "text-halo-color", "#172024");
          map.setPaintProperty(id, "text-halo-width", 1.2);
          map.setLayoutProperty(id, "text-field", [
            "coalesce", ["get", "name_en"], ["get", "name:en"], ["get", "name:latin"], ["get", "name"],
          ]);
          map.setLayoutProperty(id, "text-size", ["interpolate", ["linear"], ["zoom"], 0, 11, 4, 13]);
          map.setLayoutProperty(id, "text-allow-overlap", false);
          map.setLayoutProperty(id, "text-ignore-placement", false);
          map.setLayoutProperty(id, "text-padding", 4);
        }
        if (map.getLayer("place_country_minor")) map.setLayerZoomRange("place_country_minor", 1.4, 6);
        if (map.getLayer("place_country_other")) map.setLayerZoomRange("place_country_other", 2.4, 6);
        for (const id of ["boundary_country_z0-4", "boundary_country_z5-"]) {
          if (map.getLayer(id)) map.setPaintProperty(id, "line-color", "#62716b");
        }
        if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", "#101b23");
        for (const id of ["landcover_ice_shelf", "landcover_glacier"]) {
          if (map.getLayer(id)) map.setPaintProperty(id, "fill-color", "#303d3d");
        }
      };
      map.on("style.load", tuneStyle);
      if (map.isStyleLoaded()) tuneStyle();
    });
    return { instance: layer, context };
  },
  function updateTileLayer(layer, props, previous) {
    if (props.styleUrl !== previous.styleUrl) layer.getMaplibreMap().setStyle(props.styleUrl);
  },
);
