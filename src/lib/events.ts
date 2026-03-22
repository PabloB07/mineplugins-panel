type EventType = "license_validated" | "server_checked";

interface ServerEvent {
  type: EventType;
  data: {
    licenseId?: string;
    licenseKey?: string;
    productId?: string;
    serverIp?: string;
    timestamp: string;
  };
}

class EventEmitter {
  private listeners: Map<string, Set<(event: ServerEvent) => void>> = new Map();

  emit(type: EventType, data: Omit<ServerEvent["data"], "timestamp">) {
    const event: ServerEvent = {
      type,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Event listener error:", error);
        }
      });
    }

    const globalListeners = this.listeners.get("*");
    if (globalListeners) {
      globalListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Global event listener error:", error);
        }
      });
    }
  }

  subscribe(type: EventType, callback: (event: ServerEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  subscribeAll(callback: (event: ServerEvent) => void): () => void {
    if (!this.listeners.has("*")) {
      this.listeners.set("*", new Set());
    }
    this.listeners.get("*")!.add(callback);

    return () => {
      this.listeners.get("*")?.delete(callback);
    };
  }

  getListenerCount(type?: EventType): number {
    if (type) {
      return this.listeners.get(type)?.size || 0;
    }
    let total = 0;
    this.listeners.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}

export const eventEmitter = new EventEmitter();

export type { ServerEvent, EventType };
