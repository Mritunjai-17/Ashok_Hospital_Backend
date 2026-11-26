const { EventEmitter } = require('events');

/**
 * Lightweight in-process domain event bus used to decouple microservices
 * when running in unified mode (and replaceable by HTTP/broker transport).
 */
class DomainEventBus extends EventEmitter {
  publish(eventName, payload) {
    const event = {
      eventName,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.emit(eventName, event);
    return event;
  }
}

module.exports = new DomainEventBus();
