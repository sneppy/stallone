import { Mutex } from "async-mutex"
import { reactive, markRaw } from "vue"

/**
 * A class that manages the data of an API resource.
 */
export class Record {
    /**
     * Construct a new record.
     *
     * @param {*} data - Initial recor data, can be `null`.
     */
    constructor(data = null) {
        /** Record data */
        this.data = data

        /** Record HTTP status */
        this.status = 0

        /** Record update timestamp */
        this.updatedAt = null

        /** Set of properties patched */
        this._patches = markRaw(new Set())

        /** List of listeners */
        this._listeners = markRaw([])

        /** Mutex used to prevent multiple updates */
        this._lock = markRaw(new Mutex())

        // Make reactive
        return reactive(this)
    }

    /**
     * Update the record data and keep note of which changes are made.
     *
     * @param {Object} patches - An object of prop-value pairs
     */
    patch(patches) {
        for (let prop in patches) {
            this.data[prop] = patches[prop]
            this._patches.add(prop)
        }
    }

    /**
     * Return an object with all the patches prop-value pairs.
     */
    getPatches() {
        let patches = {}
        for (let prop of this._patches.keys()) {
            patches[prop] = this.data[prop]
        }

        return patches
    }

    /**
     * Called to clear all the patches.
     */
    clearPatches() {
        // Clear patches
        this._patches.clear()
    }

    /**
     * Execute an update in exclusive mode.
     *
     * @param {Function} doUpdate - The update callback
     * @return {this}
     */
    async updateAsync(doUpdate) {
        // Acquire lock
        let release = await this._lock.acquire()
        try {
            let event = (await doUpdate(this)) || null
            if (event) {
                // Update timestamp
                this.updatedAt = Date.now()
                // Notify listeners
                this._notifyAll(event)
            }
        } catch (err) {
            // TODO: Handle error
            console.error(err)
        } finally {
            // Release lock
            release()
        }

        return this
    }

    /**
     * Register to the record update events
     *
     * @param {Function} notify event callback, return true to unregister
     */
    listen(notify) {
        // Add to list of listeners
        this._listeners.push(notify)
    }

    /**
     * Called to notify all listeners about an update.
     *
     * @param {String} event - The type of the event.
     */
    _notifyAll(event) {
        this._listeners = this._listeners.filter((notify) =>
            notify(this, event),
        )
    }
}
