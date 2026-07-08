import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { LatLng } from '../api/routes';

// Cores dos caminhos (batem com as bolinhas dos cards)
export const ROUTE_COLORS = ['#5AA0D8', '#E0913F', '#B57BD6'];

interface Props {
  routes: { points: LatLng[] }[];
  selectedIndex: number | null;
  height?: number;
}

function buildHtml(routes: { points: LatLng[] }[], selected: number): string {
  const data = routes.map(r => r.points.map(p => [p.lat, p.lng]));
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#e9e5de}
  .leaflet-control-zoom a{width:34px;height:34px;line-height:34px;font-size:20px}
</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var routes = ${JSON.stringify(data)};
  var palette = ${JSON.stringify(ROUTE_COLORS)};
  var map = L.map('map',{zoomControl:true,attributionControl:false,dragging:true,touchZoom:true,scrollWheelZoom:false,doubleClickZoom:true,boxZoom:false,keyboard:false});
  // OpenStreetMap padrão: mapa detalhado (ruas, nomes, POIs, referências), grátis
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  var lines = routes.map(function(pts,i){
    var c = palette[i%palette.length];
    // halo branco por baixo p/ contraste sobre o mapa claro + linha colorida por cima
    L.polyline(pts,{color:'#ffffff',weight:8,opacity:0.9,lineJoin:'round',lineCap:'round'}).addTo(map);
    return L.polyline(pts,{color:c,weight:4,opacity:0.85,lineJoin:'round',lineCap:'round'}).addTo(map);
  });
  var all=[]; routes.forEach(function(p){ all=all.concat(p); });
  if(all.length){ map.fitBounds(L.latLngBounds(all).pad(0.18)); }
  if(routes[0] && routes[0].length){
    var f=routes[0];
    L.circleMarker(f[0],{radius:5,color:'#fff',weight:2,fillColor:'#69B183',fillOpacity:1}).addTo(map);
    L.circleMarker(f[f.length-1],{radius:5,color:'#fff',weight:2,fillColor:'#D8625C',fillOpacity:1}).addTo(map);
  }
  window.__highlight=function(idx){
    lines.forEach(function(l,i){ l.setStyle({weight:i===idx?6:3, opacity:i===idx?1:0.4}); if(i===idx){ l.bringToFront(); } });
  };
  window.__highlight(${selected});
</script></body></html>`;
}

// Mapa (OpenStreetMap via WebView) mostrando os caminhos coloridos; o selecionado
// é destacado. Sem chave/billing — tiles gratuitos do OSM.
export function RouteMap({ routes, selectedIndex, height = 200 }: Props) {
  const ref = useRef<WebView>(null);
  // Reconstrói o HTML só quando os caminhos mudam; a seleção só re-estiliza.
  const html = useMemo(() => buildHtml(routes, selectedIndex ?? 0), [routes]);

  useEffect(() => {
    if (selectedIndex == null) return;
    ref.current?.injectJavaScript(`window.__highlight && window.__highlight(${selectedIndex}); true;`);
  }, [selectedIndex]);

  if (!routes.length) return null;

  return (
    <View>
      <View style={[styles.wrap, { height }]}>
        <WebView
          ref={ref}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.web}
          scrollEnabled={false}
          nestedScrollEnabled
          androidLayerType="hardware"
        />
      </View>
      <Text style={styles.attribution}>Mapa © OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#e9e5de' },
  attribution: { fontFamily: fonts.sans, fontSize: 9.5, color: colors.textMuted, marginTop: 4, textAlign: 'right' },
});
