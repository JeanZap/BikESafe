import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type PressEvent,
  type TrackUserLocationChangeEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchHeader } from '@/components/home/search-header';
import { UserLocationMarker } from '@/components/home/user-location-marker';
import { Icon } from '@/components/icon';
import { AnnotationCard } from '@/components/map/annotation-card';
import { AnnotationMarker } from '@/components/map/annotation-marker';
import { HazardCheckCard } from '@/components/map/hazard-check-card';
import { ReportAlertSheet } from '@/components/map/report-alert-sheet';
import { ReportOccurrenceSheet } from '@/components/map/report-occurrence-sheet';
import { NavigationPanel } from '@/components/navigation/navigation-panel';
import { DestinationMarker } from '@/components/route/destination-marker';
import { Brand, BrandShadow } from '@/constants/brand';
import { FALLBACK_CENTER, MAP_STYLE_URL } from '@/constants/map';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useHazardCheck } from '@/hooks/use-hazard-check';
import { useNavigation } from '@/hooks/use-navigation';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { useRouteSimulation } from '@/hooks/use-route-simulation';
import type { Place } from '@/services/geocoding';
import { getBounds, type LngLat } from '@/services/osrm';
import { buildRiskGradient, COLOR_HIGH, COLOR_MID } from '@/services/route-heat';
import { playArrivalSound } from '@/services/sounds';
import { buildStreetHeat } from '@/services/street-heat';
import {
  useAnnotationsStore,
  useSelectedAnnotation,
  useVisibleAnnotations,
} from '@/store/annotations-store';
import { useNavigationStore } from '@/store/navigation-store';
import { type NewOccurrence, useOccurrencesStore } from '@/store/occurrences-store';
import { t } from '@/i18n';

/** Cor da rota em navegação (mesma da rota escolhida no protótipo 3). */
const NAV_ROUTE_COLOR = '#14B8A6';

/** Primeira camada de rótulos do estilo `liberty`; o calor fica logo abaixo dela. */
const STREET_HEAT_BEFORE_ID = 'road_one_way_arrow';

const INITIAL_VIEW = { center: FALLBACK_CENTER, zoom: 12 };

type Destination = { coordinates: LngLat; title: string };

