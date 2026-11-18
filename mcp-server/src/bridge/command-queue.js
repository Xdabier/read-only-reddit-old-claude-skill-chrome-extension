const PICKUP_TIMEOUT_MS = 40_000;
const COMMAND_TIMEOUT_MS = 240_000;

const NOT_CONNECTED =
  'The read-only-reddit-old extension is not connected. Ask the user to open their browser and check that the extension is loaded and enabled.';

// Commands wait here until the extension polls for them.
export class CommandQueue {
  #queued = [];
  #inFlight = new Map();
  #nextId = 1;
  #lastPollAt = 0;
  #notifyReady = null;
  #pickupTimeoutMs;
  #commandTimeoutMs;

  constructor({ pickupTimeoutMs = PICKUP_TIMEOUT_MS, commandTimeoutMs = COMMAND_TIMEOUT_MS } = {}) {
    this.#pickupTimeoutMs = pickupTimeoutMs;
    this.#commandTimeoutMs = commandTimeoutMs;
  }

  onReady(listener) {
    this.#notifyReady = listener;
  }

  enqueue(type, params) {
    return new Promise((resolve, reject) => {
      const job = { command: { id: this.#nextId++, type, params }, resolve, reject, timer: null };
      this.#queued.push(job);
      this.#armPickupTimer(job);
      this.#notifyReady?.();
    });
  }

  // Called for every poll from the extension.
  take() {
    this.#lastPollAt = Date.now();
    const job = this.#queued.shift();
    if (!job) return null;

    clearTimeout(job.timer);
    job.timer = setTimeout(() => {
      this.#inFlight.delete(job.command.id);
      job.reject(new Error('The extension took too long to answer.'));
    }, this.#commandTimeoutMs);
    this.#inFlight.set(job.command.id, job);
    return job.command;
  }

  settle({ id, ok, data, error }) {
    const job = this.#inFlight.get(id);
    if (!job) return;
    this.#inFlight.delete(id);
    clearTimeout(job.timer);
    if (ok) job.resolve(data);
    else job.reject(new Error(error));
  }

  #extensionAlive() {
    return this.#inFlight.size > 0 || Date.now() - this.#lastPollAt < this.#pickupTimeoutMs;
  }

  #armPickupTimer(job) {
    job.timer = setTimeout(() => {
      // A busy extension is slow on purpose, so keep waiting for it.
      if (this.#extensionAlive()) return this.#armPickupTimer(job);
      this.#queued = this.#queued.filter((queued) => queued !== job);
      job.reject(new Error(NOT_CONNECTED));
    }, this.#pickupTimeoutMs);
  }
}
