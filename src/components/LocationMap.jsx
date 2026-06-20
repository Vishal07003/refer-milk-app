import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { DEFAULT_REGION } from '../services/location';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const BRAND = '#2D5A36';

function buildMapHtml(latitude, longitude, zoom, showMarker) {
  const markerScript = showMarker
    ? `
      L.circleMarker([${latitude}, ${longitude}], {
        radius: 10,
        color: '${BRAND}',
        fillColor: '${BRAND}',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
    `
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background: #e8f0ea;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([${latitude}, ${longitude}], ${zoom});

      L.tileLayer('${OSM_TILE_URL}', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      ${markerScript}
    </script>
  </body>
</html>`;
}

export default function LocationMap({ latitude, longitude, height = 200 }) {
  const hasLocation = latitude != null && longitude != null;
  const lat = latitude ?? DEFAULT_REGION.latitude;
  const lng = longitude ?? DEFAULT_REGION.longitude;
  const zoom = hasLocation ? 15 : 12;

  const html = useMemo(
    () => buildMapHtml(lat, lng, zoom, hasLocation),
    [lat, lng, zoom, hasLocation],
  );

  const mapKey = hasLocation ? `${lat}-${lng}` : 'default';

  return (
    <View style={[styles.container, { height }]} collapsable={false}>
      <WebView
        key={mapKey}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="none"
        setBuiltInZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pointerEvents="none"
      />
      <Text style={styles.attribution} pointerEvents="none">
        © OpenStreetMap
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#E8F0EA',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    fontSize: 9,
    color: '#4B5563',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
