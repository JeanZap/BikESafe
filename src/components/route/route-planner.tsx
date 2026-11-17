import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
} from '@maplibre/maplibre-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserLocationMarker } from '@/components/home/user-location-marker';
import { Icon } from '@/components/icon';
import { AnnotationMarker } from '@/components/map/annotation-marker';
import { DestinationMarker } from '@/components/route/destination-marker';
import { Brand, BrandShadow } from '@/constants/brand';
import { MAP_STYLE_URL } from '@/constants/map';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { buildRiskGradient } from '@/services/route-heat';
import { buildRouteOptions } from '@/services/route-options';
import {
  formatDistance,
  formatDuration,
  getBikeRoutes,
  getBounds,
  getMidpoint,
  isAbortError,
  type BikeRoute,
  type LngLat,
  RouteError,
} from '@/services/osrm';
import { useAnnotationsStore } from '@/store/annotations-store';
import { useNavigationStore } from '@/store/navigation-store';

type Props = {
  destination: { title: string; coordinates: LngLat };
  /** Posição do usuário no momento em que escolheu o destino (opcional). */
  initialOrigin: LngLat | null;
};

type State =
  | { status: 'waiting-location' }
  | { status: 'loading' }
  | { status: 'ready'; routes: BikeRoute[] }
  | { status: 'error'; message: string };

const ROUTE_SELECTED = '#14B8A6';
const ROUTE_OTHER = '#9AA8C7';

