'use strict';

// Project-owned adapter: evaluate on first access and retain the exact result.
const slots = new WeakMap();

class Lazy {
  constructor(factory) {
    slots.set(this, { factory, evaluated: false, result: undefined });
  }

  get hasValue() {
    return slots.get(this).evaluated;
  }

  get value() {
    const slot = slots.get(this);
    if (!slot.evaluated) {
      // A synchronous failure leaves the operation available for a later retry.
      // Promises, including rejected promises, are retained without wrapping.
      const result = slot.factory();
      slot.result = result;
      slot.evaluated = true;
      slot.factory = undefined;
    }
    return slot.result;
  }

  set value(result) {
    const slot = slots.get(this);
    slot.result = result;
    slot.evaluated = true;
    slot.factory = undefined;
  }
}

module.exports = { Lazy };