export function BikeMap() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraRef>(null);
  const centeredOnce = useRef(false);

  const { position: gpsPosition, status: locationStatus, retry } = useCurrentLocation();

  // Só em desenvolvimento: simula o ciclista percorrendo a rota ativa.
  const navCoords = useNavigationStore((s) => s.active?.route.geometry.coordinates ?? null);
  const sim = useRouteSimulation(__DEV__ ? navCoords : null);
  const simulating = !!sim.position;
  const position = sim.position ?? gpsPosition;

  // Busca por texto
  const [query, setQuery] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const search = usePlaceSearch(query, position, searchEnabled);

  // Anotações (store global; filtros vêm da legenda no cabeçalho)
  const annotations = useVisibleAnnotations();
  const selectedAnnotation = useSelectedAnnotation();
  const selectAnnotation = useAnnotationsStore((s) => s.select);
  // Mapa de calor das ruas: segue os filtros da legenda (ex.: só acidentes).
  const streetHeatOn = useAnnotationsStore((s) => s.streetHeat);
  const streetHeat = useMemo(
    () => (streetHeatOn ? buildStreetHeat(annotations) : null),
    [streetHeatOn, annotations]
  );
  const addAnnotation = useAnnotationsStore((s) => s.addAnnotation);
  // Registro de alerta: toques no mapa escolhem o local; o local abre o painel.
  const [picking, setPicking] = useState(false);
  const [reportPoint, setReportPoint] = useState<LngLat | null>(null);
  // Registro anônimo de ocorrência (não vira marcador no mapa).
  const [occurrenceOpen, setOccurrenceOpen] = useState(false);
  const addOccurrence = useOccurrencesStore((s) => s.addOccurrence);
  // Evita que o toque no marcador também conte como toque no mapa.
  const markerPressedAt = useRef(0);

  const [bottomAreaHeight, setBottomAreaHeight] = useState(0);

  // Ao passar por um buraco/acidente, pergunta se ele ainda existe.
  const hazardCheck = useHazardCheck(position);

  // Navegação ativa (iniciada na tela de rotas)
  const progress = useNavigation(position);
  const navigating = !!progress;
  const navStartedAt = progress?.nav.startedAt;
  const stopNavigation = useNavigationStore((s) => s.stop);
  const [panelHeight, setPanelHeight] = useState(0);
  /** Câmera acompanha o ciclista até ele arrastar o mapa. */
  const [following, setFollowing] = useState(true);
  const bottomOffset = navigating ? panelHeight : 0;

  const bottomPadding = insets.bottom + 16;

  // Centraliza no usuário assim que a primeira posição chega.
  useEffect(() => {
    if (position && !centeredOnce.current) {
      centeredOnce.current = true;
      cameraRef.current?.flyTo({ center: position, zoom: 15, duration: 1200 });
    }
  }, [position]);

  /**
   * Durante a navegação, o modo de seguir é nativo (`trackUserLocation`): a
   * câmera centraliza no ciclista e gira conforme a direção do deslocamento.
   * O padding inferior mantém o ciclista acima do painel de navegação.
   */
  const trackUserLocation = navigating && following && !simulating ? 'course' : undefined;
  const cameraPadding = useMemo(
    () => ({ top: 0, right: 0, bottom: navigating ? panelHeight + 60 : 0, left: 0 }),
    [navigating, panelHeight]
  );

  // Aproxima no ciclista e só então liga o modo de seguir, para que a
  // animação de zoom não seja interrompida pelo rastreamento.
  const followTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelFollow = useCallback(() => {
    if (followTimer.current) clearTimeout(followTimer.current);
    followTimer.current = null;
  }, []);
  const startFollowing = useCallback(
    (center: LngLat, delay = 0) => {
      cancelFollow();
      followTimer.current = setTimeout(() => {
        cameraRef.current?.flyTo({ center, zoom: 17, padding: cameraPadding, duration: 800 });
        followTimer.current = setTimeout(() => {
          followTimer.current = null;
          setFollowing(true);
        }, 850);
      }, delay);
    },
    [cancelFollow, cameraPadding]
  );
  useEffect(() => cancelFollow, [cancelFollow]);

  // Na simulação o GPS nativo não se move, então a câmera segue a posição simulada.
  useEffect(() => {
    if (!simulating || !navigating || !following || !sim.position) return;
    cameraRef.current?.easeTo({
      center: sim.position,
      bearing: sim.bearing,
      zoom: 17,
      padding: cameraPadding,
      duration: 900,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.position]);

  // Ao iniciar a navegação: mostra a rota inteira e depois passa a seguir o ciclista.
  const panelReady = panelHeight > 0;
  useEffect(() => {
    const nav = useNavigationStore.getState().active;
    if (!nav || !panelReady) return;
    setFollowing(false);
    cameraRef.current?.fitBounds(getBounds(nav.route.geometry.coordinates), {
      padding: { top: 60, right: 50, bottom: panelHeight + 110, left: 50 },
      duration: 900,
    });
    const start = position ?? nav.route.geometry.coordinates[0];
    startFollowing(start, 2400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStartedAt, panelReady]);

  // Ao sair da navegação: desliga o seguir e volta o mapa para o norte.
  const wasNavigating = useRef(false);
  useEffect(() => {
    if (wasNavigating.current && !navigating) {
      cancelFollow();
      setFollowing(false);
      cameraRef.current?.setStop({ bearing: 0, pitch: 0, duration: 500 }).catch(() => {});
    }
    wasNavigating.current = navigating;
  }, [navigating, cancelFollow]);

  const handleTrackUserLocationChange = useCallback(
    (event: NativeSyntheticEvent<TrackUserLocationChangeEvent>) => {
      // `null` = o rastreamento foi interrompido (ex.: o usuário arrastou o mapa).
      // Na simulação o rastreamento nativo é desligado de propósito.
      if (event.nativeEvent.trackUserLocation === null && !simulating) setFollowing(false);
    },
    [simulating]
  );

  // Chegada ao destino: som de comemoração e fim da navegação, sem popup.
  const arrived = progress?.arrived ?? false;
  useEffect(() => {
    if (!arrived) return;
    playArrivalSound();
    stopNavigation();
  }, [arrived, stopNavigation]);

  const confirmStop = useCallback(() => {
    Alert.alert(t.map.stopRouteTitle, t.map.stopRouteMessage, [
      { text: t.map.continue, style: 'cancel' },
      { text: t.map.stop, style: 'destructive', onPress: stopNavigation },
    ]);
  }, [stopNavigation]);

  const remaining = progress?.remaining;
  const remainingGeoJSON = useMemo<GeoJSON.Feature | null>(
    () =>
      remaining && remaining.length >= 2
        ? {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: remaining },
          }
        : null,
    [remaining]
  );

  // Trecho restante colorido pelo risco (todos os alertas, ignorando filtros da legenda).
  const allAnnotations = useAnnotationsStore((s) => s.annotations);
  const remainingGradient = useMemo(
    () => (remaining ? buildRiskGradient(remaining, allAnnotations, NAV_ROUTE_COLOR) : null),
    [remaining, allAnnotations]
  );

  /** Abre a tela de escolha de rotas (protótipo 3). */
  const goTo = useCallback(
    (dest: Destination) => {
      router.push({
        pathname: '/route',
        params: {
          title: dest.title,
          lng: String(dest.coordinates[0]),
          lat: String(dest.coordinates[1]),
          ...(position && { originLng: String(position[0]), originLat: String(position[1]) }),
        },
      });
    },
    [router, position]
  );

  const handleChangeQuery = useCallback((text: string) => {
    setQuery(text);
    setSearchEnabled(true);
    setResultsOpen(true);
  }, []);

  const handleSelectPlace = useCallback(
    (place: Place) => {
      Keyboard.dismiss();
      setQuery(place.title);
      setSearchEnabled(false);
      setResultsOpen(false);
      goTo({ coordinates: place.coordinates, title: place.title });
    },
    [goTo]
  );

  const handleMapPress = useCallback(
    (event: NativeSyntheticEvent<PressEvent>) => {
      if (Date.now() - markerPressedAt.current < 400) return;
      // Primeiro toque com a lista aberta só fecha a busca.
      if (resultsOpen) {
        Keyboard.dismiss();
        setResultsOpen(false);
        return;
      }
      // Modo de registro: o toque marca o local do novo alerta.
      if (picking) {
        setReportPoint([event.nativeEvent.lngLat[0], event.nativeEvent.lngLat[1]]);
        return;
      }
      // Com uma anotação aberta, o toque no mapa só a fecha.
      if (selectedAnnotation) {
        selectAnnotation(null);
        return;
      }
      // Durante a navegação, tocar no mapa não troca o destino.
      if (navigating) return;
      const to: LngLat = [event.nativeEvent.lngLat[0], event.nativeEvent.lngLat[1]];
      setQuery('');
      setSearchEnabled(false);
      goTo({ coordinates: to, title: t.map.pointOnMap });
    },
    [goTo, resultsOpen, picking, selectedAnnotation, selectAnnotation, navigating]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      markerPressedAt.current = Date.now();
      // Escolhendo local: marcadores existentes não abrem o card.
      if (picking) return;
      Keyboard.dismiss();
      setResultsOpen(false);
      selectAnnotation(id);
    },
    [selectAnnotation, picking]
  );

  const routeToSelected = useCallback(() => {
    if (!selectedAnnotation) return;
    selectAnnotation(null);
    setQuery('');
    setSearchEnabled(false);
    goTo({ coordinates: selectedAnnotation.coordinates, title: selectedAnnotation.title });
  }, [goTo, selectedAnnotation, selectAnnotation]);

  const recenter = useCallback(() => {
    if (!position) {
      retry();
      return;
    }
    if (navigating) {
      startFollowing(position);
    } else {
      cameraRef.current?.flyTo({ center: position, zoom: 15, duration: 800 });
    }
  }, [position, retry, navigating, startFollowing]);

  // Gesto no mapa cancela um "seguir" pendente (o nativo já se desliga sozinho).
  const handleRegionWillChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!event.nativeEvent.userInteraction) return;
      cancelFollow();
      setFollowing(false);
    },
    [cancelFollow]
  );

  const startReport = useCallback(() => {
    Keyboard.dismiss();
    setResultsOpen(false);
    selectAnnotation(null);
    setPicking(true);
  }, [selectAnnotation]);

  const cancelReport = useCallback(() => {
    setPicking(false);
    setReportPoint(null);
  }, []);

  const submitReport = useCallback(
    (input: Parameters<typeof addAnnotation>[0]) => {
      const created = addAnnotation(input);
      setPicking(false);
      setReportPoint(null);
      // Garante que o novo alerta apareça mesmo com filtros ativos.
      const { activeFilters, clearFilters } = useAnnotationsStore.getState();
      if (activeFilters.length > 0 && !activeFilters.includes(created.type)) clearFilters();
      selectAnnotation(created.id);
    },
    [addAnnotation, selectAnnotation]
  );

  const openOccurrence = useCallback(() => {
    Keyboard.dismiss();
    setResultsOpen(false);
    selectAnnotation(null);
    setOccurrenceOpen(true);
  }, [selectAnnotation]);

  const submitOccurrence = useCallback(
    (input: NewOccurrence) => {
      const created = addOccurrence(input);
      setOccurrenceOpen(false);
      Alert.alert(
        t.map.occurrenceSentTitle,
        t.map.occurrenceSentMessage(created.protocol)
      );
    },
    [addOccurrence]
  );

  const locationMessage =
    locationStatus === 'denied'
      ? { text: t.map.locationDenied, action: t.common.allow }
      : locationStatus === 'error'
        ? { text: t.map.locationError, action: t.common.tryAgain }
        : locationStatus === 'loading' || !position
          ? { text: t.common.gettingLocation, action: null }
          : null;

  return (
    <View style={styles.container}>
      <SearchHeader
        topInset={insets.top}
        query={query}
        onChangeQuery={handleChangeQuery}
        onClearQuery={() => {
          setQuery('');
          setSearchEnabled(false);
        }}
        search={search}
        showResults={resultsOpen}
        onFocusSearch={() => setResultsOpen(true)}
        onCloseSearch={() => setResultsOpen(false)}
        onSelectPlace={handleSelectPlace}
        position={position}
      />

      <View style={styles.mapArea}>
        <Map
          style={styles.map}
          mapStyle={MAP_STYLE_URL}
          onPress={handleMapPress}
          onRegionWillChange={handleRegionWillChange}
          logo={false}
          compass={false}
          attributionPosition={{ bottom: bottomOffset + bottomAreaHeight + 4, left: 8 }}>
          <Camera
            ref={cameraRef}
            initialViewState={INITIAL_VIEW}
            padding={cameraPadding}
            trackUserLocation={trackUserLocation}
            onTrackUserLocationChange={handleTrackUserLocationChange}
          />

          {streetHeat && streetHeat.features.length > 0 && (
            <GeoJSONSource id="street-heat" data={streetHeat}>
              <Layer
                id="street-heat-line"
                type="line"
                // Acima das ruas, abaixo dos nomes e setas do mapa base.
                beforeId={STREET_HEAT_BEFORE_ID}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'risk'],
                    0,
                    COLOR_MID,
                    0.5,
                    COLOR_MID,
                    1,
                    COLOR_HIGH,
                  ],
                  'line-opacity': ['interpolate', ['linear'], ['get', 'risk'], 0, 0.15, 1, 0.9],
                  'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 15, 6, 18, 14],
                }}
              />
            </GeoJSONSource>
          )}

          {remainingGeoJSON && (
            <GeoJSONSource id="nav-route" data={remainingGeoJSON} lineMetrics>
              <Layer
                id="nav-route-casing"
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{ 'line-color': '#FFFFFF', 'line-width': 10 }}
              />
              <Layer
                id="nav-route-line"
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={
                  remainingGradient
                    ? { 'line-gradient': remainingGradient, 'line-width': 6 }
                    : { 'line-color': NAV_ROUTE_COLOR, 'line-width': 6 }
                }
              />
            </GeoJSONSource>
          )}

          {progress && (
            <Marker
              id="nav-destination"
              lngLat={progress.nav.destination.coordinates}
              anchor="bottom">
              <DestinationMarker />
            </Marker>
          )}

          {annotations.map((annotation) => (
            <Marker
              key={annotation.id}
              id={`annotation-${annotation.id}`}
              lngLat={annotation.coordinates}
              anchor="bottom"
              onPress={() => handleMarkerPress(annotation.id)}>
              <AnnotationMarker
                type={annotation.type}
                selected={annotation.id === selectedAnnotation?.id}
              />
            </Marker>
          ))}

          {position && (
            <Marker id="user-location" lngLat={position} anchor="center">
              <UserLocationMarker />
            </Marker>
          )}

          {reportPoint && (
            <Marker id="report-point" lngLat={reportPoint} anchor="bottom">
              <DestinationMarker />
            </Marker>
          )}
        </Map>

        {/* Aviso de localização */}
        {locationMessage && (
          <View style={styles.toastWrap} pointerEvents="box-none">
            <View style={styles.toast}>
              {!locationMessage.action && <ActivityIndicator size="small" color={Brand.blue} />}
              <Text style={styles.toastText}>{locationMessage.text}</Text>
              {locationMessage.action && (
                <Pressable onPress={retry} hitSlop={8}>
                  <Text style={styles.toastAction}>{locationMessage.action}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Pergunta ao cruzar um buraco/acidente (protótipo 5) */}
        {hazardCheck.pending && (
          <View style={styles.hazardWrap} pointerEvents="box-none">
            <HazardCheckCard
              key={hazardCheck.pending.id}
              annotation={hazardCheck.pending}
              onStillThere={hazardCheck.dismiss}
              onResolved={hazardCheck.resolve}
            />
          </View>
        )}

        {/* Botões flutuantes: recentralizar e, durante a navegação, encerrar rota */}
        <View
          style={[styles.mapButtons, { bottom: bottomOffset + bottomAreaHeight + 16 }]}
          pointerEvents="box-none">
          <Pressable
            onPress={recenter}
            accessibilityRole="button"
            accessibilityLabel={t.map.centerA11y}
            style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
            <Icon name="recenter" size={28} color={Brand.text} />
          </Pressable>
          {__DEV__ && navigating && (
            <>
              <Pressable
                onPress={sim.cycleSpeed}
                accessibilityRole="button"
                accessibilityLabel={t.map.simSpeedA11y}
                style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
                <Text style={styles.simSpeedText}>{sim.speed}x</Text>
              </Pressable>
              <Pressable
                onPress={sim.toggle}
                accessibilityRole="button"
                accessibilityLabel={sim.running ? t.map.simPauseA11y : t.map.simStartA11y}
                style={({ pressed }) => [
                  styles.mapButton,
                  sim.running && styles.simActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.simIcon, sim.running && styles.simIconActive]}>
                  {sim.running ? '❚❚' : '▶'}
                </Text>
              </Pressable>
            </>
          )}
          {navigating && (
            <Pressable
              onPress={confirmStop}
              accessibilityRole="button"
              accessibilityLabel={t.map.stopRoute}
              style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
              <Icon name="stop" size={28} color={Brand.danger} />
            </Pressable>
          )}
        </View>

        {/* Área inferior: anotação selecionada ou "Registrar Alerta" / "Registrar ocorrência" */}
        <View
          style={[
            styles.bottomArea,
            { bottom: bottomOffset, paddingBottom: navigating ? 16 : bottomPadding },
          ]}
          pointerEvents="box-none"
          onLayout={(e) => setBottomAreaHeight(e.nativeEvent.layout.height)}>
          {picking ? (
            <View style={styles.pickHint}>
              <Icon name="pin" size={22} color={Brand.mintText} />
              <Text style={styles.pickHintText}>{t.map.pickHint}</Text>
              <Pressable onPress={cancelReport} hitSlop={8} accessibilityRole="button">
                <Text style={styles.pickHintCancel}>{t.common.cancel}</Text>
              </Pressable>
            </View>
          ) : selectedAnnotation ? (
            <AnnotationCard
              annotation={selectedAnnotation}
              onRoute={routeToSelected}
              onClose={() => selectAnnotation(null)}
            />
          ) : (
            <View style={styles.reportButtons}>
              <Pressable
                onPress={startReport}
                accessibilityRole="button"
                accessibilityLabel={t.map.reportAlertA11y}
                style={({ pressed }) => [
                  styles.reportButton,
                  styles.alertButton,
                  pressed && styles.alertButtonPressed,
                ]}>
                <Icon name="megaphone" size={24} color={Brand.mintText} />
                <View>
                  <Text style={[styles.reportButtonCaption, { color: Brand.mintText }]}>
                    Registrar
                  </Text>
                  <Text style={[styles.reportButtonText, { color: Brand.mintText }]}>{t.map.alert}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={openOccurrence}
                accessibilityRole="button"
                accessibilityLabel={t.map.reportOccurrenceA11y}
                style={({ pressed }) => [
                  styles.reportButton,
                  styles.occurrenceButton,
                  pressed && styles.occurrenceButtonPressed,
                ]}>
                <Icon name="report" size={24} color={Brand.orange} />
                <View>
                  <Text style={[styles.reportButtonCaption, { color: Brand.orange }]}>
                    Registrar
                  </Text>
                  <Text style={[styles.reportButtonText, { color: Brand.orange }]}>{t.map.occurrence}</Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Painel da navegação (protótipo 4) */}
        {progress && (
          <NavigationPanel
            progress={progress}
            bottomInset={insets.bottom}
            onStop={confirmStop}
            onLayout={setPanelHeight}
          />
        )}

        {/* Painel de registro (protótipo 6) */}
        <ReportAlertSheet
          point={reportPoint}
          bottomInset={insets.bottom}
          onClose={() => setReportPoint(null)}
          onSubmit={submitReport}
        />

        {/* Registro anônimo de ocorrência */}
        <ReportOccurrenceSheet
          visible={occurrenceOpen}
          position={position}
          bottomInset={insets.bottom}
          onClose={() => setOccurrenceOpen(false)}
          onSubmit={submitOccurrence}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.canvas },
  mapArea: { flex: 1 },
  map: { flex: 1 },
  pressed: { opacity: 0.7 },
  simSpeedText: { fontSize: 16, fontWeight: '700', color: Brand.text },
  simIcon: { fontSize: 18, fontWeight: '700', color: Brand.teal },
  simIconActive: { color: '#FFFFFF' },
  simActive: { backgroundColor: Brand.teal },

  toastWrap: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: Brand.surface,
    ...BrandShadow,
  },
  hazardWrap: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
  },
  toastText: { fontSize: 14, color: Brand.text, fontWeight: '500', flexShrink: 1 },
  toastAction: { fontSize: 14, color: Brand.blue, fontWeight: '700' },

  mapButtons: {
    position: 'absolute',
    right: 16,
    gap: 12,
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...BrandShadow,
  },

  bottomArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    alignItems: 'center',
  },
  reportButtons: { alignSelf: 'stretch', flexDirection: 'row', gap: 12 },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  reportButtonCaption: { fontSize: 12, fontWeight: '500', opacity: 0.8 },
  reportButtonText: { fontSize: 17, fontWeight: '700', marginTop: -2 },
  alertButton: {
    backgroundColor: Brand.mint,
    ...BrandShadow,
    shadowColor: '#0FA88A',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  alertButtonPressed: { backgroundColor: Brand.mintPressed },
  occurrenceButton: {
    backgroundColor: Brand.surface,
    borderWidth: 2,
    borderColor: Brand.orange,
    ...BrandShadow,
  },
  occurrenceButtonPressed: { backgroundColor: Brand.orangeSoft },

  pickHint: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 60,
    paddingHorizontal: 18,
    borderRadius: 30,
    backgroundColor: Brand.surface,
    borderWidth: 2,
    borderColor: Brand.mint,
    ...BrandShadow,
  },
  pickHintText: { flex: 1, fontSize: 15, fontWeight: '600', color: Brand.text },
  pickHintCancel: { fontSize: 15, fontWeight: '700', color: Brand.danger },


});
