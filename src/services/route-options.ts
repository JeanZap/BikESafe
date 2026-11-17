import type { IconName } from '@/components/icon';
import type { BikeRoute } from '@/services/osrm';
import { describeSafety, type RouteSafety, scoreRoute } from '@/services/route-safety';
import type { Annotation } from '@/store/annotations-store';
import { t } from '@/i18n';

export type RouteKind = 'safest' | 'fastest' | 'flattest' | 'alternative';

export type RouteOption = {
  kind: RouteKind;
  title: string;
  /** Resumo dos alertas no caminho, ex.: "1 acidente · 2 buracos". */
  subtitle: string;
  icon: IconName;
  route: BikeRoute;
  safety: RouteSafety;
};

const META: Record<RouteKind, { title: string; icon: IconName }> = {
  safest: { title: t.routeKinds.safest, icon: 'shield' },
  fastest: { title: t.routeKinds.fastest, icon: 'bolt' },
  flattest: { title: t.routeKinds.flattest, icon: 'mountain' },
  alternative: { title: t.routeKinds.alternative, icon: 'bike' },
};

/** Ordem em que as opções aparecem na lista (igual ao protótipo). */
const ORDER: RouteKind[] = ['safest', 'fastest', 'flattest', 'alternative'];

/**
 * Dá um "perfil" a cada rota calculada, usando os alertas do mapa.
 *
 * - "Mais rápida": menor duração.
 * - "Mais segura": menor risco (acidentes, buracos e trechos escuros no
 *   caminho; ciclovias contam a favor). Se for a mesma da mais rápida, a rota
 *   vira "Mais rápida e segura".
 * - As demais recebem "Menos subidas" e "Alternativa" por ordem de duração —
 *   ainda não temos dados de relevo.
 */
export function buildRouteOptions(routes: BikeRoute[], annotations: Annotation[]): RouteOption[] {
  if (routes.length === 0) return [];
  const scored = routes.map((route) => ({ route, safety: scoreRoute(route, annotations) }));

  const byDuration = [...scored].sort((a, b) => a.route.durationS - b.route.durationS);
  const fastest = byDuration[0];
  const safest = [...scored].sort(
    (a, b) => a.safety.risk - b.safety.risk || a.route.durationS - b.route.durationS
  )[0];

  const assigned: [RouteKind, (typeof scored)[number]][] = [];
  if (safest === fastest) {
    assigned.push(['fastest', fastest]);
  } else {
    assigned.push(['safest', safest], ['fastest', fastest]);
  }
  const rest = byDuration.filter((s) => s !== fastest && s !== safest);
  if (rest[0]) assigned.push(['flattest', rest[0]]);
  if (rest[1]) assigned.push(['alternative', rest[1]]);

  return assigned
    .sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))
    .map(([kind, { route, safety }]) => {
      const combined = kind === 'fastest' && safest === fastest && scored.length > 1;
      return {
        kind,
        route,
        safety,
        title: combined ? t.routeKinds.fastestAndSafest : META[kind].title,
        icon: combined ? 'shield' : META[kind].icon,
        subtitle: describeSafety(safety),
      };
    });
}
