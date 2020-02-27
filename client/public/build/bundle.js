
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.18.0 */

    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	setTimeout(
    		() => {
    			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    		},
    		0
    	);
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// We need an iterable: if it's not a Map, use Object.entries
    	const routesIterable = routes instanceof Map ? routes : Object.entries(routes);

    	// Set up all routes
    	const routesList = [];

    	for (const [path, route] of routesIterable) {
    		routesList.push(new RouteItem(path, route));
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);
    						$$invalidate(1, componentParams = match);
    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [component, componentParams, routes, prefix];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function bugsFunc() {
      const { subscribe, set, update } = writable(null);

      async function loadBugs() {
        const req = await fetch("http://10.0.0.75:5500/api/v1/bugs/project", {
          method: "GET",
          credentials: "include"
        });

        const res = await req.json();

        if (res.success) {
          update(n => res.data.bugs);
        }
      }

      async function newBug(body) {
        const req = await fetch("http://10.0.0.75:5500/api/v1/bugs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const res = await req.json();

        if (res.success) {
          update(n => {
            n = [res.data, ...n];
            return n;
          });
          return true;
        } else {
          M.toast({ html: `${res.error}`, classes: "red" });
          return res;
        }
      }

      async function deleteBug(id, i) {
        const req = await fetch(`http://10.0.0.75:5500/api/v1/bugs/${id}`, {
          method: "DELETE",
          credentials: "include"
        });

        const res = await req.json();

        if (res.success) {
          update(n => {
            n.splice(i, 1);
            return n;
          });
          return true;
        } else {
          return res;
        }
      }

      async function editBug(editBody, id, i) {
        const req = await fetch(`http://10.0.0.75:5500/api/v1/bugs/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editBody)
        });

        const res = await req.json();

        if (res.success) {
          update(n => {
            n[i] = res.data;
            return n;
          });
          return true;
        } else {
          return res;
        }
      }

      function sortBugs(sortBy) {
        update(n => {
          let sorted = [...n].sort((bug, nextBug) => {
            let X;
            let Y;
            sortBy === "reporter" || sortBy === "fixer"
              ? (X = bug[sortBy].name.toUpperCase())
              : (X = bug[sortBy].toUpperCase());
            sortBy === "reporter" || sortBy === "fixer"
              ? (Y = nextBug[sortBy].name.toUpperCase())
              : (Y = nextBug[sortBy].toUpperCase());
            if (X > Y) return 1;
            if (X < Y) return -1;
            return 0;
          });

          let wasChanged = false;
          n.forEach((bug, index) => {
            if (bug !== sorted[index]) wasChanged = true;
          });

          if (!wasChanged) sorted = sorted.reverse();

          return (n = sorted);
        });
      }

      function clearBugs() {
        update(n => (n = null));
      }

      return {
        subscribe,
        loadBugs: loadBugs,
        newBug: newBug,
        deleteBug: deleteBug,
        editBug: editBug,
        clearBugs: clearBugs,
        sortBugs: sortBugs
      };
    }

    const bugs = bugsFunc();

    function account() {
      const { subscribe, set, update } = writable(false);

      async function getMe() {
        // try {
        const req = await fetch("http://10.0.0.75:5500/api/v1/auth/me", {
          method: "GET",
          credentials: "include"
        });

        const res = await req.json();

        if (res.success) {
          set(true);
          push("/projects");
        } else {
          M.toast({ html: `${res.error}`, classes: "red" });
          push("/login");
          set(false);
        }
        // } catch (err) {
        //   set(false);
        //   push("/login");
        // }
      }

      async function login(body) {
        try {
          const req = await fetch("http://10.0.0.75:5500/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
          });

          const res = await req.json();

          if (res.success) {
            set(true);
            push("/projects");
          } else {
            M.toast({ html: `${res.error}`, classes: "red" });
          }
        } catch (err) {
          console.log(err);
        }
      }

      async function logout() {
        try {
          const req = await fetch("http://10.0.0.75:5500/api/v1/auth/logout", {
            method: "GET",
            credentials: "include"
          });

          const res = await req.json();

          if (res.success) {
            bugs.clearBugs();
            set(false);
            push("/login");
          } else {
            M.toast({ html: `${res.error}`, classes: "red" });
          }
        } catch (err) {
          M.toast({ html: `${err}`, classes: "red" });
        }
      }

      async function createUser(userBody) {
        try {
          const req = await fetch("http://10.0.0.75:5500/api/v1/auth/register", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userBody)
          });

          const res = await req.json();

          if (res.success) {
            set(true);
            push("/projects");
          }
        } catch (err) {
          console.log(err);
        }
      }

      return {
        subscribe,
        set,
        update,
        getMe: getMe,
        login: login,
        logout: logout,
        createUser: createUser
      };
    }

    const login = account();

    function projectsFunc() {
      const { subscribe, set, update } = writable([]);

      async function getProjects() {
        try {
          const req = await fetch(
            "http://10.0.0.75:5500/api/v1/projects/getProjects",
            {
              method: "GET",
              credentials: "include"
            }
          );

          const res = await req.json();

          if (res.success) {
            update(n => res.data);
          } else {
            M.toast({ html: `${res.error}`, classes: "red" });
          }
        } catch (err) {
          console.log(err);
          M.toast({ html: `${err}`, classes: "red" });
        }
      }

      async function getProjectInfo() {
        const req = await fetch(
          "http://10.0.0.75:5500/api/v1/projects/getProject",
          {
            method: "GET",
            credentials: "include"
          }
        );

        const res = await req.json();

        return res;
      }

      async function setProject(id) {
        try {
          const req = await fetch(`http://10.0.0.75:5500/api/v1/projects/${id}`, {
            method: "GET",
            credentials: "include"
          });

          const res = await req.json();

          return res;
        } catch (err) {
          M.toast({ html: `${err}`, classes: "red" });
        }
      }

      async function deleteProject(id, index) {
        const req = await fetch(`http://10.0.0.75:5500/api/v1/projects/${id}`, {
          method: "GET",
          credentials: "include"
        });

        const res = await req.json();

        if (!res.success) return console.log(res);

        const deleteReq = await fetch("http://10.0.0.75:5500/api/v1/projects", {
          method: "DELETE",
          credentials: "include"
        });

        const deleteRes = await deleteReq.json();

        if (deleteRes.success) {
          update(n => {
            n.splice(index, 1);
            return n;
          });
        }
      }

      async function newProject(newProjectBody) {
        try {
          const req = await fetch("http://10.0.0.75:5500/api/v1/projects", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProjectBody)
          });

          const res = await req.json();

          return res;
        } catch (err) {
          M.toast({ html: `${err}`, classes: "red" });
        }
      }

      async function editProject(project, index) {
        const req = await fetch("http://10.0.0.75:5500/api/v1/projects", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(project)
        });

        const res = await req.json();

        if (res.success) {
          update(n => {
            n[index] = res.data;
            return n;
          });
        } else {
          M.toast({ html: `${res.error}`, classes: "red" });
        }
      }

      return {
        subscribe,
        getProjects: getProjects,
        getProjectInfo: getProjectInfo,
        setProject: setProject,
        deleteProject: deleteProject,
        newProject: newProject,
        editProject: editProject
      };
    }

    const projectsData = projectsFunc();

    /* src\LoggedInNav.svelte generated by Svelte v3.18.0 */
    const file = "src\\LoggedInNav.svelte";

    // (74:2) {#if $location === '/bugs'}
    function create_if_block_3(ctx) {
    	let li;
    	let a;
    	let a_href_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			a.textContent = "Projects";
    			attr_dev(a, "href", a_href_value = null);
    			add_location(a, file, 75, 6, 2040);
    			add_location(li, file, 74, 4, 2028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			dispose = listen_dev(a, "click", /*projects*/ ctx[6], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(74:2) {#if $location === '/bugs'}",
    		ctx
    	});

    	return block;
    }

    // (91:2) {#if $location === '/bugs'}
    function create_if_block_2(ctx) {
    	let li;
    	let a;
    	let i;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			i = element("i");
    			i.textContent = "bug_report";
    			t1 = text("\r\n        New Bug");
    			attr_dev(i, "class", "material-icons blue-text text-darken-4");
    			set_style(i, "margin-right", "0.5rem");
    			add_location(i, file, 93, 8, 2440);
    			attr_dev(a, "class", "blue-text modal-trigger");
    			attr_dev(a, "href", "#newBugModal");
    			add_location(a, file, 92, 6, 2375);
    			add_location(li, file, 91, 4, 2363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, i);
    			append_dev(a, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(91:2) {#if $location === '/bugs'}",
    		ctx
    	});

    	return block;
    }

    // (131:2) {#if $location === '/bugs'}
    function create_if_block_1(ctx) {
    	let li;
    	let a;
    	let a_href_value;
    	let t1;
    	let hr;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			a.textContent = "Projects";
    			t1 = space();
    			hr = element("hr");
    			attr_dev(a, "href", a_href_value = null);
    			add_location(a, file, 132, 6, 3276);
    			add_location(li, file, 131, 4, 3264);
    			attr_dev(hr, "class", "svelte-1aqcat9");
    			add_location(hr, file, 134, 4, 3340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			dispose = listen_dev(a, "click", /*projects*/ ctx[6], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(131:2) {#if $location === '/bugs'}",
    		ctx
    	});

    	return block;
    }

    // (143:6) {#if $location === '/bugs'}
    function create_if_block(ctx) {
    	let a;
    	let t1;
    	let hr;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "New Bug";
    			t1 = space();
    			hr = element("hr");
    			attr_dev(a, "class", "blue-text modal-trigger sidenav-close");
    			set_style(a, "padding-left", "64px");
    			attr_dev(a, "href", "#newBugModal");
    			add_location(a, file, 143, 8, 3579);
    			attr_dev(hr, "class", "svelte-1aqcat9");
    			add_location(hr, file, 149, 8, 3751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(143:6) {#if $location === '/bugs'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul0;
    	let li0;
    	let a0;
    	let a0_href_value;
    	let t1;
    	let t2;
    	let li1;
    	let a1;
    	let a1_href_value;
    	let t4;
    	let ul1;
    	let t5;
    	let li2;
    	let a2;
    	let i0;
    	let t7;
    	let t8;
    	let ul2;
    	let div0;
    	let i1;
    	let t10;
    	let hr0;
    	let t11;
    	let li3;
    	let a3;
    	let a3_href_value;
    	let t13;
    	let hr1;
    	let t14;
    	let t15;
    	let li4;
    	let div1;
    	let t17;
    	let hr2;
    	let t18;
    	let div2;
    	let t19;
    	let a4;
    	let t21;
    	let div10;
    	let div9;
    	let h40;
    	let t23;
    	let div8;
    	let div3;
    	let input0;
    	let t24;
    	let div4;
    	let input1;
    	let t25;
    	let div5;
    	let textarea0;
    	let t26;
    	let div6;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t30;
    	let div7;
    	let select1;
    	let option3;
    	let option4;
    	let option5;
    	let t34;
    	let button0;
    	let t36;
    	let div16;
    	let div15;
    	let h41;
    	let t38;
    	let div14;
    	let div11;
    	let input2;
    	let t39;
    	let div12;
    	let textarea1;
    	let t40;
    	let div13;
    	let button1;
    	let dispose;
    	let if_block0 = /*$location*/ ctx[3] === "/bugs" && create_if_block_3(ctx);
    	let if_block1 = /*$location*/ ctx[3] === "/bugs" && create_if_block_2(ctx);
    	let if_block2 = /*$location*/ ctx[3] === "/bugs" && create_if_block_1(ctx);
    	let if_block3 = /*$location*/ ctx[3] === "/bugs" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Logout";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Add";
    			t4 = space();
    			ul1 = element("ul");
    			if (if_block1) if_block1.c();
    			t5 = space();
    			li2 = element("li");
    			a2 = element("a");
    			i0 = element("i");
    			i0.textContent = "view_list";
    			t7 = text("\r\n      New Project");
    			t8 = space();
    			ul2 = element("ul");
    			div0 = element("div");
    			i1 = element("i");
    			i1.textContent = "bug_report";
    			t10 = space();
    			hr0 = element("hr");
    			t11 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "logout";
    			t13 = space();
    			hr1 = element("hr");
    			t14 = space();
    			if (if_block2) if_block2.c();
    			t15 = space();
    			li4 = element("li");
    			div1 = element("div");
    			div1.textContent = "Add";
    			t17 = space();
    			hr2 = element("hr");
    			t18 = space();
    			div2 = element("div");
    			if (if_block3) if_block3.c();
    			t19 = space();
    			a4 = element("a");
    			a4.textContent = "New Project";
    			t21 = space();
    			div10 = element("div");
    			div9 = element("div");
    			h40 = element("h4");
    			h40.textContent = "New Bug";
    			t23 = space();
    			div8 = element("div");
    			div3 = element("div");
    			input0 = element("input");
    			t24 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t25 = space();
    			div5 = element("div");
    			textarea0 = element("textarea");
    			t26 = space();
    			div6 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "severity";
    			option1 = element("option");
    			option1.textContent = "Major";
    			option2 = element("option");
    			option2.textContent = "Minor";
    			t30 = space();
    			div7 = element("div");
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "reproduceability";
    			option4 = element("option");
    			option4.textContent = "Always";
    			option5 = element("option");
    			option5.textContent = "Intermitent";
    			t34 = space();
    			button0 = element("button");
    			button0.textContent = "Submit";
    			t36 = space();
    			div16 = element("div");
    			div15 = element("div");
    			h41 = element("h4");
    			h41.textContent = "New Project";
    			t38 = space();
    			div14 = element("div");
    			div11 = element("div");
    			input2 = element("input");
    			t39 = space();
    			div12 = element("div");
    			textarea1 = element("textarea");
    			t40 = space();
    			div13 = element("div");
    			button1 = element("button");
    			button1.textContent = "Submit";
    			attr_dev(a0, "href", a0_href_value = null);
    			add_location(a0, file, 71, 4, 1925);
    			add_location(li0, file, 70, 2, 1915);
    			set_style(a1, "width", "5rem");
    			attr_dev(a1, "class", "dropdown-trigger center");
    			attr_dev(a1, "data-target", "dropdown1");
    			attr_dev(a1, "href", a1_href_value = null);
    			add_location(a1, file, 79, 4, 2121);
    			add_location(li1, file, 78, 2, 2111);
    			attr_dev(ul0, "class", "right hide-on-med-and-down");
    			add_location(ul0, file, 69, 0, 1872);
    			attr_dev(i0, "class", "material-icons blue-text text-darken-4");
    			set_style(i0, "margin-right", "0.5rem");
    			add_location(i0, file, 104, 6, 2708);
    			attr_dev(a2, "class", "blue-text modal-trigger");
    			attr_dev(a2, "href", "#newProjectModal");
    			add_location(a2, file, 103, 4, 2641);
    			add_location(li2, file, 102, 2, 2631);
    			attr_dev(ul1, "id", "dropdown1");
    			attr_dev(ul1, "class", "dropdown-content");
    			add_location(ul1, file, 89, 0, 2282);
    			attr_dev(i1, "class", "material-icons black-text");
    			add_location(i1, file, 116, 4, 2965);
    			attr_dev(div0, "class", "center");
    			add_location(div0, file, 115, 2, 2939);
    			attr_dev(hr0, "class", "svelte-1aqcat9");
    			add_location(hr0, file, 118, 2, 3030);
    			attr_dev(a3, "href", a3_href_value = null);
    			add_location(a3, file, 120, 4, 3050);
    			add_location(li3, file, 119, 2, 3040);
    			attr_dev(hr1, "class", "svelte-1aqcat9");
    			add_location(hr1, file, 129, 2, 3221);
    			set_style(div1, "padding", "0 32px");
    			attr_dev(div1, "class", "collapsible-header black-text");
    			add_location(div1, file, 137, 4, 3369);
    			attr_dev(hr2, "class", "svelte-1aqcat9");
    			add_location(hr2, file, 140, 4, 3466);
    			attr_dev(a4, "class", "blue-text modal-trigger sidenav-close");
    			set_style(a4, "padding-left", "64px");
    			attr_dev(a4, "href", "#newProjectModal");
    			add_location(a4, file, 151, 6, 3778);
    			attr_dev(div2, "class", "collapsible-body black-text grey lighten-2");
    			add_location(div2, file, 141, 4, 3478);
    			add_location(li4, file, 136, 2, 3359);
    			attr_dev(ul2, "class", "sidenav collapsible");
    			attr_dev(ul2, "id", "mobile-demo");
    			add_location(ul2, file, 114, 0, 2886);
    			attr_dev(h40, "class", "center cyan-text text-darken-4");
    			set_style(h40, "font-weight", "300");
    			add_location(h40, file, 163, 4, 4094);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "name");
    			attr_dev(input0, "class", "svelte-1aqcat9");
    			add_location(input0, file, 168, 8, 4273);
    			attr_dev(div3, "class", "input-field col s10 offset-s1 svelte-1aqcat9");
    			add_location(div3, file, 167, 6, 4220);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "fixer (must be a users email)");
    			attr_dev(input1, "class", "svelte-1aqcat9");
    			add_location(input1, file, 171, 8, 4417);
    			attr_dev(div4, "class", "input-field col s10 offset-s1 svelte-1aqcat9");
    			add_location(div4, file, 170, 6, 4364);
    			attr_dev(textarea0, "class", "materialize-textarea");
    			attr_dev(textarea0, "placeholder", "description");
    			add_location(textarea0, file, 177, 8, 4620);
    			attr_dev(div5, "class", "input-field col s10 offset-s1");
    			add_location(div5, file, 176, 6, 4567);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.disabled = true;
    			option0.selected = true;
    			add_location(option0, file, 184, 10, 4883);
    			option1.__value = "Major";
    			option1.value = option1.__value;
    			add_location(option1, file, 185, 10, 4947);
    			option2.__value = "Minor";
    			option2.value = option2.__value;
    			add_location(option2, file, 186, 10, 4995);
    			if (/*newBugBody*/ ctx[1].severity === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[14].call(select0));
    			add_location(select0, file, 183, 8, 4830);
    			attr_dev(div6, "class", "input-field col s4 offset-s1");
    			add_location(div6, file, 182, 6, 4778);
    			option3.__value = "";
    			option3.value = option3.__value;
    			option3.disabled = true;
    			option3.selected = true;
    			add_location(option3, file, 191, 10, 5198);
    			option4.__value = "Always";
    			option4.value = option4.__value;
    			add_location(option4, file, 192, 10, 5270);
    			option5.__value = "Intermitent";
    			option5.value = option5.__value;
    			add_location(option5, file, 193, 10, 5320);
    			if (/*newBugBody*/ ctx[1].reproduceability === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[15].call(select1));
    			add_location(select1, file, 190, 8, 5137);
    			attr_dev(div7, "class", "input-field col s5 m4 offset-s1 offset-m2");
    			add_location(div7, file, 189, 6, 5072);
    			attr_dev(button0, "class", "col s8 offset-s2 modal-close waves-effect waves-green btn\r\n        btn-large blue-grey");
    			set_style(button0, "margin-top", "2rem");
    			add_location(button0, file, 196, 6, 5409);
    			attr_dev(div8, "class", "row");
    			add_location(div8, file, 166, 4, 4195);
    			attr_dev(div9, "class", "modal-content black-text");
    			add_location(div9, file, 162, 2, 4050);
    			attr_dev(div10, "id", "newBugModal");
    			attr_dev(div10, "class", "modal grey lighten-4");
    			set_style(div10, "max-width", "640px");
    			add_location(div10, file, 161, 0, 3970);
    			attr_dev(h41, "class", "cyan-text text-darken-4 center");
    			set_style(h41, "font-weight", "300");
    			add_location(h41, file, 212, 4, 5791);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "name");
    			attr_dev(input2, "class", "svelte-1aqcat9");
    			add_location(input2, file, 217, 8, 5974);
    			attr_dev(div11, "class", "input-field col s10 offset-s1 svelte-1aqcat9");
    			add_location(div11, file, 216, 6, 5921);
    			attr_dev(textarea1, "class", "materialize-textarea");
    			attr_dev(textarea1, "placeholder", "description");
    			add_location(textarea1, file, 223, 8, 6155);
    			attr_dev(div12, "class", "input-field col s10 offset-s1");
    			add_location(div12, file, 222, 6, 6102);
    			attr_dev(button1, "class", "modal-close waves-effect waves-green btn btn-large blue-grey\r\n          col s8 offset-s2");
    			add_location(button1, file, 229, 8, 6332);
    			add_location(div13, file, 228, 6, 6317);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file, 215, 4, 5896);
    			attr_dev(div15, "class", "modal-content");
    			add_location(div15, file, 211, 2, 5758);
    			attr_dev(div16, "id", "newProjectModal");
    			attr_dev(div16, "class", "modal grey lighten-4");
    			set_style(div16, "max-width", "640px");
    			add_location(div16, file, 207, 0, 5664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t1);
    			if (if_block0) if_block0.m(ul0, null);
    			append_dev(ul0, t2);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, ul1, anchor);
    			if (if_block1) if_block1.m(ul1, null);
    			append_dev(ul1, t5);
    			append_dev(ul1, li2);
    			append_dev(li2, a2);
    			append_dev(a2, i0);
    			append_dev(a2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, ul2, anchor);
    			append_dev(ul2, div0);
    			append_dev(div0, i1);
    			append_dev(ul2, t10);
    			append_dev(ul2, hr0);
    			append_dev(ul2, t11);
    			append_dev(ul2, li3);
    			append_dev(li3, a3);
    			append_dev(ul2, t13);
    			append_dev(ul2, hr1);
    			append_dev(ul2, t14);
    			if (if_block2) if_block2.m(ul2, null);
    			append_dev(ul2, t15);
    			append_dev(ul2, li4);
    			append_dev(li4, div1);
    			append_dev(li4, t17);
    			append_dev(li4, hr2);
    			append_dev(li4, t18);
    			append_dev(li4, div2);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div2, t19);
    			append_dev(div2, a4);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, h40);
    			append_dev(div9, t23);
    			append_dev(div9, div8);
    			append_dev(div8, div3);
    			append_dev(div3, input0);
    			set_input_value(input0, /*newBugBody*/ ctx[1].name);
    			append_dev(div8, t24);
    			append_dev(div8, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*newBugBody*/ ctx[1].fixer);
    			append_dev(div8, t25);
    			append_dev(div8, div5);
    			append_dev(div5, textarea0);
    			set_input_value(textarea0, /*newBugBody*/ ctx[1].description);
    			append_dev(div8, t26);
    			append_dev(div8, div6);
    			append_dev(div6, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*newBugBody*/ ctx[1].severity);
    			append_dev(div8, t30);
    			append_dev(div8, div7);
    			append_dev(div7, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			select_option(select1, /*newBugBody*/ ctx[1].reproduceability);
    			append_dev(div8, t34);
    			append_dev(div8, button0);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div15);
    			append_dev(div15, h41);
    			append_dev(div15, t38);
    			append_dev(div15, div14);
    			append_dev(div14, div11);
    			append_dev(div11, input2);
    			set_input_value(input2, /*newProjectBody*/ ctx[2].name);
    			append_dev(div14, t39);
    			append_dev(div14, div12);
    			append_dev(div12, textarea1);
    			set_input_value(textarea1, /*newProjectBody*/ ctx[2].description);
    			append_dev(div14, t40);
    			append_dev(div14, div13);
    			append_dev(div13, button1);

    			dispose = [
    				listen_dev(a0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(a3, "click", prevent_default(/*click_handler_1*/ ctx[10]), false, true, false),
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    				listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[13]),
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[14]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[15]),
    				listen_dev(button0, "click", prevent_default(/*newBug*/ ctx[4]), false, true, false),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[16]),
    				listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[17]),
    				listen_dev(button1, "click", prevent_default(/*newProject*/ ctx[5]), false, true, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$location*/ ctx[3] === "/bugs") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(ul0, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$location*/ ctx[3] === "/bugs") {
    				if (!if_block1) {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(ul1, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$location*/ ctx[3] === "/bugs") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(ul2, t15);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$location*/ ctx[3] === "/bugs") {
    				if (!if_block3) {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div2, t19);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*newBugBody*/ 2 && input0.value !== /*newBugBody*/ ctx[1].name) {
    				set_input_value(input0, /*newBugBody*/ ctx[1].name);
    			}

    			if (dirty & /*newBugBody*/ 2 && input1.value !== /*newBugBody*/ ctx[1].fixer) {
    				set_input_value(input1, /*newBugBody*/ ctx[1].fixer);
    			}

    			if (dirty & /*newBugBody*/ 2) {
    				set_input_value(textarea0, /*newBugBody*/ ctx[1].description);
    			}

    			if (dirty & /*newBugBody*/ 2) {
    				select_option(select0, /*newBugBody*/ ctx[1].severity);
    			}

    			if (dirty & /*newBugBody*/ 2) {
    				select_option(select1, /*newBugBody*/ ctx[1].reproduceability);
    			}

    			if (dirty & /*newProjectBody*/ 4 && input2.value !== /*newProjectBody*/ ctx[2].name) {
    				set_input_value(input2, /*newProjectBody*/ ctx[2].name);
    			}

    			if (dirty & /*newProjectBody*/ 4) {
    				set_input_value(textarea1, /*newProjectBody*/ ctx[2].description);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(ul1);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(ul2);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(div16);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $bugs;
    	let $location;
    	validate_store(bugs, "bugs");
    	component_subscribe($$self, bugs, $$value => $$invalidate(8, $bugs = $$value));
    	validate_store(location, "location");
    	component_subscribe($$self, location, $$value => $$invalidate(3, $location = $$value));
    	let sideNavInstance;
    	let modalInstances;
    	let newBugBody = {};
    	let newProjectBody = {};

    	onMount(() => {
    		const modalElems = document.querySelectorAll(".modal");
    		modalInstances = M.Modal.init(modalElems);
    		const collapsibleElems = document.querySelectorAll(".collapsible");
    		const collapsibleInstances = M.Collapsible.init(collapsibleElems);
    		const sideNavElems = document.querySelectorAll(".sidenav");
    		$$invalidate(0, sideNavInstance = M.Sidenav.init(sideNavElems));
    		const dropdownElems = document.querySelectorAll(".dropdown-trigger");

    		const dropdownInstances = M.Dropdown.init(dropdownElems, {
    			alignment: "right",
    			constrainWidth: false,
    			coverTrigger: false,
    			hover: true
    		});

    		const selectElems = document.querySelectorAll("select");
    		const selectInstances = M.FormSelect.init(selectElems);
    	});

    	const newBug = async () => {
    		for (let key in newBugBody) {
    			if (newBugBody[key] === "") delete newBugBody[key];
    		}

    		const res = await bugs.newBug(newBugBody);
    	};

    	const newProject = async () => {
    		const res = await projectsData.newProject(newProjectBody);

    		if (res.success) {
    			push("/bugs");
    		}
    	};

    	afterUpdate(() => {
    		if ($bugs !== null && $bugs.length === 0) {
    			modalInstances[0].open();
    		}
    	});

    	const projects = () => {
    		push("/projects");
    		bugs.clearBugs();
    		sideNavInstance[0].close();
    	};

    	const click_handler = () => login.logout();

    	const click_handler_1 = () => {
    		login.logout();
    		sideNavInstance[0].close();
    	};

    	function input0_input_handler() {
    		newBugBody.name = this.value;
    		$$invalidate(1, newBugBody);
    	}

    	function input1_input_handler() {
    		newBugBody.fixer = this.value;
    		$$invalidate(1, newBugBody);
    	}

    	function textarea0_input_handler() {
    		newBugBody.description = this.value;
    		$$invalidate(1, newBugBody);
    	}

    	function select0_change_handler() {
    		newBugBody.severity = select_value(this);
    		$$invalidate(1, newBugBody);
    	}

    	function select1_change_handler() {
    		newBugBody.reproduceability = select_value(this);
    		$$invalidate(1, newBugBody);
    	}

    	function input2_input_handler() {
    		newProjectBody.name = this.value;
    		$$invalidate(2, newProjectBody);
    	}

    	function textarea1_input_handler() {
    		newProjectBody.description = this.value;
    		$$invalidate(2, newProjectBody);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("sideNavInstance" in $$props) $$invalidate(0, sideNavInstance = $$props.sideNavInstance);
    		if ("modalInstances" in $$props) modalInstances = $$props.modalInstances;
    		if ("newBugBody" in $$props) $$invalidate(1, newBugBody = $$props.newBugBody);
    		if ("newProjectBody" in $$props) $$invalidate(2, newProjectBody = $$props.newProjectBody);
    		if ("$bugs" in $$props) bugs.set($bugs = $$props.$bugs);
    		if ("$location" in $$props) location.set($location = $$props.$location);
    	};

    	return [
    		sideNavInstance,
    		newBugBody,
    		newProjectBody,
    		$location,
    		newBug,
    		newProject,
    		projects,
    		modalInstances,
    		$bugs,
    		click_handler,
    		click_handler_1,
    		input0_input_handler,
    		input1_input_handler,
    		textarea0_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		input2_input_handler,
    		textarea1_input_handler
    	];
    }

    class LoggedInNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedInNav",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\LoggedOutNav.svelte generated by Svelte v3.18.0 */
    const file$1 = "src\\LoggedOutNav.svelte";

    function create_fragment$2(ctx) {
    	let ul0;
    	let li0;
    	let a0;
    	let a0_href_value;
    	let t1;
    	let li1;
    	let a1;
    	let a1_href_value;
    	let t3;
    	let li2;
    	let a2;
    	let link_action;
    	let t5;
    	let ul1;
    	let div;
    	let i;
    	let t7;
    	let hr0;
    	let t8;
    	let li3;
    	let a3;
    	let a3_href_value;
    	let t10;
    	let hr1;
    	let t11;
    	let li4;
    	let a4;
    	let a4_href_value;
    	let t13;
    	let hr2;
    	let t14;
    	let li5;
    	let a5;
    	let t16;
    	let hr3;
    	let dispose;

    	const block = {
    		c: function create() {
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "login";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "join";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "info";
    			t5 = space();
    			ul1 = element("ul");
    			div = element("div");
    			i = element("i");
    			i.textContent = "bug_report";
    			t7 = space();
    			hr0 = element("hr");
    			t8 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "login";
    			t10 = space();
    			hr1 = element("hr");
    			t11 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "join";
    			t13 = space();
    			hr2 = element("hr");
    			t14 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "info";
    			t16 = space();
    			hr3 = element("hr");
    			attr_dev(a0, "href", a0_href_value = null);
    			add_location(a0, file$1, 30, 4, 577);
    			add_location(li0, file$1, 29, 2, 567);
    			attr_dev(a1, "href", a1_href_value = null);
    			add_location(a1, file$1, 33, 4, 660);
    			add_location(li1, file$1, 32, 2, 650);
    			attr_dev(a2, "href", "/info");
    			add_location(a2, file$1, 36, 4, 747);
    			add_location(li2, file$1, 35, 2, 737);
    			attr_dev(ul0, "class", "right hide-on-med-and-down");
    			add_location(ul0, file$1, 28, 0, 524);
    			attr_dev(i, "class", "material-icons black-text");
    			add_location(i, file$1, 42, 4, 879);
    			attr_dev(div, "class", "center");
    			add_location(div, file$1, 41, 2, 853);
    			attr_dev(hr0, "class", "svelte-15zfvuu");
    			add_location(hr0, file$1, 44, 2, 944);
    			attr_dev(a3, "href", a3_href_value = null);
    			add_location(a3, file$1, 46, 4, 964);
    			add_location(li3, file$1, 45, 2, 954);
    			attr_dev(hr1, "class", "svelte-15zfvuu");
    			add_location(hr1, file$1, 48, 2, 1037);
    			attr_dev(a4, "href", a4_href_value = null);
    			add_location(a4, file$1, 50, 4, 1057);
    			add_location(li4, file$1, 49, 2, 1047);
    			attr_dev(hr2, "class", "svelte-15zfvuu");
    			add_location(hr2, file$1, 52, 2, 1119);
    			attr_dev(a5, "href", "#!");
    			add_location(a5, file$1, 54, 4, 1139);
    			add_location(li5, file$1, 53, 2, 1129);
    			attr_dev(hr3, "class", "svelte-15zfvuu");
    			add_location(hr3, file$1, 56, 2, 1173);
    			attr_dev(ul1, "class", "sidenav collapsible");
    			attr_dev(ul1, "id", "mobile-demo");
    			add_location(ul1, file$1, 40, 0, 800);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t1);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(ul0, t3);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, div);
    			append_dev(div, i);
    			append_dev(ul1, t7);
    			append_dev(ul1, hr0);
    			append_dev(ul1, t8);
    			append_dev(ul1, li3);
    			append_dev(li3, a3);
    			append_dev(ul1, t10);
    			append_dev(ul1, hr1);
    			append_dev(ul1, t11);
    			append_dev(ul1, li4);
    			append_dev(li4, a4);
    			append_dev(ul1, t13);
    			append_dev(ul1, hr2);
    			append_dev(ul1, t14);
    			append_dev(ul1, li5);
    			append_dev(li5, a5);
    			append_dev(ul1, t16);
    			append_dev(ul1, hr3);

    			dispose = [
    				listen_dev(a0, "click", prevent_default(/*loginPage*/ ctx[1]), false, true, false),
    				listen_dev(a1, "click", prevent_default(/*createUserPage*/ ctx[0]), false, true, false),
    				action_destroyer(link_action = link.call(null, a2)),
    				listen_dev(a3, "click", prevent_default(/*loginPage*/ ctx[1]), false, true, false),
    				listen_dev(a4, "click", /*createUserPage*/ ctx[0], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(ul1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	let sideNavInstance;

    	const createUserPage = () => {
    		sideNavInstance[0].close();
    		push("/createUser");
    	};

    	const loginPage = () => {
    		sideNavInstance[0].close();
    		push("/login");
    	};

    	onMount(function () {
    		let elems = document.querySelectorAll(".sidenav");
    		sideNavInstance = M.Sidenav.init(elems);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("sideNavInstance" in $$props) sideNavInstance = $$props.sideNavInstance;
    	};

    	return [createUserPage, loginPage];
    }

    class LoggedOutNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedOutNav",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Navbar.svelte generated by Svelte v3.18.0 */
    const file$2 = "src\\Navbar.svelte";

    // (20:6) {:else}
    function create_else_block(ctx) {
    	let current;
    	const loggedoutnav = new LoggedOutNav({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loggedoutnav.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loggedoutnav, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loggedoutnav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loggedoutnav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loggedoutnav, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:6) {#if $login}
    function create_if_block$1(ctx) {
    	let current;
    	const loggedinnav = new LoggedInNav({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loggedinnav.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loggedinnav, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loggedinnav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loggedinnav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loggedinnav, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(18:6) {#if $login}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let a0;
    	let t1;
    	let a1;
    	let i;
    	let a1_href_value;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$login*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Aquilaa";
    			t1 = space();
    			a1 = element("a");
    			i = element("i");
    			i.textContent = "menu";
    			t3 = space();
    			if_block.c();
    			attr_dev(a0, "href", "#!");
    			attr_dev(a0, "class", "brand-logo left");
    			add_location(a0, file$2, 9, 6, 255);
    			attr_dev(i, "class", "material-icons");
    			add_location(i, file$2, 15, 8, 453);
    			attr_dev(a1, "href", a1_href_value = null);
    			attr_dev(a1, "data-target", "mobile-demo");
    			attr_dev(a1, "class", "sidenav-trigger right");
    			set_style(a1, "cursor", "pointer");
    			add_location(a1, file$2, 10, 6, 311);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$2, 8, 4, 224);
    			attr_dev(div1, "class", "nav-wrapper cyan darken-4");
    			add_location(div1, file$2, 7, 2, 179);
    			add_location(nav, file$2, 6, 0, 170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(a1, i);
    			append_dev(div0, t3);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $login;
    	validate_store(login, "login");
    	component_subscribe($$self, login, $$value => $$invalidate(0, $login = $$value));

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$login" in $$props) login.set($login = $$props.$login);
    	};

    	return [$login];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\CreateUser.svelte generated by Svelte v3.18.0 */
    const file$3 = "src\\CreateUser.svelte";

    function create_fragment$4(ctx) {
    	let h3;
    	let t1;
    	let div7;
    	let div6;
    	let div5;
    	let div3;
    	let div0;
    	let input0;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let label1;
    	let t7;
    	let div2;
    	let input2;
    	let t8;
    	let label2;
    	let t10;
    	let div4;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "New User";
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "Name";
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Email";
    			t7 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t8 = space();
    			label2 = element("label");
    			label2.textContent = "Password";
    			t10 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "Create";
    			attr_dev(h3, "class", "center cyan-text text-darken-4");
    			set_style(h3, "font-weight", "300");
    			add_location(h3, file$3, 6, 0, 90);
    			attr_dev(input0, "id", "name");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$3, 14, 10, 395);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$3, 15, 10, 465);
    			attr_dev(div0, "class", "input-field col s10 offset-s1");
    			add_location(div0, file$3, 13, 8, 340);
    			attr_dev(input1, "id", "email");
    			attr_dev(input1, "class", "validate");
    			attr_dev(input1, "type", "email");
    			add_location(input1, file$3, 18, 10, 576);
    			attr_dev(label1, "for", "email");
    			add_location(label1, file$3, 23, 10, 718);
    			attr_dev(div1, "class", "input-field col s10 offset-s1");
    			add_location(div1, file$3, 17, 8, 521);
    			attr_dev(input2, "id", "password");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file$3, 26, 10, 831);
    			attr_dev(label2, "for", "password");
    			add_location(label2, file$3, 27, 10, 909);
    			attr_dev(div2, "class", "input-field col s10 offset-s1");
    			add_location(div2, file$3, 25, 8, 776);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$3, 12, 6, 313);
    			attr_dev(button, "class", "blue-grey btn col s10 offset-s1 btn-large waves-effect");
    			add_location(button, file$3, 31, 8, 1012);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$3, 30, 6, 985);
    			attr_dev(div5, "class", "card-content");
    			add_location(div5, file$3, 11, 4, 279);
    			attr_dev(div6, "class", "card");
    			set_style(div6, "margin", "0 1rem");
    			add_location(div6, file$3, 10, 2, 231);
    			set_style(div7, "margin", "0 auto");
    			set_style(div7, "max-width", "600px");
    			add_location(div7, file$3, 9, 0, 180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*userBody*/ ctx[0].name);
    			append_dev(div0, t2);
    			append_dev(div0, label0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*userBody*/ ctx[0].email);
    			append_dev(div1, t5);
    			append_dev(div1, label1);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, input2);
    			set_input_value(input2, /*userBody*/ ctx[0].password);
    			append_dev(div2, t8);
    			append_dev(div2, label2);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, button);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[1]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[2]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[3]),
    				listen_dev(
    					button,
    					"click",
    					prevent_default(function () {
    						if (is_function(login.createUser(/*userBody*/ ctx[0]))) login.createUser(/*userBody*/ ctx[0]).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*userBody*/ 1 && input0.value !== /*userBody*/ ctx[0].name) {
    				set_input_value(input0, /*userBody*/ ctx[0].name);
    			}

    			if (dirty & /*userBody*/ 1 && input1.value !== /*userBody*/ ctx[0].email) {
    				set_input_value(input1, /*userBody*/ ctx[0].email);
    			}

    			if (dirty & /*userBody*/ 1 && input2.value !== /*userBody*/ ctx[0].password) {
    				set_input_value(input2, /*userBody*/ ctx[0].password);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div7);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let userBody = {};

    	function input0_input_handler() {
    		userBody.name = this.value;
    		$$invalidate(0, userBody);
    	}

    	function input1_input_handler() {
    		userBody.email = this.value;
    		$$invalidate(0, userBody);
    	}

    	function input2_input_handler() {
    		userBody.password = this.value;
    		$$invalidate(0, userBody);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("userBody" in $$props) $$invalidate(0, userBody = $$props.userBody);
    	};

    	return [userBody, input0_input_handler, input1_input_handler, input2_input_handler];
    }

    class CreateUser extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateUser",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Login.svelte generated by Svelte v3.18.0 */
    const file$4 = "src\\Login.svelte";

    function create_fragment$5(ctx) {
    	let h3;
    	let t1;
    	let div6;
    	let div5;
    	let div4;
    	let div2;
    	let div0;
    	let input0;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let label1;
    	let t7;
    	let div3;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Login";
    			t1 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "Email";
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t7 = space();
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Login";
    			attr_dev(h3, "class", "center cyan-text text-darken-4");
    			set_style(h3, "font-weight", "300");
    			add_location(h3, file$4, 21, 0, 455);
    			attr_dev(input0, "id", "email");
    			attr_dev(input0, "class", "validate svelte-19iczyu");
    			attr_dev(input0, "type", "email");
    			add_location(input0, file$4, 27, 10, 751);
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$4, 32, 10, 889);
    			attr_dev(div0, "class", "input-field col s10 offset-s1");
    			add_location(div0, file$4, 26, 8, 696);
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "validate svelte-19iczyu");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$4, 35, 10, 1002);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$4, 40, 10, 1145);
    			attr_dev(div1, "class", "input-field col s10 offset-s1");
    			add_location(div1, file$4, 34, 8, 947);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$4, 25, 6, 669);
    			attr_dev(button, "class", "blue-grey btn col s10 offset-s1 btn-large waves-effect");
    			add_location(button, file$4, 45, 8, 1250);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$4, 44, 6, 1223);
    			attr_dev(div4, "class", "card-content");
    			add_location(div4, file$4, 24, 4, 635);
    			attr_dev(div5, "class", "card");
    			set_style(div5, "margin", "0 1rem");
    			add_location(div5, file$4, 23, 2, 587);
    			set_style(div6, "margin", "0 auto");
    			set_style(div6, "max-width", "600px");
    			add_location(div6, file$4, 22, 0, 536);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*body*/ ctx[0].email);
    			append_dev(div0, t2);
    			append_dev(div0, label0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*body*/ ctx[0].password);
    			append_dev(div1, t5);
    			append_dev(div1, label1);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, button);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[1]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[2]),
    				listen_dev(
    					button,
    					"click",
    					prevent_default(function () {
    						if (is_function(login.login(/*body*/ ctx[0]))) login.login(/*body*/ ctx[0]).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*body*/ 1 && input0.value !== /*body*/ ctx[0].email) {
    				set_input_value(input0, /*body*/ ctx[0].email);
    			}

    			if (dirty & /*body*/ 1 && input1.value !== /*body*/ ctx[0].password) {
    				set_input_value(input1, /*body*/ ctx[0].password);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div6);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const body = { email: "", password: "" };

    	function input0_input_handler() {
    		body.email = this.value;
    		$$invalidate(0, body);
    	}

    	function input1_input_handler() {
    		body.password = this.value;
    		$$invalidate(0, body);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [body, input0_input_handler, input1_input_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\ProjectCards.svelte generated by Svelte v3.18.0 */
    const file$5 = "src\\ProjectCards.svelte";

    function create_fragment$6(ctx) {
    	let div6;
    	let div5;
    	let div2;
    	let span0;
    	let t0_value = /*project*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let t3_value = /*project*/ ctx[1].bugsCount + "";
    	let t3;
    	let t4;
    	let p0;
    	let t5_value = /*project*/ ctx[1].description + "";
    	let t5;
    	let t6;
    	let div1;
    	let a0;
    	let a0_href_value;
    	let t8;
    	let a1;
    	let i0;
    	let a1_href_value;
    	let t10;
    	let div4;
    	let span1;
    	let t11_value = /*project*/ ctx[1].name + "";
    	let t11;
    	let t12;
    	let i1;
    	let t14;
    	let p1;
    	let t15;

    	let t16_value = new Date(Date.parse(/*project*/ ctx[1].createdAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t16;
    	let t17;
    	let p2;
    	let t18;

    	let t19_value = new Date(Date.parse(/*project*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t19;
    	let t20;
    	let div3;
    	let button0;
    	let t22;
    	let button1;
    	let t23;
    	let button1_href_value;
    	let t24;
    	let div12;
    	let div11;
    	let h4;
    	let t26;
    	let div10;
    	let div7;
    	let input;
    	let t27;
    	let div8;
    	let textarea;
    	let t28;
    	let div9;
    	let button2;
    	let div12_id_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			t2 = text("Bugs: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p0 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Go To Project";
    			t8 = space();
    			a1 = element("a");
    			i0 = element("i");
    			i0.textContent = "more_vert";
    			t10 = space();
    			div4 = element("div");
    			span1 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			i1 = element("i");
    			i1.textContent = "close";
    			t14 = space();
    			p1 = element("p");
    			t15 = text("Created: ");
    			t16 = text(t16_value);
    			t17 = space();
    			p2 = element("p");
    			t18 = text("Last Updated: ");
    			t19 = text(t19_value);
    			t20 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "delete";
    			t22 = space();
    			button1 = element("button");
    			t23 = text("edit");
    			t24 = space();
    			div12 = element("div");
    			div11 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Edit Project";
    			t26 = space();
    			div10 = element("div");
    			div7 = element("div");
    			input = element("input");
    			t27 = space();
    			div8 = element("div");
    			textarea = element("textarea");
    			t28 = space();
    			div9 = element("div");
    			button2 = element("button");
    			button2.textContent = "Submit";
    			attr_dev(span0, "class", "card-title center");
    			add_location(span0, file$5, 48, 6, 1142);
    			attr_dev(div0, "class", "blue-grey lighten-4");
    			set_style(div0, "padding", ".5rem");
    			add_location(div0, file$5, 49, 6, 1203);
    			set_style(p0, "padding-top", "0.5rem");
    			add_location(p0, file$5, 52, 6, 1316);
    			attr_dev(a0, "href", a0_href_value = null);
    			attr_dev(a0, "class", "cyan-text text-darken-4");
    			set_style(a0, "margin-right", "0");
    			set_style(a0, "cursor", "pointer");
    			add_location(a0, file$5, 54, 8, 1430);
    			attr_dev(i0, "class", "material-icons right activator cyan-text text-darken-4 svelte-bobyl3");
    			set_style(i0, "cursor", "pointer");
    			add_location(i0, file$5, 62, 10, 1675);
    			attr_dev(a1, "href", a1_href_value = null);
    			add_location(a1, file$5, 61, 8, 1648);
    			attr_dev(div1, "class", "card-action grey lighten-5");
    			add_location(div1, file$5, 53, 6, 1380);
    			attr_dev(div2, "class", "card-content");
    			add_location(div2, file$5, 47, 4, 1108);
    			attr_dev(i1, "class", "material-icons right svelte-bobyl3");
    			add_location(i1, file$5, 73, 8, 1993);
    			attr_dev(span1, "class", "card-title grey-text text-darken-4");
    			add_location(span1, file$5, 71, 6, 1910);
    			add_location(p1, file$5, 75, 6, 2057);
    			add_location(p2, file$5, 88, 6, 2391);
    			attr_dev(button0, "class", "btn red");
    			add_location(button0, file$5, 102, 8, 2765);
    			attr_dev(button1, "class", "btn blue right modal-trigger");
    			attr_dev(button1, "href", button1_href_value = `#editProjectModal-${/*index*/ ctx[0]}`);
    			add_location(button1, file$5, 105, 8, 2876);
    			attr_dev(div3, "class", "card-action");
    			add_location(div3, file$5, 101, 6, 2730);
    			attr_dev(div4, "class", "card-reveal");
    			add_location(div4, file$5, 70, 4, 1877);
    			attr_dev(div5, "class", "card hoverable small card");
    			add_location(div5, file$5, 46, 2, 1063);
    			attr_dev(div6, "class", "col s12 m6 l4 xl3");
    			add_location(div6, file$5, 45, 0, 1028);
    			attr_dev(h4, "class", "cyan-text text-darken-4 center");
    			set_style(h4, "font-weight", "300");
    			add_location(h4, file$5, 120, 4, 3201);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "name");
    			add_location(input, file$5, 125, 8, 3385);
    			attr_dev(div7, "class", "input-field col s10 offset-s1");
    			add_location(div7, file$5, 124, 6, 3332);
    			attr_dev(textarea, "class", "materialize-textarea");
    			attr_dev(textarea, "placeholder", "description");
    			add_location(textarea, file$5, 128, 8, 3532);
    			attr_dev(div8, "class", "input-field col s10 offset-s1");
    			add_location(div8, file$5, 127, 6, 3479);
    			attr_dev(button2, "class", "modal-close waves-effect waves-green btn btn-large blue-grey\r\n          col s8 offset-s2");
    			add_location(button2, file$5, 134, 8, 3708);
    			add_location(div9, file$5, 133, 6, 3693);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$5, 123, 4, 3307);
    			attr_dev(div11, "class", "modal-content");
    			add_location(div11, file$5, 119, 2, 3168);
    			attr_dev(div12, "id", div12_id_value = `editProjectModal-${/*index*/ ctx[0]}`);
    			attr_dev(div12, "class", "modal grey lighten-4");
    			set_style(div12, "max-width", "640px");
    			add_location(div12, file$5, 115, 0, 3062);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, span0);
    			append_dev(span0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, p0);
    			append_dev(p0, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t8);
    			append_dev(div1, a1);
    			append_dev(a1, i0);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, span1);
    			append_dev(span1, t11);
    			append_dev(span1, t12);
    			append_dev(span1, i1);
    			append_dev(div4, t14);
    			append_dev(div4, p1);
    			append_dev(p1, t15);
    			append_dev(p1, t16);
    			append_dev(div4, t17);
    			append_dev(div4, p2);
    			append_dev(p2, t18);
    			append_dev(p2, t19);
    			append_dev(div4, t20);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t22);
    			append_dev(div3, button1);
    			append_dev(button1, t23);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div11);
    			append_dev(div11, h4);
    			append_dev(div11, t26);
    			append_dev(div11, div10);
    			append_dev(div10, div7);
    			append_dev(div7, input);
    			set_input_value(input, /*editedProject*/ ctx[2].name);
    			append_dev(div10, t27);
    			append_dev(div10, div8);
    			append_dev(div8, textarea);
    			set_input_value(textarea, /*editedProject*/ ctx[2].description);
    			append_dev(div10, t28);
    			append_dev(div10, div9);
    			append_dev(div9, button2);

    			dispose = [
    				listen_dev(a0, "click", prevent_default(/*setProject*/ ctx[3]), false, true, false),
    				listen_dev(button0, "click", prevent_default(/*deleteProject*/ ctx[4]), false, true, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[6]),
    				listen_dev(
    					button2,
    					"click",
    					prevent_default(function () {
    						if (is_function(projectsData.editProject(/*project*/ ctx[1], /*index*/ ctx[0]))) projectsData.editProject(/*project*/ ctx[1], /*index*/ ctx[0]).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*project*/ 2 && t0_value !== (t0_value = /*project*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*project*/ 2 && t3_value !== (t3_value = /*project*/ ctx[1].bugsCount + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*project*/ 2 && t5_value !== (t5_value = /*project*/ ctx[1].description + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*project*/ 2 && t11_value !== (t11_value = /*project*/ ctx[1].name + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*project*/ 2 && t16_value !== (t16_value = new Date(Date.parse(/*project*/ ctx[1].createdAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*project*/ 2 && t19_value !== (t19_value = new Date(Date.parse(/*project*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t19, t19_value);

    			if (dirty & /*index*/ 1 && button1_href_value !== (button1_href_value = `#editProjectModal-${/*index*/ ctx[0]}`)) {
    				attr_dev(button1, "href", button1_href_value);
    			}

    			if (dirty & /*editedProject*/ 4 && input.value !== /*editedProject*/ ctx[2].name) {
    				set_input_value(input, /*editedProject*/ ctx[2].name);
    			}

    			if (dirty & /*editedProject*/ 4) {
    				set_input_value(textarea, /*editedProject*/ ctx[2].description);
    			}

    			if (dirty & /*index*/ 1 && div12_id_value !== (div12_id_value = `editProjectModal-${/*index*/ ctx[0]}`)) {
    				attr_dev(div12, "id", div12_id_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(div12);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { index } = $$props;
    	let { project } = $$props;
    	let editedProject = project;

    	const setProject = async () => {
    		const res = await projectsData.setProject(project._id);

    		if (res.success) {
    			push("/bugs");
    		} else {
    			M.toast({ html: `${res.error}`, classes: "red" });
    		}
    	};

    	const deleteProject = async () => {
    		const conf = confirm("Are you sure you want to delete this project? All of the bugs in this project will be permanently deleted");
    		if (!conf) return;
    		await projectsData.deleteProject(project._id, index);
    	};

    	afterUpdate(() => {
    		$$invalidate(2, editedProject = project);
    	});

    	onMount(() => {
    		const modalElems = document.querySelectorAll(".modal");
    		const modalInstances = M.Modal.init(modalElems);
    	});

    	const writable_props = ["index", "project"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProjectCards> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		editedProject.name = this.value;
    		$$invalidate(2, editedProject);
    	}

    	function textarea_input_handler() {
    		editedProject.description = this.value;
    		$$invalidate(2, editedProject);
    	}

    	$$self.$set = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("project" in $$props) $$invalidate(1, project = $$props.project);
    	};

    	$$self.$capture_state = () => {
    		return { index, project, editedProject };
    	};

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("project" in $$props) $$invalidate(1, project = $$props.project);
    		if ("editedProject" in $$props) $$invalidate(2, editedProject = $$props.editedProject);
    	};

    	return [
    		index,
    		project,
    		editedProject,
    		setProject,
    		deleteProject,
    		input_input_handler,
    		textarea_input_handler
    	];
    }

    class ProjectCards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { index: 0, project: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectCards",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*index*/ ctx[0] === undefined && !("index" in props)) {
    			console.warn("<ProjectCards> was created without expected prop 'index'");
    		}

    		if (/*project*/ ctx[1] === undefined && !("project" in props)) {
    			console.warn("<ProjectCards> was created without expected prop 'project'");
    		}
    	}

    	get index() {
    		throw new Error("<ProjectCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<ProjectCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get project() {
    		throw new Error("<ProjectCards>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<ProjectCards>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Projects.svelte generated by Svelte v3.18.0 */
    const file$6 = "src\\Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (20:8) {#each $projectsData as project, i}
    function create_each_block(ctx) {
    	let current;

    	const projectcards = new ProjectCards({
    			props: {
    				index: /*i*/ ctx[3],
    				project: /*project*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(projectcards.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(projectcards, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const projectcards_changes = {};
    			if (dirty & /*$projectsData*/ 1) projectcards_changes.project = /*project*/ ctx[1];
    			projectcards.$set(projectcards_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projectcards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projectcards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(projectcards, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:8) {#each $projectsData as project, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div0;
    	let h3;
    	let t1;
    	let div3;
    	let div2;
    	let div1;
    	let current;
    	let each_value = /*$projectsData*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Your Projects";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h3, "class", "cyan-text text-darken-4");
    			set_style(h3, "font-weight", "300");
    			add_location(h3, file$6, 12, 4, 390);
    			attr_dev(div0, "class", "center");
    			add_location(div0, file$6, 11, 2, 364);
    			attr_dev(div1, "id", "projects-panel");
    			attr_dev(div1, "class", "card-panel grey lighten-1 row");
    			add_location(div1, file$6, 18, 6, 560);
    			attr_dev(div2, "class", "col s10 offset-s1");
    			add_location(div2, file$6, 17, 4, 521);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$6, 16, 2, 498);
    			set_style(div4, "margin", "0 auto");
    			set_style(div4, "max-width", "1280px");
    			add_location(div4, file$6, 10, 0, 312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, h3);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$projectsData*/ 1) {
    				each_value = /*$projectsData*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $projectsData;
    	validate_store(projectsData, "projectsData");
    	component_subscribe($$self, projectsData, $$value => $$invalidate(0, $projectsData = $$value));
    	onMount(() => projectsData.getProjects());

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$projectsData" in $$props) projectsData.set($projectsData = $$props.$projectsData);
    	};

    	return [$projectsData];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* node_modules\svelte-media-query\src\MediaQuery.svelte generated by Svelte v3.18.0 */
    const get_default_slot_changes = dirty => ({ matches: dirty & /*matches*/ 1 });
    const get_default_slot_context = ctx => ({ matches: /*matches*/ ctx[0] });

    function create_fragment$8(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, matches*/ 129) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { query } = $$props;
    	let mql;
    	let mqlListener;
    	let wasMounted = false;
    	let matches = false;

    	onMount(() => {
    		$$invalidate(4, wasMounted = true);

    		return () => {
    			removeActiveListener();
    		};
    	});

    	function addNewListener(query) {
    		mql = window.matchMedia(query);
    		mqlListener = v => $$invalidate(0, matches = v.matches);
    		mql.addListener(mqlListener);
    		$$invalidate(0, matches = mql.matches);
    	}

    	function removeActiveListener() {
    		if (mql && mqlListener) {
    			mql.removeListener(mqlListener);
    		}
    	}

    	const writable_props = ["query"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MediaQuery> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			query,
    			mql,
    			mqlListener,
    			wasMounted,
    			matches
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("query" in $$props) $$invalidate(1, query = $$props.query);
    		if ("mql" in $$props) mql = $$props.mql;
    		if ("mqlListener" in $$props) mqlListener = $$props.mqlListener;
    		if ("wasMounted" in $$props) $$invalidate(4, wasMounted = $$props.wasMounted);
    		if ("matches" in $$props) $$invalidate(0, matches = $$props.matches);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wasMounted, query*/ 18) {
    			 {
    				if (wasMounted) {
    					removeActiveListener();
    					addNewListener(query);
    				}
    			}
    		}
    	};

    	return [
    		matches,
    		query,
    		mql,
    		mqlListener,
    		wasMounted,
    		addNewListener,
    		removeActiveListener,
    		$$scope,
    		$$slots
    	];
    }

    class MediaQuery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { query: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MediaQuery",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*query*/ ctx[1] === undefined && !("query" in props)) {
    			console.warn("<MediaQuery> was created without expected prop 'query'");
    		}
    	}

    	get query() {
    		throw new Error("<MediaQuery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<MediaQuery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src\BugMobile.svelte generated by Svelte v3.18.0 */
    const file$7 = "src\\BugMobile.svelte";

    // (93:38) 
    function create_if_block_8(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "green");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 94, 8, 2401);
    			attr_dev(div1, "class", "col s3 center");
    			add_location(div1, file$7, 93, 6, 2364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(93:38) ",
    		ctx
    	});

    	return block;
    }

    // (87:44) 
    function create_if_block_7(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "orange");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 88, 8, 2201);
    			attr_dev(div1, "class", "col s3 center");
    			add_location(div1, file$7, 87, 6, 2164);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(87:44) ",
    		ctx
    	});

    	return block;
    }

    // (81:43) 
    function create_if_block_6(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "blue");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 82, 8, 1997);
    			attr_dev(div1, "class", "col s3 center");
    			add_location(div1, file$7, 81, 6, 1960);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(81:43) ",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if bug.status === 'Open'}
    function create_if_block_5(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "red");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 76, 8, 1795);
    			attr_dev(div1, "class", "col s3 center");
    			add_location(div1, file$7, 75, 6, 1758);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(75:4) {#if bug.status === 'Open'}",
    		ctx
    	});

    	return block;
    }

    // (112:2) {#if show === i}
    function create_if_block$2(ctx) {
    	let div24;
    	let div20;
    	let div9;
    	let div8;
    	let div7;
    	let span0;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let label1;
    	let t7;
    	let span1;
    	let t9;
    	let div6;
    	let div2;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t15;
    	let div3;
    	let select1;
    	let option5;
    	let option6;
    	let option7;
    	let t19;
    	let div4;
    	let select2;
    	let option8;
    	let option9;
    	let option10;
    	let t23;
    	let div5;
    	let textarea;
    	let t24;
    	let label2;
    	let t26;
    	let button0;
    	let t28;
    	let div19;
    	let div18;
    	let div16;
    	let div15;
    	let div10;
    	let h60;
    	let t30;
    	let p0;
    	let t31_value = /*bug*/ ctx[1].description + "";
    	let t31;
    	let t32;
    	let div11;
    	let h61;
    	let t34;
    	let p1;
    	let t35_value = /*bug*/ ctx[1].reporter.name + "";
    	let t35;
    	let t36;
    	let div12;
    	let h62;
    	let t38;
    	let p2;
    	let t39_value = /*bug*/ ctx[1].fixer.name + "";
    	let t39;
    	let t40;
    	let t41;
    	let t42;
    	let div13;
    	let h63;
    	let t44;
    	let p3;

    	let t45_value = new Date(Date.parse(/*bug*/ ctx[1].createdAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t45;
    	let t46;
    	let div14;
    	let h64;
    	let t48;
    	let p4;

    	let t49_value = new Date(Date.parse(/*bug*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t49;
    	let t50;
    	let div17;
    	let button1;
    	let t52;
    	let div23;
    	let div22;
    	let div21;
    	let div22_id_value;
    	let div24_transition;
    	let current;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*bug*/ ctx[1].severity === "Minor") return create_if_block_3$1;
    		if (/*bug*/ ctx[1].severity === "Major") return create_if_block_4;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*bug*/ ctx[1].reproduceability === "Always") return create_if_block_1$1;
    		if (/*bug*/ ctx[1].reproduceability === "Intermitent") return create_if_block_2$1;
    	}

    	let current_block_type_1 = select_block_type_2(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div24 = element("div");
    			div20 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			span0 = element("span");
    			span0.textContent = "Update";
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "name";
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "fixer";
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "must be a users email";
    			t9 = space();
    			div6 = element("div");
    			div2 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "status";
    			option1 = element("option");
    			option1.textContent = "Open";
    			option2 = element("option");
    			option2.textContent = "In Progress";
    			option3 = element("option");
    			option3.textContent = "To Be Tested";
    			option4 = element("option");
    			option4.textContent = "Closed";
    			t15 = space();
    			div3 = element("div");
    			select1 = element("select");
    			option5 = element("option");
    			option5.textContent = "severity";
    			option6 = element("option");
    			option6.textContent = "Minor";
    			option7 = element("option");
    			option7.textContent = "Major";
    			t19 = space();
    			div4 = element("div");
    			select2 = element("select");
    			option8 = element("option");
    			option8.textContent = "reproduceability";
    			option9 = element("option");
    			option9.textContent = "Always";
    			option10 = element("option");
    			option10.textContent = "Intermitent";
    			t23 = space();
    			div5 = element("div");
    			textarea = element("textarea");
    			t24 = space();
    			label2 = element("label");
    			label2.textContent = "description";
    			t26 = space();
    			button0 = element("button");
    			button0.textContent = "Update";
    			t28 = space();
    			div19 = element("div");
    			div18 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div10 = element("div");
    			h60 = element("h6");
    			h60.textContent = "Description:";
    			t30 = space();
    			p0 = element("p");
    			t31 = text(t31_value);
    			t32 = space();
    			div11 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Reporter:";
    			t34 = space();
    			p1 = element("p");
    			t35 = text(t35_value);
    			t36 = space();
    			div12 = element("div");
    			h62 = element("h6");
    			h62.textContent = "Fixer:";
    			t38 = space();
    			p2 = element("p");
    			t39 = text(t39_value);
    			t40 = space();
    			if (if_block0) if_block0.c();
    			t41 = space();
    			if (if_block1) if_block1.c();
    			t42 = space();
    			div13 = element("div");
    			h63 = element("h6");
    			h63.textContent = "Created At:";
    			t44 = space();
    			p3 = element("p");
    			t45 = text(t45_value);
    			t46 = space();
    			div14 = element("div");
    			h64 = element("h6");
    			h64.textContent = "Last Updated:";
    			t48 = space();
    			p4 = element("p");
    			t49 = text(t49_value);
    			t50 = space();
    			div17 = element("div");
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t52 = space();
    			div23 = element("div");
    			div22 = element("div");
    			div21 = element("div");
    			attr_dev(span0, "class", "card-title");
    			add_location(span0, file$7, 117, 14, 3112);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$7, 119, 16, 3231);
    			add_location(label0, file$7, 120, 16, 3297);
    			attr_dev(div0, "class", "input-field");
    			set_style(div0, "height", "5rem");
    			add_location(div0, file$7, 118, 14, 3166);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$7, 123, 16, 3397);
    			add_location(label1, file$7, 124, 16, 3464);
    			attr_dev(span1, "class", "helper-text");
    			add_location(span1, file$7, 125, 16, 3502);
    			attr_dev(div1, "class", "input-field");
    			add_location(div1, file$7, 122, 14, 3354);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.disabled = true;
    			option0.selected = true;
    			add_location(option0, file$7, 130, 20, 3728);
    			option1.__value = "Open";
    			option1.value = option1.__value;
    			add_location(option1, file$7, 131, 20, 3800);
    			option2.__value = "In Progress";
    			option2.value = option2.__value;
    			add_location(option2, file$7, 132, 20, 3856);
    			option3.__value = "To Be Tested";
    			option3.value = option3.__value;
    			add_location(option3, file$7, 133, 20, 3926);
    			option4.__value = "Closed";
    			option4.value = option4.__value;
    			add_location(option4, file$7, 134, 20, 3998);
    			if (/*editBody*/ ctx[3].status === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[9].call(select0));
    			add_location(select0, file$7, 129, 18, 3669);
    			attr_dev(div2, "class", "col s6");
    			add_location(div2, file$7, 128, 16, 3629);
    			option5.__value = "";
    			option5.value = option5.__value;
    			option5.disabled = true;
    			option5.selected = true;
    			add_location(option5, file$7, 139, 20, 4218);
    			option6.__value = "Minor";
    			option6.value = option6.__value;
    			add_location(option6, file$7, 140, 20, 4292);
    			option7.__value = "Major";
    			option7.value = option7.__value;
    			add_location(option7, file$7, 141, 20, 4350);
    			if (/*editBody*/ ctx[3].severity === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[10].call(select1));
    			add_location(select1, file$7, 138, 18, 4157);
    			attr_dev(div3, "class", "col s5 offset-s1");
    			add_location(div3, file$7, 137, 16, 4107);
    			option8.__value = "";
    			option8.value = option8.__value;
    			option8.disabled = true;
    			option8.selected = true;
    			add_location(option8, file$7, 146, 20, 4567);
    			option9.__value = "Always";
    			option9.value = option9.__value;
    			add_location(option9, file$7, 147, 20, 4649);
    			option10.__value = "Intermitent";
    			option10.value = option10.__value;
    			add_location(option10, file$7, 148, 20, 4709);
    			if (/*editBody*/ ctx[3].reproduceability === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[11].call(select2));
    			add_location(select2, file$7, 145, 18, 4498);
    			attr_dev(div4, "class", "col s12");
    			add_location(div4, file$7, 144, 16, 4457);
    			attr_dev(textarea, "class", "materialize-textarea");
    			add_location(textarea, file$7, 152, 18, 4881);
    			add_location(label2, file$7, 155, 18, 5018);
    			attr_dev(div5, "class", "input-field col s12");
    			add_location(div5, file$7, 151, 16, 4828);
    			attr_dev(button0, "class", "col s12 btn blue");
    			add_location(button0, file$7, 157, 16, 5086);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$7, 127, 14, 3594);
    			attr_dev(div7, "class", "card-content");
    			add_location(div7, file$7, 116, 12, 3070);
    			attr_dev(div8, "class", "card");
    			add_location(div8, file$7, 115, 10, 3038);
    			attr_dev(div9, "class", "col s12 l6");
    			add_location(div9, file$7, 114, 8, 3002);
    			add_location(h60, file$7, 171, 18, 5516);
    			add_location(p0, file$7, 172, 18, 5557);
    			attr_dev(div10, "class", "col s12");
    			add_location(div10, file$7, 170, 16, 5475);
    			add_location(h61, file$7, 175, 18, 5663);
    			add_location(p1, file$7, 176, 18, 5701);
    			attr_dev(div11, "class", "col s6");
    			add_location(div11, file$7, 174, 16, 5623);
    			add_location(h62, file$7, 179, 18, 5809);
    			add_location(p2, file$7, 180, 18, 5844);
    			attr_dev(div12, "class", "col s6");
    			add_location(div12, file$7, 178, 16, 5769);
    			add_location(h63, file$7, 221, 18, 7498);
    			add_location(p3, file$7, 222, 18, 7538);
    			attr_dev(div13, "class", "col s12");
    			add_location(div13, file$7, 220, 16, 7457);
    			add_location(h64, file$7, 237, 18, 8078);
    			add_location(p4, file$7, 238, 18, 8120);
    			attr_dev(div14, "class", "col s12");
    			add_location(div14, file$7, 236, 16, 8037);
    			attr_dev(div15, "class", "row");
    			add_location(div15, file$7, 169, 14, 5440);
    			attr_dev(div16, "class", "card-content");
    			add_location(div16, file$7, 168, 12, 5398);
    			attr_dev(button1, "class", "btn red");
    			add_location(button1, file$7, 255, 14, 8698);
    			attr_dev(div17, "class", "card-action");
    			add_location(div17, file$7, 254, 12, 8657);
    			attr_dev(div18, "class", "card");
    			add_location(div18, file$7, 167, 10, 5366);
    			attr_dev(div19, "class", "col s12 l6");
    			add_location(div19, file$7, 166, 8, 5330);
    			attr_dev(div20, "class", "row");
    			set_style(div20, "margin", "0");
    			add_location(div20, file$7, 113, 6, 2956);
    			attr_dev(div21, "class", "indeterminate");
    			add_location(div21, file$7, 264, 10, 8998);
    			attr_dev(div22, "id", div22_id_value = "progress-" + /*i*/ ctx[2]);
    			attr_dev(div22, "class", "progress hide svelte-166ul66");
    			set_style(div22, "margin", "0");
    			add_location(div22, file$7, 263, 8, 8922);
    			set_style(div23, "height", "0.5rem");
    			add_location(div23, file$7, 262, 6, 8883);
    			attr_dev(div24, "class", "blue-grey lighten-5");
    			add_location(div24, file$7, 112, 4, 2898);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div20);
    			append_dev(div20, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span0);
    			append_dev(div7, t1);
    			append_dev(div7, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*editBody*/ ctx[3].name);
    			append_dev(div0, t2);
    			append_dev(div0, label0);
    			append_dev(div7, t4);
    			append_dev(div7, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*editBody*/ ctx[3].fixer);
    			append_dev(div1, t5);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, span1);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, div2);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(select0, option4);
    			select_option(select0, /*editBody*/ ctx[3].status);
    			append_dev(div6, t15);
    			append_dev(div6, div3);
    			append_dev(div3, select1);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			select_option(select1, /*editBody*/ ctx[3].severity);
    			append_dev(div6, t19);
    			append_dev(div6, div4);
    			append_dev(div4, select2);
    			append_dev(select2, option8);
    			append_dev(select2, option9);
    			append_dev(select2, option10);
    			select_option(select2, /*editBody*/ ctx[3].reproduceability);
    			append_dev(div6, t23);
    			append_dev(div6, div5);
    			append_dev(div5, textarea);
    			set_input_value(textarea, /*editBody*/ ctx[3].description);
    			append_dev(div5, t24);
    			append_dev(div5, label2);
    			append_dev(div6, t26);
    			append_dev(div6, button0);
    			append_dev(div20, t28);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div10);
    			append_dev(div10, h60);
    			append_dev(div10, t30);
    			append_dev(div10, p0);
    			append_dev(p0, t31);
    			append_dev(div15, t32);
    			append_dev(div15, div11);
    			append_dev(div11, h61);
    			append_dev(div11, t34);
    			append_dev(div11, p1);
    			append_dev(p1, t35);
    			append_dev(div15, t36);
    			append_dev(div15, div12);
    			append_dev(div12, h62);
    			append_dev(div12, t38);
    			append_dev(div12, p2);
    			append_dev(p2, t39);
    			append_dev(div15, t40);
    			if (if_block0) if_block0.m(div15, null);
    			append_dev(div15, t41);
    			if (if_block1) if_block1.m(div15, null);
    			append_dev(div15, t42);
    			append_dev(div15, div13);
    			append_dev(div13, h63);
    			append_dev(div13, t44);
    			append_dev(div13, p3);
    			append_dev(p3, t45);
    			append_dev(div15, t46);
    			append_dev(div15, div14);
    			append_dev(div14, h64);
    			append_dev(div14, t48);
    			append_dev(div14, p4);
    			append_dev(p4, t49);
    			append_dev(div18, t50);
    			append_dev(div18, div17);
    			append_dev(div17, button1);
    			append_dev(div24, t52);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[9]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[10]),
    				listen_dev(select2, "change", /*select2_change_handler*/ ctx[11]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    				listen_dev(button0, "click", prevent_default(/*editBug*/ ctx[4]), false, true, false),
    				listen_dev(button1, "click", prevent_default(/*deleteBug*/ ctx[5]), false, true, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*editBody*/ 8 && input0.value !== /*editBody*/ ctx[3].name) {
    				set_input_value(input0, /*editBody*/ ctx[3].name);
    			}

    			if (dirty & /*editBody*/ 8 && input1.value !== /*editBody*/ ctx[3].fixer) {
    				set_input_value(input1, /*editBody*/ ctx[3].fixer);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select0, /*editBody*/ ctx[3].status);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select1, /*editBody*/ ctx[3].severity);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select2, /*editBody*/ ctx[3].reproduceability);
    			}

    			if (dirty & /*editBody*/ 8) {
    				set_input_value(textarea, /*editBody*/ ctx[3].description);
    			}

    			if ((!current || dirty & /*bug*/ 2) && t31_value !== (t31_value = /*bug*/ ctx[1].description + "")) set_data_dev(t31, t31_value);
    			if ((!current || dirty & /*bug*/ 2) && t35_value !== (t35_value = /*bug*/ ctx[1].reporter.name + "")) set_data_dev(t35, t35_value);
    			if ((!current || dirty & /*bug*/ 2) && t39_value !== (t39_value = /*bug*/ ctx[1].fixer.name + "")) set_data_dev(t39, t39_value);

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div15, t41);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div15, t42);
    				}
    			}

    			if ((!current || dirty & /*bug*/ 2) && t45_value !== (t45_value = new Date(Date.parse(/*bug*/ ctx[1].createdAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t45, t45_value);

    			if ((!current || dirty & /*bug*/ 2) && t49_value !== (t49_value = new Date(Date.parse(/*bug*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t49, t49_value);

    			if (!current || dirty & /*i*/ 4 && div22_id_value !== (div22_id_value = "progress-" + /*i*/ ctx[2])) {
    				attr_dev(div22, "id", div22_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div24_transition) div24_transition = create_bidirectional_transition(div24, slide, {}, true);
    				div24_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div24_transition) div24_transition = create_bidirectional_transition(div24, slide, {}, false);
    			div24_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div24);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) {
    				if_block1.d();
    			}

    			if (detaching && div24_transition) div24_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(112:2) {#if show === i}",
    		ctx
    	});

    	return block;
    }

    // (192:51) 
    function create_if_block_4(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let t2_value = /*bug*/ ctx[1].severity + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Severity:";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			add_location(h6, file$7, 193, 20, 6362);
    			attr_dev(div0, "class", "purple darken-3 center");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 194, 20, 6402);
    			attr_dev(div1, "class", "col s6");
    			add_location(div1, file$7, 192, 18, 6320);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t2_value !== (t2_value = /*bug*/ ctx[1].severity + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(192:51) ",
    		ctx
    	});

    	return block;
    }

    // (183:16) {#if bug.severity === 'Minor'}
    function create_if_block_3$1(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let t2_value = /*bug*/ ctx[1].severity + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Severity:";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			add_location(h6, file$7, 184, 20, 6001);
    			attr_dev(div0, "class", "purple center");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 185, 20, 6041);
    			attr_dev(div1, "class", "col s6");
    			add_location(div1, file$7, 183, 18, 5959);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t2_value !== (t2_value = /*bug*/ ctx[1].severity + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(183:16) {#if bug.severity === 'Minor'}",
    		ctx
    	});

    	return block;
    }

    // (211:65) 
    function create_if_block_2$1(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let t2_value = /*bug*/ ctx[1].reproduceability + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Reproduceability:";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			add_location(h6, file$7, 212, 20, 7156);
    			attr_dev(div0, "class", "cyan center");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 213, 20, 7204);
    			attr_dev(div1, "class", "col s6");
    			add_location(div1, file$7, 211, 18, 7114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t2_value !== (t2_value = /*bug*/ ctx[1].reproduceability + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(211:65) ",
    		ctx
    	});

    	return block;
    }

    // (202:16) {#if bug.reproduceability === 'Always'}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let h6;
    	let t1;
    	let div0;
    	let t2_value = /*bug*/ ctx[1].reproduceability + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h6 = element("h6");
    			h6.textContent = "Reproduceability";
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			add_location(h6, file$7, 203, 20, 6759);
    			attr_dev(div0, "class", "cyan darken-3 center");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$7, 204, 20, 6806);
    			attr_dev(div1, "class", "col s6");
    			add_location(div1, file$7, 202, 18, 6717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h6);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t2_value !== (t2_value = /*bug*/ ctx[1].reproduceability + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(202:16) {#if bug.reproduceability === 'Always'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let li;
    	let div3;
    	let div0;
    	let t0_value = /*bug*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*bug*/ ctx[1].fixer.name + "";
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let i_1;
    	let t6;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*bug*/ ctx[1].status === "Open") return create_if_block_5;
    		if (/*bug*/ ctx[1].status === "In Progress") return create_if_block_6;
    		if (/*bug*/ ctx[1].status === "To Be Tested") return create_if_block_7;
    		if (/*bug*/ ctx[1].status === "Closed") return create_if_block_8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*show*/ ctx[0] === /*i*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			div2 = element("div");
    			i_1 = element("i");
    			i_1.textContent = "more_vert";
    			t6 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "col s3 center");
    			add_location(div0, file$7, 72, 4, 1619);
    			attr_dev(div1, "class", "col s3 center");
    			add_location(div1, file$7, 73, 4, 1668);
    			attr_dev(i_1, "id", "more");
    			attr_dev(i_1, "class", "material-icons collapsible-header svelte-166ul66");
    			set_style(i_1, "padding", "0");
    			set_style(i_1, "border-bottom", "none");
    			set_style(i_1, "justify-content", "center");
    			set_style(i_1, "background", "transparent");
    			add_location(i_1, file$7, 100, 6, 2567);
    			attr_dev(div2, "class", "col s3 center");
    			add_location(div2, file$7, 99, 4, 2532);
    			attr_dev(div3, "class", "row valign-wrapper");
    			set_style(div3, "padding", "1rem 0");
    			set_style(div3, "border-bottom", "1px solid #ddd");
    			set_style(div3, "margin", "0");
    			set_style(div3, "background", "white");
    			add_location(div3, file$7, 68, 2, 1480);
    			add_location(li, file$7, 67, 0, 1472);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, i_1);
    			append_dev(li, t6);
    			if (if_block1) if_block1.m(li, null);
    			current = true;
    			dispose = listen_dev(i_1, "click", /*click_handler*/ ctx[6], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*bug*/ 2) && t0_value !== (t0_value = /*bug*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*bug*/ 2) && t2_value !== (t2_value = /*bug*/ ctx[1].fixer.name + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div3, t4);
    				}
    			}

    			if (/*show*/ ctx[0] === /*i*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(li, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { bug } = $$props;
    	let { i } = $$props;
    	let { show } = $$props;
    	let editBody = {};

    	const editBug = async e => {
    		const progress = document.getElementById(`progress-${i}`);
    		progress.classList.remove("hide");

    		for (let key in editBody) {
    			if (editBody[key] === "") delete editBody[key];
    		}

    		const res = await bugs.editBug(editBody, bug._id, i);

    		if (res === true) {
    			$$invalidate(0, show = null);
    		} else if (res.error === "Cannot read property '_id' of null") {
    			M.toast({
    				html: "'fixer' must be a users email",
    				classes: "red darken-2"
    			});
    		}

    		progress.classList.add("hide");
    	};

    	const deleteBug = async () => {
    		const conf = confirm("Are you sure you want to delete this bug?");
    		if (!conf) return;
    		const progress = document.getElementById(`progress-${i}`);
    		progress.classList.remove("hide");
    		const res = await bugs.deleteBug(bug._id, i);

    		if (res === true) {
    			$$invalidate(0, show = null);
    		} else {
    			M.toast({ html: res.error, classes: "red darken-2" });
    		}

    		progress.classList.add("hide");
    	};

    	const writable_props = ["bug", "i", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BugMobile> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => show === i
    	? $$invalidate(0, show = null)
    	: $$invalidate(0, show = i);

    	function input0_input_handler() {
    		editBody.name = this.value;
    		$$invalidate(3, editBody);
    	}

    	function input1_input_handler() {
    		editBody.fixer = this.value;
    		$$invalidate(3, editBody);
    	}

    	function select0_change_handler() {
    		editBody.status = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function select1_change_handler() {
    		editBody.severity = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function select2_change_handler() {
    		editBody.reproduceability = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function textarea_input_handler() {
    		editBody.description = this.value;
    		$$invalidate(3, editBody);
    	}

    	$$self.$set = $$props => {
    		if ("bug" in $$props) $$invalidate(1, bug = $$props.bug);
    		if ("i" in $$props) $$invalidate(2, i = $$props.i);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => {
    		return { bug, i, show, editBody };
    	};

    	$$self.$inject_state = $$props => {
    		if ("bug" in $$props) $$invalidate(1, bug = $$props.bug);
    		if ("i" in $$props) $$invalidate(2, i = $$props.i);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("editBody" in $$props) $$invalidate(3, editBody = $$props.editBody);
    	};

    	return [
    		show,
    		bug,
    		i,
    		editBody,
    		editBug,
    		deleteBug,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler,
    		textarea_input_handler
    	];
    }

    class BugMobile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { bug: 1, i: 2, show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BugMobile",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bug*/ ctx[1] === undefined && !("bug" in props)) {
    			console.warn("<BugMobile> was created without expected prop 'bug'");
    		}

    		if (/*i*/ ctx[2] === undefined && !("i" in props)) {
    			console.warn("<BugMobile> was created without expected prop 'i'");
    		}

    		if (/*show*/ ctx[0] === undefined && !("show" in props)) {
    			console.warn("<BugMobile> was created without expected prop 'show'");
    		}
    	}

    	get bug() {
    		throw new Error("<BugMobile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bug(value) {
    		throw new Error("<BugMobile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<BugMobile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<BugMobile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<BugMobile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<BugMobile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Bug.svelte generated by Svelte v3.18.0 */
    const file$8 = "src\\Bug.svelte";

    // (94:38) 
    function create_if_block_8$1(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "green");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 95, 8, 2557);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 94, 6, 2495);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(94:38) ",
    		ctx
    	});

    	return block;
    }

    // (88:44) 
    function create_if_block_7$1(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "orange");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 89, 8, 2332);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 88, 6, 2270);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(88:44) ",
    		ctx
    	});

    	return block;
    }

    // (82:43) 
    function create_if_block_6$1(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "blue");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 83, 8, 2103);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 82, 6, 2041);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(82:43) ",
    		ctx
    	});

    	return block;
    }

    // (76:4) {#if bug.status === 'Open'}
    function create_if_block_5$1(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].status + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "red");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 77, 8, 1876);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 76, 6, 1814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].status + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(76:4) {#if bug.status === 'Open'}",
    		ctx
    	});

    	return block;
    }

    // (107:39) 
    function create_if_block_4$1(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].severity + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "purple darken-3");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 108, 8, 3022);
    			attr_dev(div1, "class", "col s1 center");
    			set_style(div1, "padding", "0 0.75rem");
    			add_location(div1, file$8, 107, 6, 2957);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].severity + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(107:39) ",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#if bug.severity === 'Minor'}
    function create_if_block_3$2(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].severity + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "purple");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 102, 8, 2791);
    			attr_dev(div1, "class", "col s1 center");
    			set_style(div1, "padding", "0 0.75rem");
    			add_location(div1, file$8, 101, 6, 2726);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].severity + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(101:4) {#if bug.severity === 'Minor'}",
    		ctx
    	});

    	return block;
    }

    // (120:53) 
    function create_if_block_2$2(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].reproduceability + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "cyan");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 121, 8, 3531);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 120, 6, 3469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].reproduceability + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(120:53) ",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#if bug.reproduceability === 'Always'}
    function create_if_block_1$2(ctx) {
    	let div1;
    	let div0;
    	let t_value = /*bug*/ ctx[1].reproduceability + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "cyan darken-3");
    			set_style(div0, "color", "white");
    			set_style(div0, "border-radius", "5px");
    			add_location(div0, file$8, 115, 8, 3274);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0 2rem");
    			add_location(div1, file$8, 114, 6, 3212);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bug*/ 2 && t_value !== (t_value = /*bug*/ ctx[1].reproduceability + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(114:4) {#if bug.reproduceability === 'Always'}",
    		ctx
    	});

    	return block;
    }

    // (139:2) {#if show === i}
    function create_if_block$3(ctx) {
    	let div23;
    	let div19;
    	let div9;
    	let div8;
    	let div7;
    	let span0;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let label1;
    	let t7;
    	let span1;
    	let t9;
    	let div6;
    	let div2;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t15;
    	let div3;
    	let select1;
    	let option5;
    	let option6;
    	let option7;
    	let t19;
    	let div4;
    	let select2;
    	let option8;
    	let option9;
    	let option10;
    	let t23;
    	let div5;
    	let textarea;
    	let t24;
    	let label2;
    	let t26;
    	let button0;
    	let t28;
    	let div18;
    	let div17;
    	let div15;
    	let div14;
    	let div10;
    	let h60;
    	let t30;
    	let p0;
    	let t31_value = /*bug*/ ctx[1].description + "";
    	let t31;
    	let t32;
    	let div11;
    	let h61;
    	let t34;
    	let p1;
    	let t35_value = /*bug*/ ctx[1].reporter.name + "";
    	let t35;
    	let t36;
    	let div12;
    	let h62;
    	let t38;
    	let p2;

    	let t39_value = new Date(Date.parse(/*bug*/ ctx[1].createdAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t39;
    	let t40;
    	let div13;
    	let h63;
    	let t42;
    	let p3;

    	let t43_value = new Date(Date.parse(/*bug*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t43;
    	let t44;
    	let div16;
    	let button1;
    	let t46;
    	let div22;
    	let div21;
    	let div20;
    	let div21_id_value;
    	let div23_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div23 = element("div");
    			div19 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			span0 = element("span");
    			span0.textContent = "Update";
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "name";
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "fixer";
    			t7 = space();
    			span1 = element("span");
    			span1.textContent = "must be a users email";
    			t9 = space();
    			div6 = element("div");
    			div2 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "status";
    			option1 = element("option");
    			option1.textContent = "Open";
    			option2 = element("option");
    			option2.textContent = "In Progress";
    			option3 = element("option");
    			option3.textContent = "To Be Tested";
    			option4 = element("option");
    			option4.textContent = "Closed";
    			t15 = space();
    			div3 = element("div");
    			select1 = element("select");
    			option5 = element("option");
    			option5.textContent = "severity";
    			option6 = element("option");
    			option6.textContent = "Minor";
    			option7 = element("option");
    			option7.textContent = "Major";
    			t19 = space();
    			div4 = element("div");
    			select2 = element("select");
    			option8 = element("option");
    			option8.textContent = "reproduceability";
    			option9 = element("option");
    			option9.textContent = "Always";
    			option10 = element("option");
    			option10.textContent = "Intermitent";
    			t23 = space();
    			div5 = element("div");
    			textarea = element("textarea");
    			t24 = space();
    			label2 = element("label");
    			label2.textContent = "description";
    			t26 = space();
    			button0 = element("button");
    			button0.textContent = "Update";
    			t28 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div10 = element("div");
    			h60 = element("h6");
    			h60.textContent = "Description:";
    			t30 = space();
    			p0 = element("p");
    			t31 = text(t31_value);
    			t32 = space();
    			div11 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Reporter:";
    			t34 = space();
    			p1 = element("p");
    			t35 = text(t35_value);
    			t36 = space();
    			div12 = element("div");
    			h62 = element("h6");
    			h62.textContent = "Created At:";
    			t38 = space();
    			p2 = element("p");
    			t39 = text(t39_value);
    			t40 = space();
    			div13 = element("div");
    			h63 = element("h6");
    			h63.textContent = "Last Updated:";
    			t42 = space();
    			p3 = element("p");
    			t43 = text(t43_value);
    			t44 = space();
    			div16 = element("div");
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t46 = space();
    			div22 = element("div");
    			div21 = element("div");
    			div20 = element("div");
    			attr_dev(span0, "class", "card-title");
    			add_location(span0, file$8, 144, 14, 4250);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$8, 146, 16, 4369);
    			add_location(label0, file$8, 147, 16, 4435);
    			attr_dev(div0, "class", "input-field");
    			set_style(div0, "height", "5rem");
    			add_location(div0, file$8, 145, 14, 4304);
    			attr_dev(input1, "type", "email");
    			attr_dev(input1, "class", "validate");
    			add_location(input1, file$8, 150, 16, 4535);
    			add_location(label1, file$8, 154, 16, 4677);
    			attr_dev(span1, "class", "helper-text");
    			add_location(span1, file$8, 155, 16, 4715);
    			attr_dev(div1, "class", "input-field");
    			add_location(div1, file$8, 149, 14, 4492);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.disabled = true;
    			option0.selected = true;
    			add_location(option0, file$8, 160, 20, 4941);
    			option1.__value = "Open";
    			option1.value = option1.__value;
    			add_location(option1, file$8, 161, 20, 5013);
    			option2.__value = "In Progress";
    			option2.value = option2.__value;
    			add_location(option2, file$8, 162, 20, 5069);
    			option3.__value = "To Be Tested";
    			option3.value = option3.__value;
    			add_location(option3, file$8, 163, 20, 5139);
    			option4.__value = "Closed";
    			option4.value = option4.__value;
    			add_location(option4, file$8, 164, 20, 5211);
    			if (/*editBody*/ ctx[3].status === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[9].call(select0));
    			add_location(select0, file$8, 159, 18, 4882);
    			attr_dev(div2, "class", "col s4");
    			add_location(div2, file$8, 158, 16, 4842);
    			option5.__value = "";
    			option5.value = option5.__value;
    			option5.disabled = true;
    			option5.selected = true;
    			add_location(option5, file$8, 169, 20, 5421);
    			option6.__value = "Minor";
    			option6.value = option6.__value;
    			add_location(option6, file$8, 170, 20, 5495);
    			option7.__value = "Major";
    			option7.value = option7.__value;
    			add_location(option7, file$8, 171, 20, 5553);
    			if (/*editBody*/ ctx[3].severity === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[10].call(select1));
    			add_location(select1, file$8, 168, 18, 5360);
    			attr_dev(div3, "class", "col s3");
    			add_location(div3, file$8, 167, 16, 5320);
    			option8.__value = "";
    			option8.value = option8.__value;
    			option8.disabled = true;
    			option8.selected = true;
    			add_location(option8, file$8, 176, 20, 5769);
    			option9.__value = "Always";
    			option9.value = option9.__value;
    			add_location(option9, file$8, 177, 20, 5851);
    			option10.__value = "Intermitent";
    			option10.value = option10.__value;
    			add_location(option10, file$8, 178, 20, 5911);
    			if (/*editBody*/ ctx[3].reproduceability === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[11].call(select2));
    			add_location(select2, file$8, 175, 18, 5700);
    			attr_dev(div4, "class", "col s5");
    			add_location(div4, file$8, 174, 16, 5660);
    			attr_dev(textarea, "class", "materialize-textarea");
    			add_location(textarea, file$8, 182, 18, 6083);
    			add_location(label2, file$8, 185, 18, 6220);
    			attr_dev(div5, "class", "input-field col s12");
    			add_location(div5, file$8, 181, 16, 6030);
    			attr_dev(button0, "class", "col s12 btn blue");
    			add_location(button0, file$8, 187, 16, 6288);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$8, 157, 14, 4807);
    			attr_dev(div7, "class", "card-content");
    			add_location(div7, file$8, 143, 12, 4208);
    			attr_dev(div8, "class", "card");
    			add_location(div8, file$8, 142, 10, 4176);
    			attr_dev(div9, "class", "col s12 l6");
    			add_location(div9, file$8, 141, 8, 4140);
    			add_location(h60, file$8, 201, 18, 6718);
    			add_location(p0, file$8, 202, 18, 6759);
    			attr_dev(div10, "class", "col s12");
    			add_location(div10, file$8, 200, 16, 6677);
    			add_location(h61, file$8, 205, 18, 6866);
    			add_location(p1, file$8, 206, 18, 6904);
    			attr_dev(div11, "class", "col s12");
    			add_location(div11, file$8, 204, 16, 6825);
    			add_location(h62, file$8, 209, 18, 7013);
    			add_location(p2, file$8, 210, 18, 7053);
    			attr_dev(div12, "class", "col s12");
    			add_location(div12, file$8, 208, 16, 6972);
    			add_location(h63, file$8, 225, 18, 7593);
    			add_location(p3, file$8, 226, 18, 7635);
    			attr_dev(div13, "class", "col s12");
    			add_location(div13, file$8, 224, 16, 7552);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$8, 199, 14, 6642);
    			attr_dev(div15, "class", "card-content");
    			add_location(div15, file$8, 198, 12, 6600);
    			attr_dev(button1, "class", "btn red");
    			add_location(button1, file$8, 243, 14, 8213);
    			attr_dev(div16, "class", "card-action");
    			add_location(div16, file$8, 242, 12, 8172);
    			attr_dev(div17, "class", "card");
    			add_location(div17, file$8, 197, 10, 6568);
    			attr_dev(div18, "class", "col s12 l6");
    			add_location(div18, file$8, 196, 8, 6532);
    			attr_dev(div19, "class", "row");
    			set_style(div19, "margin", "0");
    			add_location(div19, file$8, 140, 6, 4094);
    			attr_dev(div20, "class", "indeterminate");
    			add_location(div20, file$8, 252, 10, 8513);
    			attr_dev(div21, "id", div21_id_value = "progress-" + /*i*/ ctx[2]);
    			attr_dev(div21, "class", "progress hide svelte-166ul66");
    			set_style(div21, "margin", "0");
    			add_location(div21, file$8, 251, 8, 8437);
    			set_style(div22, "height", "0.5rem");
    			add_location(div22, file$8, 250, 6, 8398);
    			attr_dev(div23, "class", " blue-grey lighten-5");
    			add_location(div23, file$8, 139, 4, 4035);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div23, anchor);
    			append_dev(div23, div19);
    			append_dev(div19, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span0);
    			append_dev(div7, t1);
    			append_dev(div7, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*editBody*/ ctx[3].name);
    			append_dev(div0, t2);
    			append_dev(div0, label0);
    			append_dev(div7, t4);
    			append_dev(div7, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*editBody*/ ctx[3].fixer);
    			append_dev(div1, t5);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, span1);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, div2);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(select0, option4);
    			select_option(select0, /*editBody*/ ctx[3].status);
    			append_dev(div6, t15);
    			append_dev(div6, div3);
    			append_dev(div3, select1);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			select_option(select1, /*editBody*/ ctx[3].severity);
    			append_dev(div6, t19);
    			append_dev(div6, div4);
    			append_dev(div4, select2);
    			append_dev(select2, option8);
    			append_dev(select2, option9);
    			append_dev(select2, option10);
    			select_option(select2, /*editBody*/ ctx[3].reproduceability);
    			append_dev(div6, t23);
    			append_dev(div6, div5);
    			append_dev(div5, textarea);
    			set_input_value(textarea, /*editBody*/ ctx[3].description);
    			append_dev(div5, t24);
    			append_dev(div5, label2);
    			append_dev(div6, t26);
    			append_dev(div6, button0);
    			append_dev(div19, t28);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div10);
    			append_dev(div10, h60);
    			append_dev(div10, t30);
    			append_dev(div10, p0);
    			append_dev(p0, t31);
    			append_dev(div14, t32);
    			append_dev(div14, div11);
    			append_dev(div11, h61);
    			append_dev(div11, t34);
    			append_dev(div11, p1);
    			append_dev(p1, t35);
    			append_dev(div14, t36);
    			append_dev(div14, div12);
    			append_dev(div12, h62);
    			append_dev(div12, t38);
    			append_dev(div12, p2);
    			append_dev(p2, t39);
    			append_dev(div14, t40);
    			append_dev(div14, div13);
    			append_dev(div13, h63);
    			append_dev(div13, t42);
    			append_dev(div13, p3);
    			append_dev(p3, t43);
    			append_dev(div17, t44);
    			append_dev(div17, div16);
    			append_dev(div16, button1);
    			append_dev(div23, t46);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div20);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen_dev(select0, "change", /*select0_change_handler*/ ctx[9]),
    				listen_dev(select1, "change", /*select1_change_handler*/ ctx[10]),
    				listen_dev(select2, "change", /*select2_change_handler*/ ctx[11]),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    				listen_dev(button0, "click", prevent_default(/*editBug*/ ctx[4]), false, true, false),
    				listen_dev(button1, "click", prevent_default(/*deleteBug*/ ctx[5]), false, true, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*editBody*/ 8 && input0.value !== /*editBody*/ ctx[3].name) {
    				set_input_value(input0, /*editBody*/ ctx[3].name);
    			}

    			if (dirty & /*editBody*/ 8 && input1.value !== /*editBody*/ ctx[3].fixer) {
    				set_input_value(input1, /*editBody*/ ctx[3].fixer);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select0, /*editBody*/ ctx[3].status);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select1, /*editBody*/ ctx[3].severity);
    			}

    			if (dirty & /*editBody*/ 8) {
    				select_option(select2, /*editBody*/ ctx[3].reproduceability);
    			}

    			if (dirty & /*editBody*/ 8) {
    				set_input_value(textarea, /*editBody*/ ctx[3].description);
    			}

    			if ((!current || dirty & /*bug*/ 2) && t31_value !== (t31_value = /*bug*/ ctx[1].description + "")) set_data_dev(t31, t31_value);
    			if ((!current || dirty & /*bug*/ 2) && t35_value !== (t35_value = /*bug*/ ctx[1].reporter.name + "")) set_data_dev(t35, t35_value);

    			if ((!current || dirty & /*bug*/ 2) && t39_value !== (t39_value = new Date(Date.parse(/*bug*/ ctx[1].createdAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t39, t39_value);

    			if ((!current || dirty & /*bug*/ 2) && t43_value !== (t43_value = new Date(Date.parse(/*bug*/ ctx[1].updatedAt)).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t43, t43_value);

    			if (!current || dirty & /*i*/ 4 && div21_id_value !== (div21_id_value = "progress-" + /*i*/ ctx[2])) {
    				attr_dev(div21, "id", div21_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div23_transition) div23_transition = create_bidirectional_transition(div23, slide, {}, true);
    				div23_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div23_transition) div23_transition = create_bidirectional_transition(div23, slide, {}, false);
    			div23_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div23);
    			if (detaching && div23_transition) div23_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(139:2) {#if show === i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let li;
    	let div4;
    	let div0;
    	let t0_value = /*bug*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*bug*/ ctx[1].reporter.name + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = /*bug*/ ctx[1].fixer.name + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let div3;
    	let i_1;
    	let t10;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*bug*/ ctx[1].status === "Open") return create_if_block_5$1;
    		if (/*bug*/ ctx[1].status === "In Progress") return create_if_block_6$1;
    		if (/*bug*/ ctx[1].status === "To Be Tested") return create_if_block_7$1;
    		if (/*bug*/ ctx[1].status === "Closed") return create_if_block_8$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*bug*/ ctx[1].severity === "Minor") return create_if_block_3$2;
    		if (/*bug*/ ctx[1].severity === "Major") return create_if_block_4$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*bug*/ ctx[1].reproduceability === "Always") return create_if_block_1$2;
    		if (/*bug*/ ctx[1].reproduceability === "Intermitent") return create_if_block_2$2;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2 && current_block_type_2(ctx);
    	let if_block3 = /*show*/ ctx[0] === /*i*/ ctx[2] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			div3 = element("div");
    			i_1 = element("i");
    			i_1.textContent = "more_vert";
    			t10 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "class", "col s2 center");
    			add_location(div0, file$8, 72, 4, 1617);
    			attr_dev(div1, "class", "col s2 center");
    			add_location(div1, file$8, 73, 4, 1666);
    			attr_dev(div2, "class", "col s2 center");
    			add_location(div2, file$8, 74, 4, 1724);
    			attr_dev(i_1, "id", "more");
    			attr_dev(i_1, "class", "material-icons svelte-166ul66");
    			set_style(i_1, "padding", "0");
    			set_style(i_1, "border-bottom", "none");
    			set_style(i_1, "justify-content", "center");
    			set_style(i_1, "background", "transparent");
    			set_style(i_1, "cursor", "pointer");
    			add_location(i_1, file$8, 127, 6, 3706);
    			attr_dev(div3, "class", "col s1 center");
    			add_location(div3, file$8, 126, 4, 3671);
    			attr_dev(div4, "class", "row valign-wrapper");
    			set_style(div4, "padding", "1rem");
    			set_style(div4, "border-bottom", "1px solid #ddd");
    			set_style(div4, "margin", "0");
    			set_style(div4, "background", "white");
    			add_location(div4, file$8, 68, 2, 1480);
    			add_location(li, file$8, 67, 0, 1472);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div4);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, t4);
    			append_dev(div4, t5);
    			if (if_block0) if_block0.m(div4, null);
    			append_dev(div4, t6);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t7);
    			if (if_block2) if_block2.m(div4, null);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, i_1);
    			append_dev(li, t10);
    			if (if_block3) if_block3.m(li, null);
    			current = true;
    			dispose = listen_dev(i_1, "click", /*click_handler*/ ctx[6], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*bug*/ 2) && t0_value !== (t0_value = /*bug*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*bug*/ 2) && t2_value !== (t2_value = /*bug*/ ctx[1].reporter.name + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*bug*/ 2) && t4_value !== (t4_value = /*bug*/ ctx[1].fixer.name + "")) set_data_dev(t4, t4_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div4, t6);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div4, t7);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if (if_block2) if_block2.d(1);
    				if_block2 = current_block_type_2 && current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div4, t8);
    				}
    			}

    			if (/*show*/ ctx[0] === /*i*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    					transition_in(if_block3, 1);
    				} else {
    					if_block3 = create_if_block$3(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(li, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) {
    				if_block1.d();
    			}

    			if (if_block2) {
    				if_block2.d();
    			}

    			if (if_block3) if_block3.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { bug } = $$props;
    	let { i } = $$props;
    	let { show } = $$props;
    	let editBody = {};

    	const editBug = async e => {
    		const progress = document.getElementById(`progress-${i}`);
    		progress.classList.remove("hide");

    		for (let key in editBody) {
    			if (editBody[key] === "") delete editBody[key];
    		}

    		const res = await bugs.editBug(editBody, bug._id, i);

    		if (res === true) {
    			$$invalidate(0, show = null);
    		} else if (res.error === "Cannot read property '_id' of null") {
    			M.toast({
    				html: "'fixer' must be a users email",
    				classes: "red darken-2"
    			});
    		}

    		progress.classList.add("hide");
    	};

    	const deleteBug = async () => {
    		const conf = confirm("Are you sure you want to delete this bug?");
    		if (!conf) return;
    		const progress = document.getElementById(`progress-${i}`);
    		progress.classList.remove("hide");
    		const res = await bugs.deleteBug(bug._id, i);

    		if (res === true) {
    			$$invalidate(0, show = null);
    		} else {
    			M.toast({ html: res.error, classes: "red darken-2" });
    		}

    		progress.classList.add("hide");
    	};

    	const writable_props = ["bug", "i", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bug> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => show === i
    	? $$invalidate(0, show = null)
    	: $$invalidate(0, show = i);

    	function input0_input_handler() {
    		editBody.name = this.value;
    		$$invalidate(3, editBody);
    	}

    	function input1_input_handler() {
    		editBody.fixer = this.value;
    		$$invalidate(3, editBody);
    	}

    	function select0_change_handler() {
    		editBody.status = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function select1_change_handler() {
    		editBody.severity = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function select2_change_handler() {
    		editBody.reproduceability = select_value(this);
    		$$invalidate(3, editBody);
    	}

    	function textarea_input_handler() {
    		editBody.description = this.value;
    		$$invalidate(3, editBody);
    	}

    	$$self.$set = $$props => {
    		if ("bug" in $$props) $$invalidate(1, bug = $$props.bug);
    		if ("i" in $$props) $$invalidate(2, i = $$props.i);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => {
    		return { bug, i, show, editBody };
    	};

    	$$self.$inject_state = $$props => {
    		if ("bug" in $$props) $$invalidate(1, bug = $$props.bug);
    		if ("i" in $$props) $$invalidate(2, i = $$props.i);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("editBody" in $$props) $$invalidate(3, editBody = $$props.editBody);
    	};

    	return [
    		show,
    		bug,
    		i,
    		editBody,
    		editBug,
    		deleteBug,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler,
    		textarea_input_handler
    	];
    }

    class Bug extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { bug: 1, i: 2, show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bug",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bug*/ ctx[1] === undefined && !("bug" in props)) {
    			console.warn("<Bug> was created without expected prop 'bug'");
    		}

    		if (/*i*/ ctx[2] === undefined && !("i" in props)) {
    			console.warn("<Bug> was created without expected prop 'i'");
    		}

    		if (/*show*/ ctx[0] === undefined && !("show" in props)) {
    			console.warn("<Bug> was created without expected prop 'show'");
    		}
    	}

    	get bug() {
    		throw new Error("<Bug>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bug(value) {
    		throw new Error("<Bug>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Bug>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Bug>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Bug>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Bug>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\BugsWrokspace.svelte generated by Svelte v3.18.0 */
    const file$9 = "src\\BugsWrokspace.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (43:2) {#if projectInfo.name}
    function create_if_block_6$2(ctx) {
    	let h3;
    	let t_value = /*projectInfo*/ ctx[0].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			attr_dev(h3, "class", "center cyan-text text-darken-4");
    			set_style(h3, "font-weight", "300");
    			set_style(h3, "margin", "1rem 0");
    			add_location(h3, file$9, 43, 4, 1124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projectInfo*/ 1 && t_value !== (t_value = /*projectInfo*/ ctx[0].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(43:2) {#if projectInfo.name}",
    		ctx
    	});

    	return block;
    }

    // (54:8) {#if matches}
    function create_if_block_5$2(ctx) {
    	let div7;
    	let div0;
    	let a0;
    	let t0;
    	let i0;
    	let a0_href_value;
    	let t2;
    	let div1;
    	let a1;
    	let t3;
    	let i1;
    	let a1_href_value;
    	let t5;
    	let div2;
    	let a2;
    	let t6;
    	let i2;
    	let a2_href_value;
    	let t8;
    	let div3;
    	let a3;
    	let t9;
    	let i3;
    	let a3_href_value;
    	let t11;
    	let div4;
    	let a4;
    	let t12;
    	let i4;
    	let a4_href_value;
    	let t14;
    	let div5;
    	let a5;
    	let t15;
    	let i5;
    	let a5_href_value;
    	let t17;
    	let div6;
    	let a6;
    	let t18;
    	let i6;
    	let a6_href_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text("name\r\n                ");
    			i0 = element("i");
    			i0.textContent = "keyboard_arrow_down";
    			t2 = space();
    			div1 = element("div");
    			a1 = element("a");
    			t3 = text("reporter\r\n                ");
    			i1 = element("i");
    			i1.textContent = "keyboard_arrow_down";
    			t5 = space();
    			div2 = element("div");
    			a2 = element("a");
    			t6 = text("fixer\r\n                ");
    			i2 = element("i");
    			i2.textContent = "keyboard_arrow_down";
    			t8 = space();
    			div3 = element("div");
    			a3 = element("a");
    			t9 = text("status\r\n                ");
    			i3 = element("i");
    			i3.textContent = "keyboard_arrow_down";
    			t11 = space();
    			div4 = element("div");
    			a4 = element("a");
    			t12 = text("severity\r\n                ");
    			i4 = element("i");
    			i4.textContent = "keyboard_arrow_down";
    			t14 = space();
    			div5 = element("div");
    			a5 = element("a");
    			t15 = text("reproduceability\r\n                ");
    			i5 = element("i");
    			i5.textContent = "keyboard_arrow_down";
    			t17 = space();
    			div6 = element("div");
    			a6 = element("a");
    			t18 = text("more\r\n                ");
    			i6 = element("i");
    			i6.textContent = "keyboard_arrow_down";
    			attr_dev(i0, "class", "material-icons right hide");
    			set_style(i0, "margin-left", "0");
    			add_location(i0, file$9, 63, 16, 1778);
    			attr_dev(a0, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a0, "href", a0_href_value = null);
    			add_location(a0, file$9, 58, 14, 1590);
    			attr_dev(div0, "class", "col s2 center");
    			set_style(div0, "padding", "0");
    			add_location(div0, file$9, 57, 12, 1527);
    			attr_dev(i1, "class", "material-icons right hide");
    			set_style(i1, "margin-left", "0");
    			add_location(i1, file$9, 74, 16, 2208);
    			attr_dev(a1, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a1, "href", a1_href_value = null);
    			add_location(a1, file$9, 69, 14, 2016);
    			attr_dev(div1, "class", "col s2 center");
    			set_style(div1, "padding", "0");
    			add_location(div1, file$9, 68, 12, 1953);
    			attr_dev(i2, "class", "material-icons right hide");
    			set_style(i2, "margin-left", "0");
    			add_location(i2, file$9, 85, 16, 2635);
    			attr_dev(a2, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a2, "href", a2_href_value = null);
    			add_location(a2, file$9, 80, 14, 2446);
    			attr_dev(div2, "class", "col s2 center");
    			set_style(div2, "padding", "0");
    			add_location(div2, file$9, 79, 12, 2383);
    			attr_dev(i3, "class", "material-icons right hide");
    			set_style(i3, "margin-left", "0");
    			add_location(i3, file$9, 96, 16, 3063);
    			attr_dev(a3, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a3, "href", a3_href_value = null);
    			add_location(a3, file$9, 91, 14, 2873);
    			attr_dev(div3, "class", "col s2 center");
    			set_style(div3, "padding", "0");
    			add_location(div3, file$9, 90, 12, 2810);
    			attr_dev(i4, "class", "material-icons right hide");
    			set_style(i4, "margin-left", "0");
    			add_location(i4, file$9, 107, 16, 3493);
    			attr_dev(a4, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a4, "href", a4_href_value = null);
    			add_location(a4, file$9, 102, 14, 3301);
    			attr_dev(div4, "class", "col s1 center");
    			set_style(div4, "padding", "0");
    			add_location(div4, file$9, 101, 12, 3238);
    			attr_dev(i5, "class", "material-icons right hide");
    			set_style(i5, "margin-left", "0");
    			add_location(i5, file$9, 118, 16, 3931);
    			attr_dev(a5, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a5, "href", a5_href_value = null);
    			add_location(a5, file$9, 113, 14, 3731);
    			attr_dev(div5, "class", "col s2 center");
    			set_style(div5, "padding", "0");
    			add_location(div5, file$9, 112, 12, 3668);
    			attr_dev(i6, "class", "material-icons right hide");
    			set_style(i6, "margin-left", "0");
    			add_location(i6, file$9, 129, 16, 4366);
    			attr_dev(a6, "class", "btn-flat blue-grey darken-3 white-text disabled");
    			attr_dev(a6, "href", a6_href_value = null);
    			add_location(a6, file$9, 124, 14, 4169);
    			attr_dev(div6, "class", "col s1 center");
    			set_style(div6, "padding", "0");
    			add_location(div6, file$9, 123, 12, 4106);
    			attr_dev(div7, "class", "row blue-grey darken-4 valign-wrapper");
    			set_style(div7, "padding", "1rem");
    			set_style(div7, "margin", "0");
    			add_location(div7, file$9, 54, 10, 1402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, a0);
    			append_dev(a0, t0);
    			append_dev(a0, i0);
    			append_dev(div7, t2);
    			append_dev(div7, div1);
    			append_dev(div1, a1);
    			append_dev(a1, t3);
    			append_dev(a1, i1);
    			append_dev(div7, t5);
    			append_dev(div7, div2);
    			append_dev(div2, a2);
    			append_dev(a2, t6);
    			append_dev(a2, i2);
    			append_dev(div7, t8);
    			append_dev(div7, div3);
    			append_dev(div3, a3);
    			append_dev(a3, t9);
    			append_dev(a3, i3);
    			append_dev(div7, t11);
    			append_dev(div7, div4);
    			append_dev(div4, a4);
    			append_dev(a4, t12);
    			append_dev(a4, i4);
    			append_dev(div7, t14);
    			append_dev(div7, div5);
    			append_dev(div5, a5);
    			append_dev(a5, t15);
    			append_dev(a5, i5);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			append_dev(div6, a6);
    			append_dev(a6, t18);
    			append_dev(a6, i6);

    			dispose = [
    				listen_dev(a0, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a1, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a2, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a3, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a4, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a5, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a6, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false)
    			];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(54:8) {#if matches}",
    		ctx
    	});

    	return block;
    }

    // (53:6) <MediaQuery query="(min-width: 993px)" let:matches>
    function create_default_slot_3(ctx) {
    	let if_block_anchor;
    	let if_block = /*matches*/ ctx[6] && create_if_block_5$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*matches*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(53:6) <MediaQuery query=\\\"(min-width: 993px)\\\" let:matches>",
    		ctx
    	});

    	return block;
    }

    // (139:8) {#if matches}
    function create_if_block_4$2(ctx) {
    	let div4;
    	let div0;
    	let a0;
    	let t0;
    	let i0;
    	let a0_href_value;
    	let t2;
    	let div1;
    	let a1;
    	let t3;
    	let i1;
    	let a1_href_value;
    	let t5;
    	let div2;
    	let a2;
    	let t6;
    	let i2;
    	let a2_href_value;
    	let t8;
    	let div3;
    	let a3;
    	let t9;
    	let i3;
    	let a3_href_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text("name\r\n                ");
    			i0 = element("i");
    			i0.textContent = "keyboard_arrow_down";
    			t2 = space();
    			div1 = element("div");
    			a1 = element("a");
    			t3 = text("fixer\r\n                ");
    			i1 = element("i");
    			i1.textContent = "keyboard_arrow_down";
    			t5 = space();
    			div2 = element("div");
    			a2 = element("a");
    			t6 = text("status\r\n                ");
    			i2 = element("i");
    			i2.textContent = "keyboard_arrow_down";
    			t8 = space();
    			div3 = element("div");
    			a3 = element("a");
    			t9 = text("more\r\n                ");
    			i3 = element("i");
    			i3.textContent = "keyboard_arrow_down";
    			attr_dev(i0, "class", "material-icons right hide");
    			set_style(i0, "margin-left", "0");
    			add_location(i0, file$9, 148, 16, 5053);
    			attr_dev(a0, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a0, "href", a0_href_value = null);
    			add_location(a0, file$9, 143, 14, 4865);
    			attr_dev(div0, "class", "col s3 center");
    			set_style(div0, "padding", "0");
    			add_location(div0, file$9, 142, 12, 4802);
    			attr_dev(i1, "class", "material-icons right hide");
    			set_style(i1, "margin-left", "0");
    			add_location(i1, file$9, 159, 16, 5480);
    			attr_dev(a1, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a1, "href", a1_href_value = null);
    			add_location(a1, file$9, 154, 14, 5291);
    			attr_dev(div1, "class", "col s3 center");
    			set_style(div1, "padding", "0");
    			add_location(div1, file$9, 153, 12, 5228);
    			attr_dev(i2, "class", "material-icons right hide");
    			set_style(i2, "margin-left", "0");
    			add_location(i2, file$9, 170, 16, 5908);
    			attr_dev(a2, "class", "btn-flat blue-grey darken-3 white-text");
    			attr_dev(a2, "href", a2_href_value = null);
    			add_location(a2, file$9, 165, 14, 5718);
    			attr_dev(div2, "class", "col s3 center");
    			set_style(div2, "padding", "0");
    			add_location(div2, file$9, 164, 12, 5655);
    			attr_dev(i3, "class", "material-icons right hide");
    			set_style(i3, "margin-left", "0");
    			add_location(i3, file$9, 181, 16, 6343);
    			attr_dev(a3, "class", "btn-flat blue-grey darken-3 white-text disabled");
    			attr_dev(a3, "href", a3_href_value = null);
    			add_location(a3, file$9, 176, 14, 6146);
    			attr_dev(div3, "class", "col s3 center");
    			set_style(div3, "padding", "0");
    			add_location(div3, file$9, 175, 12, 6083);
    			attr_dev(div4, "class", "row blue-grey darken-4 valign-wrapper");
    			set_style(div4, "padding", "1rem 0");
    			set_style(div4, "margin", "0");
    			add_location(div4, file$9, 139, 10, 4675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, a0);
    			append_dev(a0, t0);
    			append_dev(a0, i0);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, a1);
    			append_dev(a1, t3);
    			append_dev(a1, i1);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, a2);
    			append_dev(a2, t6);
    			append_dev(a2, i2);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, a3);
    			append_dev(a3, t9);
    			append_dev(a3, i3);

    			dispose = [
    				listen_dev(a0, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a1, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a2, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false),
    				listen_dev(a3, "click", prevent_default(/*sortBugs*/ ctx[3]), false, true, false)
    			];
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(139:8) {#if matches}",
    		ctx
    	});

    	return block;
    }

    // (138:6) <MediaQuery query="(max-width: 992px)" let:matches>
    function create_default_slot_2(ctx) {
    	let if_block_anchor;
    	let if_block = /*matches*/ ctx[6] && create_if_block_4$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*matches*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(138:6) <MediaQuery query=\\\"(max-width: 992px)\\\" let:matches>",
    		ctx
    	});

    	return block;
    }

    // (193:6) {#if matches}
    function create_if_block_2$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$bugs*/ ctx[2] && create_if_block_3$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$bugs*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_3$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(193:6) {#if matches}",
    		ctx
    	});

    	return block;
    }

    // (194:8) {#if $bugs}
    function create_if_block_3$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*$bugs*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bugs, show*/ 6) {
    				each_value_1 = /*$bugs*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(194:8) {#if $bugs}",
    		ctx
    	});

    	return block;
    }

    // (195:10) {#each $bugs as bug, i}
    function create_each_block_1(ctx) {
    	let updating_show;
    	let current;

    	function bug_show_binding(value) {
    		/*bug_show_binding*/ ctx[4].call(null, value);
    	}

    	let bug_props = { i: /*i*/ ctx[9], bug: /*bug*/ ctx[7] };

    	if (/*show*/ ctx[1] !== void 0) {
    		bug_props.show = /*show*/ ctx[1];
    	}

    	const bug = new Bug({ props: bug_props, $$inline: true });
    	binding_callbacks.push(() => bind(bug, "show", bug_show_binding));

    	const block = {
    		c: function create() {
    			create_component(bug.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bug, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bug_changes = {};
    			if (dirty & /*$bugs*/ 4) bug_changes.bug = /*bug*/ ctx[7];

    			if (!updating_show && dirty & /*show*/ 2) {
    				updating_show = true;
    				bug_changes.show = /*show*/ ctx[1];
    				add_flush_callback(() => updating_show = false);
    			}

    			bug.$set(bug_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bug.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bug.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bug, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(195:10) {#each $bugs as bug, i}",
    		ctx
    	});

    	return block;
    }

    // (192:4) <MediaQuery query="(min-width: 993px)" let:matches>
    function create_default_slot_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*matches*/ ctx[6] && create_if_block_2$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*matches*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_2$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(192:4) <MediaQuery query=\\\"(min-width: 993px)\\\" let:matches>",
    		ctx
    	});

    	return block;
    }

    // (202:6) {#if matches}
    function create_if_block$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$bugs*/ ctx[2] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$bugs*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(202:6) {#if matches}",
    		ctx
    	});

    	return block;
    }

    // (203:8) {#if $bugs}
    function create_if_block_1$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$bugs*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bugs, show*/ 6) {
    				each_value = /*$bugs*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(203:8) {#if $bugs}",
    		ctx
    	});

    	return block;
    }

    // (204:10) {#each $bugs as bug, i}
    function create_each_block$1(ctx) {
    	let updating_show;
    	let current;

    	function bugmobile_show_binding(value) {
    		/*bugmobile_show_binding*/ ctx[5].call(null, value);
    	}

    	let bugmobile_props = { i: /*i*/ ctx[9], bug: /*bug*/ ctx[7] };

    	if (/*show*/ ctx[1] !== void 0) {
    		bugmobile_props.show = /*show*/ ctx[1];
    	}

    	const bugmobile = new BugMobile({ props: bugmobile_props, $$inline: true });
    	binding_callbacks.push(() => bind(bugmobile, "show", bugmobile_show_binding));

    	const block = {
    		c: function create() {
    			create_component(bugmobile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bugmobile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bugmobile_changes = {};
    			if (dirty & /*$bugs*/ 4) bugmobile_changes.bug = /*bug*/ ctx[7];

    			if (!updating_show && dirty & /*show*/ 2) {
    				updating_show = true;
    				bugmobile_changes.show = /*show*/ ctx[1];
    				add_flush_callback(() => updating_show = false);
    			}

    			bugmobile.$set(bugmobile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bugmobile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bugmobile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bugmobile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(204:10) {#each $bugs as bug, i}",
    		ctx
    	});

    	return block;
    }

    // (201:4) <MediaQuery query="(max-width: 992px)" let:matches>
    function create_default_slot(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*matches*/ ctx[6] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*matches*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(201:4) <MediaQuery query=\\\"(max-width: 992px)\\\" let:matches>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let t0;
    	let ul;
    	let li;
    	let t1;
    	let t2;
    	let hr;
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let div0;
    	let current;
    	let if_block = /*projectInfo*/ ctx[0].name && create_if_block_6$2(ctx);

    	const mediaquery0 = new MediaQuery({
    			props: {
    				query: "(min-width: 993px)",
    				$$slots: {
    					default: [
    						create_default_slot_3,
    						({ matches }) => ({ 6: matches }),
    						({ matches }) => matches ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const mediaquery1 = new MediaQuery({
    			props: {
    				query: "(max-width: 992px)",
    				$$slots: {
    					default: [
    						create_default_slot_2,
    						({ matches }) => ({ 6: matches }),
    						({ matches }) => matches ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const mediaquery2 = new MediaQuery({
    			props: {
    				query: "(min-width: 993px)",
    				$$slots: {
    					default: [
    						create_default_slot_1,
    						({ matches }) => ({ 6: matches }),
    						({ matches }) => matches ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const mediaquery3 = new MediaQuery({
    			props: {
    				query: "(max-width: 992px)",
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ matches }) => ({ 6: matches }),
    						({ matches }) => matches ? 64 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			ul = element("ul");
    			li = element("li");
    			create_component(mediaquery0.$$.fragment);
    			t1 = space();
    			create_component(mediaquery1.$$.fragment);
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			create_component(mediaquery2.$$.fragment);
    			t4 = space();
    			create_component(mediaquery3.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			div0 = element("div");
    			set_style(hr, "margin", "0");
    			add_location(hr, file$9, 189, 6, 6566);
    			add_location(li, file$9, 51, 4, 1304);
    			attr_dev(ul, "class", "collapsible");
    			add_location(ul, file$9, 50, 2, 1274);
    			attr_dev(div0, "class", "indeterminate");
    			add_location(div0, file$9, 212, 4, 7154);
    			attr_dev(div1, "id", "loadingBar");
    			attr_dev(div1, "class", "progress hide");
    			add_location(div1, file$9, 211, 2, 7105);
    			attr_dev(div2, "class", "custom-container");
    			set_style(div2, "margin", "0 auto");
    			set_style(div2, "max-width", "1280px");
    			add_location(div2, file$9, 41, 0, 1019);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, ul);
    			append_dev(ul, li);
    			mount_component(mediaquery0, li, null);
    			append_dev(li, t1);
    			mount_component(mediaquery1, li, null);
    			append_dev(li, t2);
    			append_dev(li, hr);
    			append_dev(ul, t3);
    			mount_component(mediaquery2, ul, null);
    			append_dev(ul, t4);
    			mount_component(mediaquery3, ul, null);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*projectInfo*/ ctx[0].name) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6$2(ctx);
    					if_block.c();
    					if_block.m(div2, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const mediaquery0_changes = {};

    			if (dirty & /*$$scope, matches*/ 2112) {
    				mediaquery0_changes.$$scope = { dirty, ctx };
    			}

    			mediaquery0.$set(mediaquery0_changes);
    			const mediaquery1_changes = {};

    			if (dirty & /*$$scope, matches*/ 2112) {
    				mediaquery1_changes.$$scope = { dirty, ctx };
    			}

    			mediaquery1.$set(mediaquery1_changes);
    			const mediaquery2_changes = {};

    			if (dirty & /*$$scope, $bugs, show, matches*/ 2118) {
    				mediaquery2_changes.$$scope = { dirty, ctx };
    			}

    			mediaquery2.$set(mediaquery2_changes);
    			const mediaquery3_changes = {};

    			if (dirty & /*$$scope, $bugs, show, matches*/ 2118) {
    				mediaquery3_changes.$$scope = { dirty, ctx };
    			}

    			mediaquery3.$set(mediaquery3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mediaquery0.$$.fragment, local);
    			transition_in(mediaquery1.$$.fragment, local);
    			transition_in(mediaquery2.$$.fragment, local);
    			transition_in(mediaquery3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mediaquery0.$$.fragment, local);
    			transition_out(mediaquery1.$$.fragment, local);
    			transition_out(mediaquery2.$$.fragment, local);
    			transition_out(mediaquery3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			destroy_component(mediaquery0);
    			destroy_component(mediaquery1);
    			destroy_component(mediaquery2);
    			destroy_component(mediaquery3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $bugs;
    	validate_store(bugs, "bugs");
    	component_subscribe($$self, bugs, $$value => $$invalidate(2, $bugs = $$value));
    	let projectInfo = false;
    	let show = null;

    	const sortBugs = e => {
    		const element = e.target.innerText.toLowerCase();
    		bugs.sortBugs(element);
    	};

    	onMount(async () => {
    		const res = await projectsData.getProjectInfo();

    		if (res.success) {
    			$$invalidate(0, projectInfo = res.data);
    		} else {
    			console.log(res);
    		}
    	});

    	onMount(async () => {
    		const loadingBar = document.getElementById("loadingBar");
    		loadingBar.classList.remove("hide");
    		await bugs.loadBugs();
    		loadingBar.classList.add("hide");
    	});

    	afterUpdate(function () {
    		const elems = document.querySelectorAll("select");
    		const instances = M.FormSelect.init(elems);
    	});

    	function bug_show_binding(value) {
    		show = value;
    		$$invalidate(1, show);
    	}

    	function bugmobile_show_binding(value) {
    		show = value;
    		$$invalidate(1, show);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("projectInfo" in $$props) $$invalidate(0, projectInfo = $$props.projectInfo);
    		if ("show" in $$props) $$invalidate(1, show = $$props.show);
    		if ("$bugs" in $$props) bugs.set($bugs = $$props.$bugs);
    	};

    	return [projectInfo, show, $bugs, sortBugs, bug_show_binding, bugmobile_show_binding];
    }

    class BugsWrokspace extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BugsWrokspace",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Info.svelte generated by Svelte v3.18.0 */

    const file$a = "src\\Info.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let p;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "This is a simple bug tracker app. it also has a public api!";
    			add_location(p, file$a, 9, 4, 139);
    			attr_dev(div0, "class", "card-content");
    			add_location(div0, file$a, 8, 2, 107);
    			attr_dev(div1, "class", "card svelte-d0eabu");
    			add_location(div1, file$a, 7, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.0 */
    const file$b = "src\\App.svelte";

    function create_fragment$d(ctx) {
    	let main;
    	let t;
    	let current;
    	const navbar = new Navbar({ $$inline: true });

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(router.$$.fragment);
    			add_location(main, file$b, 24, 0, 644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self) {
    	const routes = {
    		"/": Login,
    		"/createUser": CreateUser,
    		"/projects": Projects,
    		"/bugs": BugsWrokspace,
    		"/info": Info,
    		"*": Login
    	};

    	onMount(async () => login.getMe());

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
