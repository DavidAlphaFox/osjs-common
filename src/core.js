/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2018, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

const {resolveTreeByKey, providerOptions, providerHandler} = require('./utils.js');
const EventHandler = require('./event-handler.js');
const merge = require('deepmerge');

/**
 * Core
 *
 * @desc Main class for OS.js service providers and bootstrapping.
 */
class Core extends EventHandler {

  /**
   * Create core instance
   * @param {Array} defaultProviders Default providers
   * @param {Object} defaultConfiguration Default configuration
   * @param {Object} configuration Configuration given
   * @param {Object} options Options
   */
  constructor(defaultProviders, defaultConfiguration, configuration, options) {
    super('Core');

    const merger = merge.default ? merge.default : merge; // NOTE: Why ?!
    this.configuration = merger(defaultConfiguration, configuration);
    this.options = options;
    this.booted = false;
    this.started = false;
    this.destroyed = false;
    this.providers = providerHandler(this);

    if (options.registerDefault && defaultProviders.length) {
      const defaults = typeof options.registerDefault === 'object'
        ? options.registerDefault || {}
        : {};

      defaultProviders.forEach(p => this.register(p.class, providerOptions(p.name, defaults, p.options || {})))
    }
  }

  /**
   * Destroy core instance
   */
  destroy() {
    if (this.destroyed) {
      return false;
    }

    this.booted = false;
    this.destroyed = true;
    this.providers.destroy();

    return true;
  }

  /**
   * Boots up OS.js
   */
  boot() {
    if (this.booted) {
      return Promise.resolve(true);
    }

    this.booted = true;

    return this.providers.init(true)
      .then(() => true);
  }

  /**
   * Starts all core services
   */
  start() {
    if (this.started) {
      return Promise.resolve(true);
    }

    this.started = true;

    return this.providers.init(false)
      .then(() => true);
  }

  /**
   * Gets a configuration entry by key
   *
   * @param {String} key The key to get the value from
   * @param {*} [defaultValue] If result is undefined, return this instead
   * @see {resolveTreeByKey}
   * @return {*}
   */
  config(key, defaultValue) {
    return key
      ? resolveTreeByKey(this.configuration, key, defaultValue)
      : Object.assign({}, this.configuration);
  }

  /**
   * Register a service provider
   *
   * @param {Class} ref A class reference
   * @param {Object} [options] Options for handling of provider
   * @param {Boolean} [options.before] Load this provider early
   * @param {Object} [options.args] Arguments to send to the constructor
   */
  register(ref, options = {}) {
    this.providers.register(ref, options);
  }

  /**
   * Register a instanciator provider
   *
   * @param {String} name Provider name
   * @param {Function} callback Callback that returns an instance
   */
  instance(name, callback) {
    this.providers.bind(name, false, callback);
  }

  /**
   * Register a singleton provider
   *
   * @param {String} name Provider name
   * @param {Function} callback Callback that returns an instance
   */
  singleton(name, callback) {
    this.providers.bind(name, true, callback);
  }

  /**
   * Create an instance of a provided service
   *
   * @param {String} name Service name
   * @param {*} args Constructor arguments
   * @return {*} An instance of a service
   */
  make(name, ...args) {
    return this.providers.make(name, ...args);
  }

  /**
   * Check if a service exists
   * @param {String} name Provider name
   * @return {Boolean}
   */
  has(name) {
    return this.providers.has(name);
  }
}

module.exports = Core;
