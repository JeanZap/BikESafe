import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { type AlertType, ALERT_TYPE_BY_ID } from '@/constants/alerts';

/** Ícone de um tipo de alerta, igual ao da legenda (chips do cabeçalho). */
export function AlertIcon({ type, size = 18 }: { type: AlertType; size?: number }) {
  const { color } = ALERT_TYPE_BY_ID[type];
  switch (type) {
    case 'pothole':
      // Pílula cinza, como no protótipo.
      return (
        <View
          style={{
            width: size + 2,
            height: size * 0.45,
            borderRadius: size * 0.225,
            backgroundColor: color,
          }}
        />
      );
    case 'accident':
      return <Icon name="warning" size={size} color={color} />;
    case 'bikeLane':
      return <Icon name="bike" size={size + 1} color={color} />;
    case 'noLight':
      return <Icon name="light" size={size} color={color} />;
  }
}
