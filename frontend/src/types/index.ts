export interface User {
  uid: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  routesCount: number;
}

export interface RouteLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface Route {
  routeId: string;
  id?: string;
  userId: string;
  name: string;
  emoji?: string;
  origin: RouteLocation;
  destination: RouteLocation;
  departureTime: string;       // "HH:mm"
  daysOfWeek: number[];        // 0=dom, 1=seg … 6=sab
  alertAdvance: number;        // minutos
  alertTolerance: number;      // minutos
  isActive: boolean;
  baseTime: number | null;     // segundos
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertAlternative {
  description: string;
  duration: number;   // segundos
  distanceM: number;
}

export interface Alert {
  alertId: string;
  userId: string;
  routeId: string;
  routeName: string;
  triggeredAt: string;
  baseTime: number;
  currentTime: number;
  delay: number;
  incidentType: string | null;
  alternatives: AlertAlternative[];
  notificationSent: boolean;
  openedByUser: boolean;
}

export interface CheckResult {
  notified: boolean;
  reason?: string;
  alertId?: string;
  delaySeconds?: number;
  alternatives?: AlertAlternative[];
}