export function RoutePlanner({ destination, initialOrigin }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);

  const { position, status: locationStatus, retry: retryLocation } = useCurrentLocation();
  // A rota parte do ponto onde o usuário estava; não recalculamos a cada 10 m.
  const [origin, setOrigin] = useState<LngLat | null>(initialOrigin);
  useEffect(() => {
    if (!origin && position) setOrigin(position);
  }, [origin, position]);

  const [reversed, setReversed] = useState(false);
  const [state, setState] = useState<State>({ status: 'waiting-location' });
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (!origin) return;
    const from = reversed ? destination.coordinates : origin;
    const to = reversed ? origin : destination.coordinates;
    const controller = new AbortController();
    setState({ status: 'loading' });
    getBikeRoutes(from, to, controller.signal)
      .then((routes) => {
        setSelected(0);
        setState({ status: 'ready', routes });
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setState({
          status: 'error',
          message: err instanceof RouteError ? err.message : 'Erro ao calcular as rotas.',
        });
      });
    return () => controller.abort();
  }, [origin, reversed, destination.coordinates, attempt]);

  // Os alertas do mapa definem qual rota é a "Mais segura"; recalcula se alguém
  // reportar um alerta novo enquanto a tela está aberta.
  const annotations = useAnnotationsStore((s) => s.annotations);
  const routes = state.status === 'ready' ? state.routes : null;
  const options = useMemo(
    () => (routes ? buildRouteOptions(routes, annotations) : []),
    [routes, annotations]
  );
  const selectedNearby = options[selected]?.safety.nearby ?? [];

  // Enquadra todas as rotas acima da folha inferior.
  useEffect(() => {
    if (options.length === 0 || sheetHeight === 0) return;
    const coords = options.flatMap((o) => o.route.geometry.coordinates);
    cameraRef.current?.fitBounds(getBounds(coords), {
      padding: { top: 70, right: 50, bottom: sheetHeight + 30, left: 50 },
      duration: 800,
    });
  }, [options, sheetHeight]);

  const routesGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: options.map((o, index) => ({
        type: 'Feature',
        id: index,
        properties: { index, selected: index === selected ? 1 : 0 },
        geometry: o.route.geometry,
      })),
    }),
    [options, selected]
  );

  // Rota escolhida colorida pelo risco: trechos perto de alertas puxam para o vermelho.
  const selectedRoute = options[selected]?.route;
  const selectedHeat = useMemo(() => {
    if (!selectedRoute) return null;
    const gradient = buildRiskGradient(
      selectedRoute.geometry.coordinates,
      annotations,
      ROUTE_SELECTED
    );
    if (!gradient) return null;
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: selectedRoute.geometry,
    };
    return { feature, gradient };
  }, [selectedRoute, annotations]);

  const startNavigation = useNavigationStore((s) => s.start);

  /** Fixa a rota escolhida e volta ao mapa principal em modo navegação. */
  const startRoute = useCallback(() => {
    const option = options[selected];
    if (!option || !origin || reversed) return;
    startNavigation({
      destination,
      route: option.route,
      routeLabel: option.title,
    });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [options, selected, origin, reversed, destination, startNavigation, router]);

  const originLabel = 'Sua localização';
  const fromLabel = reversed ? destination.title : originLabel;
  const toLabel = reversed ? originLabel : destination.title;

  return (
    <View style={styles.container}>
      {/* Cabeçalho: voltar, origem/destino e inverter */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Icon name="back" size={20} color={Brand.text} />
        </Pressable>

        <View style={styles.endpoints}>
          <View style={styles.endpointRow}>
            {reversed ? <View style={styles.destDot} /> : <View style={styles.originDot} />}
            <Text style={[styles.endpointText, !reversed && styles.endpointMuted]} numberOfLines={1}>
              {fromLabel}
            </Text>
          </View>
          <View style={styles.endpointDivider} />
          <View style={styles.endpointRow}>
            {reversed ? <View style={styles.originDot} /> : <View style={styles.destDot} />}
            <Text style={[styles.endpointText, reversed && styles.endpointMuted]} numberOfLines={1}>
              {toLabel}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setReversed((r) => !r)}
          accessibilityRole="button"
          accessibilityLabel="Inverter origem e destino"
          hitSlop={8}
          style={({ pressed }) => [styles.swapButton, pressed && styles.pressed]}>
          <Icon name="swap" size={26} color={Brand.text} />
        </Pressable>
      </View>

      <View style={styles.mapArea}>
        <Map style={styles.map} mapStyle={MAP_STYLE_URL} logo={false} compass={false}
          attributionPosition={{ bottom: sheetHeight + 4, left: 8 }}>
          <Camera
            ref={cameraRef}
            initialViewState={{ center: destination.coordinates, zoom: 14 }}
          />

          {options.length > 0 && (
            <GeoJSONSource
              id="route-options"
              data={routesGeoJSON}
              hitbox={{ top: 12, right: 12, bottom: 12, left: 12 }}
              onPress={(e) => {
                const index = e.nativeEvent.features[0]?.properties?.index;
                if (typeof index === 'number') {
                  e.stopPropagation();
                  setSelected(index);
                }
              }}>
              <Layer
                id="route-options-casing"
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                  'line-sort-key': ['get', 'selected'],
                }}
                paint={{ 'line-color': '#FFFFFF', 'line-width': 10 }}
              />
              <Layer
                id="route-options-line"
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                  'line-sort-key': ['get', 'selected'],
                }}
                paint={{
                  'line-color': [
                    'case',
                    ['==', ['get', 'selected'], 1],
                    ROUTE_SELECTED,
                    ROUTE_OTHER,
                  ],
                  'line-width': 6,
                }}
              />
            </GeoJSONSource>
          )}

          {selectedHeat && (
            <GeoJSONSource id="route-selected-heat" data={selectedHeat.feature} lineMetrics>
              <Layer
                id="route-selected-heat-line"
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-gradient': selectedHeat.gradient, 'line-width': 6 }}
              />
            </GeoJSONSource>
          )}

          {options.map((o, index) => (
            <Marker
              key={`label-${index}`}
              id={`route-label-${index}`}
              lngLat={getMidpoint(o.route.geometry.coordinates)}
              anchor="center"
              onPress={() => setSelected(index)}>
              <View style={[styles.timeLabel, index === selected && styles.timeLabelSelected]}>
                <Text
                  style={[styles.timeLabelText, index === selected && styles.timeLabelTextSelected]}>
                  {formatDuration(o.route.durationS)}
                </Text>
              </View>
            </Marker>
          ))}

          {selectedNearby.map((a) => (
            <Marker key={a.id} id={`route-alert-${a.id}`} lngLat={a.coordinates} anchor="bottom">
              <AnnotationMarker type={a.type} selected={false} />
            </Marker>
          ))}

          {position && (
            <Marker id="user-location" lngLat={position} anchor="center">
              <UserLocationMarker />
            </Marker>
          )}

          <Marker id="destination" lngLat={destination.coordinates} anchor="bottom">
            <DestinationMarker />
          </Marker>
        </Map>

        {/* Folha inferior com as opções de rota */}
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}>
          <View style={styles.handle} />

          {(state.status === 'waiting-location' || state.status === 'loading') && (
            <View style={styles.message}>
              <ActivityIndicator color={Brand.blue} />
              <Text style={styles.messageText}>
                {state.status === 'loading'
                  ? 'Calculando rotas de bicicleta…'
                  : locationStatus === 'denied'
                    ? 'Permita o acesso à localização para traçar a rota.'
                    : 'Obtendo sua localização…'}
              </Text>
              {state.status === 'waiting-location' && locationStatus !== 'loading' && (
                <Pressable onPress={retryLocation} hitSlop={8}>
                  <Text style={styles.link}>Tentar de novo</Text>
                </Pressable>
              )}
            </View>
          )}

          {state.status === 'error' && (
            <View style={styles.message}>
              <Text style={styles.messageText}>{state.message}</Text>
              <Pressable onPress={() => setAttempt((a) => a + 1)} hitSlop={8}>
                <Text style={styles.link}>Tentar de novo</Text>
              </Pressable>
            </View>
          )}

          {state.status === 'ready' && (
            <>
              <Text style={styles.sheetTitle}>
                {options.length === 1 ? '1 ROTA DISPONÍVEL' : `${options.length} ROTAS DISPONÍVEIS`}
              </Text>

              <View style={styles.options}>
                {options.map((o, index) => {
                  const active = index === selected;
                  return (
                    <Pressable
                      key={o.kind}
                      onPress={() => setSelected(index)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.option,
                        active && styles.optionActive,
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.optionIcon}>
                        <Icon name={o.icon} size={20} color={Brand.teal} />
                      </View>
                      <View style={styles.optionText}>
                        <Text style={styles.optionTitle}>{o.title}</Text>
                        <Text
                          style={[
                            styles.optionSubtitle,
                            o.safety.hazardCount > 0 && styles.optionSubtitleWarning,
                          ]}
                          numberOfLines={1}>
                          {o.subtitle}
                        </Text>
                      </View>
                      <View style={styles.optionStats}>
                        <Text style={styles.optionDuration}>
                          {formatDuration(o.route.durationS)}
                        </Text>
                        <Text style={styles.optionDistance}>
                          {formatDistance(o.route.distanceM)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={startRoute}
                disabled={reversed}
                accessibilityRole="button"
                accessibilityState={{ disabled: reversed }}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.startButtonPressed,
                  reversed && styles.startButtonDisabled,
                ]}>
                <Text style={styles.startButtonText}>Iniciar rota</Text>
              </Pressable>
              {reversed && (
                <Text style={styles.startHint}>
                  A navegação parte da sua localização. Toque em ⇅ para voltar.
                </Text>
              )}

              <Text style={styles.attribution}>Rotas: OSRM · © colaboradores do OpenStreetMap</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.canvas },
  pressed: { opacity: 0.7 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Brand.canvas,
    zIndex: 10,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...BrandShadow,
    shadowOpacity: 0.08,
  },
  endpoints: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: Brand.inputBackground,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 38 },
  endpointDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginLeft: 26 },
  endpointText: { flex: 1, fontSize: 16, fontWeight: '600', color: Brand.text },
  endpointMuted: { fontWeight: '400', color: Brand.textMuted },
  originDot: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: Brand.blue,
    borderWidth: 2.5,
    borderColor: '#C9D8FF',
  },
  destDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Brand.navy, marginHorizontal: 2 },
  swapButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },

  mapArea: { flex: 1 },
  map: { flex: 1 },

  timeLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Brand.surface,
    borderWidth: 1.5,
    borderColor: '#D5DCE8',
  },
  timeLabelSelected: { backgroundColor: ROUTE_SELECTED, borderColor: ROUTE_SELECTED },
  timeLabelText: { fontSize: 15, fontWeight: '700', color: Brand.text },
  timeLabelTextSelected: { color: Brand.mintText },


  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Brand.surface,
    ...BrandShadow,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Brand.textMuted,
    marginBottom: 10,
    marginLeft: 2,
  },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
  },
  optionActive: { borderColor: ROUTE_SELECTED, backgroundColor: '#E8FBF6' },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '700', color: Brand.text },
  optionSubtitle: { fontSize: 13, color: Brand.textMuted, marginTop: 2 },
  optionSubtitleWarning: { color: Brand.danger, fontWeight: '600' },
  optionStats: { alignItems: 'flex-end' },
  optionDuration: { fontSize: 19, fontWeight: '700', color: Brand.text },
  optionDistance: { fontSize: 13, color: Brand.textMuted, marginTop: 2 },

  startButton: {
    marginTop: 14,
    height: 54,
    borderRadius: 27,
    backgroundColor: Brand.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: { backgroundColor: Brand.mintPressed },
  startButtonDisabled: { opacity: 0.45 },
  startHint: { fontSize: 13, color: Brand.textMuted, textAlign: 'center', marginTop: 8 },
  startButtonText: { fontSize: 18, fontWeight: '700', color: Brand.mintText },
  attribution: { fontSize: 10, color: Brand.textMuted, textAlign: 'center', marginTop: 8 },

  message: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  messageText: { fontSize: 15, fontWeight: '500', color: Brand.text, textAlign: 'center' },
  link: { fontSize: 15, fontWeight: '700', color: Brand.blue },
});
