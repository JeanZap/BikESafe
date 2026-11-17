/** Textos em português. Define a estrutura que `en.ts` precisa seguir. */
export const pt = {
  decimalSeparator: ',',

  common: {
    cancel: 'Cancelar',
    close: 'Fechar',
    back: 'Voltar',
    tryAgain: 'Tentar de novo',
    allow: 'Permitir',
    yourLocation: 'Sua localização',
    gettingLocation: 'Obtendo sua localização…',
  },

  tabs: {
    map: 'Mapa',
    explore: 'Explorar',
  },

  alertTypes: {
    pothole: 'Buraco',
    accident: 'Acidente',
    bikeLane: 'Ciclovia',
    noLight: 'Falta de luz',
  },

  hazards: {
    accident: ['acidente', 'acidentes'],
    pothole: ['buraco', 'buracos'],
    noLight: ['trecho escuro', 'trechos escuros'],
    none: 'Sem alertas no caminho',
    bikeLane: 'ciclovia',
  },

  routeKinds: {
    safest: 'Mais segura',
    fastest: 'Mais rápida',
    flattest: 'Menos subidas',
    alternative: 'Alternativa',
    fastestAndSafest: 'Mais rápida e segura',
  },

  occurrences: {
    infraction: {
      label: 'Infração',
      hint: 'Avanço de sinal, contramão, veículo na ciclovia…',
      keywords: [
        'avanço de sinal',
        'sinal vermelho',
        'semáforo',
        'contramão',
        'carro na ciclovia',
        'moto na ciclovia',
        'estacionado na ciclovia',
        'faixa de pedestre',
        'multa',
      ],
    },
    dangerousDriving: {
      label: 'Condução perigosa',
      hint: 'Fechada, ultrapassagem sem distância, excesso de velocidade…',
      keywords: [
        'fechada',
        'ultrapassagem',
        'distância',
        'excesso de velocidade',
        'racha',
        'buzina',
        'celular ao volante',
        'quase atropelamento',
        'direção perigosa',
      ],
    },
    badParking: {
      label: 'Bicicleta estacionada em local inapropriado',
      hint: 'Bicicleta bloqueando calçada, rampa, faixa ou entrada.',
      keywords: [
        'bike',
        'estacionada',
        'calçada',
        'rampa',
        'acessibilidade',
        'garagem',
        'entrada',
        'patinete',
        'bloqueando',
      ],
    },
  },

  errors: {
    routeOffline: 'Sem conexão com o servidor de rotas.',
    routeRateLimited: 'Muitas requisições. Aguarde um instante e tente de novo.',
    routeNotFound: 'Não foi encontrada rota de bicicleta até esse ponto.',
    routeFailed: 'Não foi possível calcular a rota.',
    routesFailed: 'Erro ao calcular as rotas.',
    searchOffline: 'Sem conexão para buscar endereços.',
    searchUnavailable: 'Não foi possível buscar endereços agora.',
    searchFailed: 'Erro ao buscar endereços.',
    unnamedPlace: 'Local sem nome',
  },

  profile: {
    title: 'Perfil',
    rating: 'Avaliação',
    ratingA11y: (rating: string) => `Avaliação ${rating}`,
    name: 'Nome',
    contact: 'Email ou Telefone',
    signOut: 'Sair',
    signOutConfirm: 'Deseja sair da sua conta?',
    deleteAccount: 'Excluir conta',
    deleteAccountConfirm: 'Esta ação não pode ser desfeita. Seus dados e alertas serão removidos.',
    delete: 'Excluir',
  },

  search: {
    placeholder: 'Para onde vamos hoje?',
    pickingPlaceholder: (label: string) => `Endereço de ${label}`,
    pickingHint: (label: string) => `Busque o endereço de ${label}`,
    home: 'Casa',
    work: 'Trabalho',
    setAddress: 'Definir endereço',
    changeAddressHint: 'Toque e segure para trocar o endereço',
    searching: 'Buscando…',
    noResults: 'Nenhum lugar encontrado.',
    results: 'RESULTADOS',
    nearby: 'SUGESTÕES PERTO DE VOCÊ',
    profileA11y: 'Perfil',
    searchA11y: 'Buscar destino',
    clearA11y: 'Limpar busca',
    filtersA11y: 'Filtros',
    heatA11y: 'Mapa de calor das ruas',
    heat: 'Calor',
  },

  map: {
    yourLocationMarker: 'Sua Localização',
    pointOnMap: 'Ponto no mapa',
    stopRouteTitle: 'Encerrar rota?',
    stopRouteMessage: 'A navegação até o destino será interrompida.',
    continue: 'Continuar',
    stop: 'Encerrar',
    stopRoute: 'Encerrar rota',
    occurrenceSentTitle: 'Ocorrência registrada',
    occurrenceSentMessage: (protocol: string) =>
      `Obrigado! Seu relato foi enviado de forma anônima.\nProtocolo: ${protocol}`,
    locationDenied: 'Permita o acesso à localização para traçar rotas.',
    locationError: 'Não foi possível obter sua localização.',
    centerA11y: 'Centralizar na minha localização',
    simSpeedA11y: 'Velocidade da simulação',
    simPauseA11y: 'Pausar simulação',
    simStartA11y: 'Simular percurso',
    pickHint: 'Toque no mapa para marcar o local',
    reportAlertA11y: 'Registrar Alerta',
    alert: 'Alerta',
    reportOccurrenceA11y: 'Registrar ocorrência',
    occurrence: 'Ocorrência',
  },

  annotation: {
    routeHere: 'Rota até aqui',
    now: 'agora',
    minutesAgo: (n: number) => `há ${n} min`,
    hoursAgo: (n: number) => `há ${n} h`,
    daysAgo: (n: number) => (n === 1 ? 'há 1 dia' : `há ${n} dias`),
  },

  hazardCheck: {
    question: 'Você passou por aqui. Este problema ainda existe?',
    open: 'Aberto',
    resolved: 'Não existe mais',
    stillThere: 'Sim, continua',
  },

  reportAlert: {
    description: 'Descrição',
    assistant: 'Assistente',
    assistantPickType: 'Escolha o tipo do alerta para receber uma sugestão.',
    submit: 'Alerta',
    suggestions: {
      pothole: 'Buraco na pista, ocupando parte da faixa. Atenção ao desviar.',
      accident: 'Acidente no local. Trânsito lento, redobre a atenção.',
      bikeLane: 'Ciclovia com problema neste trecho (obstruída ou mal sinalizada).',
      noLight: 'Trecho sem iluminação à noite. Use farol e roupas refletivas.',
    },
  },

  reportOccurrence: {
    title: 'Registrar ocorrência',
    anonymous: 'Anônimo',
    descriptionPlaceholder: 'O que aconteceu? (opcional) Ex.: placa, cor do veículo, horário',
    attachLocation: 'Anexar local aproximado (~100 m)',
    attachLocationA11y: 'Anexar local aproximado',
    submit: 'Enviar anonimamente',
    typePlaceholder: 'Tipo de ocorrência (ex.: contramão, calçada…)',
    typeA11y: 'Tipo de ocorrência',
    clearTypeA11y: 'Limpar tipo',
    matches: (keyword: string) => `Corresponde a “${keyword}”`,
  },

  navigation: {
    collapseA11y: 'Recolher painel da rota',
    expandA11y: 'Expandir painel da rota',
    timeLeft: 'Temp. faltante',
    distance: 'Distância',
    avgSpeed: 'Vel. Méd.',
    rerouting: 'Recalculando rota…',
  },

  photo: {
    cameraBlockedTitle: 'Câmera bloqueada',
    cameraBlockedMessage: 'Permita o acesso à câmera nas configurações para fotografar o local.',
    title: 'Foto',
    openFailed: 'Não foi possível abrir a câmera ou a galeria.',
    add: 'Adicionar foto',
    change: 'Trocar foto',
    remove: 'Remover foto',
    camera: 'Câmera',
    library: 'Galeria',
    label: 'FOTO',
  },

  routePlanner: {
    swapA11y: 'Inverter origem e destino',
    calculating: 'Calculando rotas de bicicleta…',
    locationDenied: 'Permita o acesso à localização para traçar a rota.',
    available: (n: number) => (n === 1 ? '1 ROTA DISPONÍVEL' : `${n} ROTAS DISPONÍVEIS`),
    start: 'Iniciar rota',
    attribution: 'Rotas: OSRM · © colaboradores do OpenStreetMap',
  },
};

/** Formato que todo idioma precisa seguir (strings livres, mesmas chaves). */
type Widen<T> = T extends string
  ? string
  : T extends readonly string[]
    ? readonly string[]
    : T extends (...args: infer A) => string
      ? (...args: A) => string
      : { [K in keyof T]: Widen<T[K]> };

export type Strings = Widen<typeof pt>;
