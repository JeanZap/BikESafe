import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const ARRIVAL_SOUND = require('../../assets/sounds/arrival.wav');

// Efeito curto: toca mesmo no modo silencioso e não interrompe a música do usuário.
setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});

let arrivalPlayer: ReturnType<typeof createAudioPlayer> | null = null;

/** Toca o som de chegada ao destino. O player é criado uma vez e reaproveitado. */
export function playArrivalSound() {
  try {
    arrivalPlayer ??= createAudioPlayer(ARRIVAL_SOUND);
    arrivalPlayer.seekTo(0).catch(() => {});
    arrivalPlayer.play();
  } catch (err) {
    console.warn('Falha ao tocar som de chegada', err);
  }
}
