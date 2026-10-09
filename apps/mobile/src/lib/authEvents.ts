/**
 * Mini event bus para que el interceptor de axios pueda avisar al AuthContext
 * que limpie su estado en memoria cuando recibe un 401, sin depender de hooks
 * ni de referencias circulares.
 */
type Listener = () => void;

let _onUnauthorized: Listener | null = null;

export function setUnauthorizedListener(fn: Listener) {
  _onUnauthorized = fn;
}

export function emitUnauthorized() {
  _onUnauthorized?.();
}
