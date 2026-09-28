import { useCallback, useSyncExternalStore } from "react";

const CHAVE = "dsales:ocultar-valores";

const listeners = new Set<() => void>();

function notificar() {
  listeners.forEach((l) => l());
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useOcultarValores() {
  const oculto = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const alternar = useCallback(() => {
    try {
      const proximo = !getSnapshot();
      if (proximo) {
        localStorage.setItem(CHAVE, "1");
      } else {
        localStorage.removeItem(CHAVE);
      }
    } catch {
      // localStorage indisponível
    }
    notificar();
  }, []);

  return { oculto, alternar } as const;
}
