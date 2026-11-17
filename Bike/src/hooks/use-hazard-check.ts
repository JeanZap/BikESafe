import { useCallback, useEffect, useRef, useState } from 'react';

import type { AlertType } from '@/constants/alerts';
import { distanceMeters, type LngLat } from '@/services/osrm';
import { type Annotation, useAnnotationsStore } from '@/store/annotations-store';

/** Tipos de incidente que perguntamos se ainda existem ao passar por eles. */
const CHECKED_TYPES: AlertType[] = ['pothole', 'accident'];
/** Raio em que consideramos que o ciclista "cruzou" o incidente. */
const CROSSING_RADIUS_M = 30;

/**
 * Detecta quando o ciclista passa por um buraco ou acidente registrado e
 * devolve esse incidente para confirmação. Cada incidente é perguntado no
 * máximo uma vez por sessão do app.
 */
export function useHazardCheck(position: LngLat | null) {
  const annotations = useAnnotationsStore((s) => s.annotations);
  const removeAnnotation = useAnnotationsStore((s) => s.removeAnnotation);

  const [pendingId, setPendingId] = useState<string | null>(null);
  // Se o incidente for removido por outro caminho, a pergunta some junto.
  const pending: Annotation | null = annotations.find((a) => a.id === pendingId) ?? null;
  const asked = useRef(new Set<string>());

  useEffect(() => {
    if (!position || pending) return;
    const crossed = annotations.find(
      (a) =>
        CHECKED_TYPES.includes(a.type) &&
        !asked.current.has(a.id) &&
        distanceMeters(position, a.coordinates) <= CROSSING_RADIUS_M
    );
    if (crossed) {
      asked.current.add(crossed.id);
      setPendingId(crossed.id);
    }
  }, [position, annotations, pending]);

  /** Ainda existe (ou sem resposta): mantém o incidente. */
  const dismiss = useCallback(() => setPendingId(null), []);

  /** Não existe mais: remove do mapa. */
  const resolve = useCallback(() => {
    if (pendingId) removeAnnotation(pendingId);
    setPendingId(null);
  }, [pendingId, removeAnnotation]);

  return { pending, dismiss, resolve };
}
