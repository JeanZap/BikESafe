import type { Strings } from '@/i18n/pt';

/** English strings. Must have the same keys as `pt.ts`. */
export const en: Strings = {
  decimalSeparator: '.',

  common: {
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    tryAgain: 'Try again',
    allow: 'Allow',
    yourLocation: 'Your location',
    gettingLocation: 'Getting your location…',
  },

  tabs: {
    map: 'Map',
    explore: 'Explore',
  },

  alertTypes: {
    pothole: 'Pothole',
    accident: 'Accident',
    bikeLane: 'Bike lane',
    noLight: 'No lighting',
  },

  hazards: {
    accident: ['accident', 'accidents'],
    pothole: ['pothole', 'potholes'],
    noLight: ['dark stretch', 'dark stretches'],
    none: 'No alerts along the way',
    bikeLane: 'bike lane',
  },

  routeKinds: {
    safest: 'Safest',
    fastest: 'Fastest',
    flattest: 'Fewest hills',
    alternative: 'Alternative',
    fastestAndSafest: 'Fastest and safest',
  },

  occurrences: {
    infraction: {
      label: 'Traffic violation',
      hint: 'Running a red light, wrong way, vehicle in the bike lane…',
      keywords: [
        'red light',
        'traffic light',
        'wrong way',
        'car in bike lane',
        'motorcycle in bike lane',
        'parked in bike lane',
        'crosswalk',
        'ticket',
      ],
    },
    dangerousDriving: {
      label: 'Dangerous driving',
      hint: 'Cut off, close pass, speeding…',
      keywords: [
        'cut off',
        'close pass',
        'overtaking',
        'distance',
        'speeding',
        'street racing',
        'honking',
        'phone while driving',
        'near miss',
        'reckless driving',
      ],
    },
    badParking: {
      label: 'Bike parked in an inappropriate place',
      hint: 'Bike blocking a sidewalk, ramp, lane or entrance.',
      keywords: [
        'bike',
        'parked',
        'sidewalk',
        'ramp',
        'accessibility',
        'garage',
        'entrance',
        'scooter',
        'blocking',
      ],
    },
  },

  errors: {
    routeOffline: 'No connection to the routing server.',
    routeRateLimited: 'Too many requests. Wait a moment and try again.',
    routeNotFound: 'No bike route was found to this point.',
    routeFailed: 'Could not calculate the route.',
    routesFailed: 'Error calculating routes.',
    searchOffline: 'No connection to search addresses.',
    searchUnavailable: 'Address search is unavailable right now.',
    searchFailed: 'Error searching addresses.',
    unnamedPlace: 'Unnamed place',
  },

  profile: {
    title: 'Profile',
    rating: 'Rating',
    ratingA11y: (rating) => `Rating ${rating}`,
    name: 'Name',
    contact: 'Email or phone',
    signOut: 'Sign out',
    signOutConfirm: 'Do you want to sign out of your account?',
    deleteAccount: 'Delete account',
    deleteAccountConfirm: 'This cannot be undone. Your data and alerts will be removed.',
    delete: 'Delete',
  },

  search: {
    placeholder: 'Where are we going today?',
    pickingPlaceholder: (label) => `${label} address`,
    pickingHint: (label) => `Search for your ${label} address`,
    home: 'Home',
    work: 'Work',
    setAddress: 'Set address',
    changeAddressHint: 'Touch and hold to change the address',
    searching: 'Searching…',
    noResults: 'No places found.',
    results: 'RESULTS',
    nearby: 'SUGGESTIONS NEAR YOU',
    profileA11y: 'Profile',
    searchA11y: 'Search destination',
    clearA11y: 'Clear search',
    filtersA11y: 'Filters',
    heatA11y: 'Street heat map',
    heat: 'Heat',
  },

  map: {
    yourLocationMarker: 'Your Location',
    pointOnMap: 'Point on map',
    stopRouteTitle: 'End route?',
    stopRouteMessage: 'Navigation to the destination will stop.',
    continue: 'Continue',
    stop: 'End',
    stopRoute: 'End route',
    occurrenceSentTitle: 'Report submitted',
    occurrenceSentMessage: (protocol) =>
      `Thank you! Your report was sent anonymously.\nReference: ${protocol}`,
    locationDenied: 'Allow location access to plan routes.',
    locationError: 'Could not get your location.',
    centerA11y: 'Center on my location',
    simSpeedA11y: 'Simulation speed',
    simPauseA11y: 'Pause simulation',
    simStartA11y: 'Simulate ride',
    pickHint: 'Tap the map to mark the spot',
    reportAlertA11y: 'Report alert',
    alert: 'Alert',
    reportOccurrenceA11y: 'Report incident',
    occurrence: 'Incident',
  },

  annotation: {
    routeHere: 'Route here',
    now: 'just now',
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} h ago`,
    daysAgo: (n) => (n === 1 ? '1 day ago' : `${n} days ago`),
  },

  hazardCheck: {
    question: 'You just passed here. Is this problem still there?',
    open: 'Open',
    resolved: 'Not anymore',
    stillThere: 'Yes, still there',
  },

  reportAlert: {
    description: 'Description',
    assistant: 'Assistant',
    assistantPickType: 'Choose the alert type to get a suggestion.',
    submit: 'Alert',
    suggestions: {
      pothole: 'Pothole on the road, taking up part of the lane. Careful when swerving.',
      accident: 'Accident at the scene. Slow traffic, stay extra alert.',
      bikeLane: 'Problem with the bike lane on this stretch (blocked or poorly marked).',
      noLight: 'No street lighting at night. Use a headlight and reflective clothing.',
    },
  },

  reportOccurrence: {
    title: 'Report incident',
    anonymous: 'Anonymous',
    descriptionPlaceholder: 'What happened? (optional) E.g.: plate, vehicle color, time',
    attachLocation: 'Attach approximate location (~100 m)',
    attachLocationA11y: 'Attach approximate location',
    submit: 'Send anonymously',
    typePlaceholder: 'Incident type (e.g.: wrong way, sidewalk…)',
    typeA11y: 'Incident type',
    clearTypeA11y: 'Clear type',
    matches: (keyword) => `Matches “${keyword}”`,
  },

  navigation: {
    collapseA11y: 'Collapse route panel',
    expandA11y: 'Expand route panel',
    timeLeft: 'Time left',
    distance: 'Distance',
    avgSpeed: 'Avg. speed',
    rerouting: 'Recalculating route…',
  },

  photo: {
    cameraBlockedTitle: 'Camera blocked',
    cameraBlockedMessage: 'Allow camera access in Settings to take a photo of the spot.',
    title: 'Photo',
    openFailed: 'Could not open the camera or the gallery.',
    add: 'Add photo',
    change: 'Change photo',
    remove: 'Remove photo',
    camera: 'Camera',
    library: 'Gallery',
    label: 'PHOTO',
  },

  routePlanner: {
    swapA11y: 'Swap origin and destination',
    calculating: 'Calculating bike routes…',
    locationDenied: 'Allow location access to plan the route.',
    available: (n) => (n === 1 ? '1 ROUTE AVAILABLE' : `${n} ROUTES AVAILABLE`),
    start: 'Start route',
    attribution: 'Routes: OSRM · © OpenStreetMap contributors',
  },
};
