import BezierEazing from 'bezier-easing';

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
const keys = {32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1};

const Scroll = {
    _map: new WeakMap(),
    _supportsPassive: false,
    _wheelOpt: false,
    _wheelEvent: 'mousewheel',
    _preventDefault: function(e) {
        e.preventDefault();
    },
    _preventDefaultForScrollKeys: function(e) {
        if (keys[e.keyCode]) {
            Scroll._preventDefault(e);
            return false;
        }
    },
    _disableScroll: function() {
        window.addEventListener('DOMMouseScroll', Scroll._preventDefault, false); // older FF
        window.addEventListener(Scroll._wheelEvent, Scroll._preventDefault, Scroll._wheelOpt); // modern desktop
        window.addEventListener('touchmove', Scroll._preventDefault, Scroll._wheelOpt); // mobile
        window.addEventListener('keydown', Scroll._preventDefaultForScrollKeys, false);
    },
    _enableScroll: function() {
        window.removeEventListener('DOMMouseScroll', Scroll._preventDefault, false);
        window.removeEventListener(Scroll._wheelEvent, Scroll._preventDefault, Scroll._wheelOpt);
        window.removeEventListener('touchmove', Scroll._preventDefault, Scroll._wheelOpt);
        window.removeEventListener('keydown', Scroll._preventDefaultForScrollKeys, false);
    },
}

// modern Chrome requires { passive: false } when adding event
try {
    window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
        get: function () { Scroll._supportsPassive = true; }
    }));
} catch(e) {}

Scroll._wheelOpt = Scroll._supportsPassive ? { passive: false } : false;
Scroll._wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

/**
 * Плавная прокрутка до элемента
 * @param  {Element} $el     Элемент
 * @param  {Object}  options Параметры:
 * {
 *     time: 1.0,           // время анимации в секундах
 *     fps: 60,             // "кадры" в секунду
 *     offsetY: 0,          // отступ сверху
 *     interruptable: true, // прерывается пользователем
 * }
 * @return {Promise} Промис по завершении анимации (reject при прерывании)
 */
Scroll.to = function($el, options = {}) {
    if (!$el) {
        return Promise.reject();
    }

    // от повторной прокрутки
    if (Scroll._map.has($el)) {
        return Scroll._map.get($el);
    }

    const time          = parseFloat(options.time)      || 1.0;
    const fps           = parseInt(options.fps, 10)     || 60;
    const offsetY       = parseInt(options.offsetY, 10) || 0;
    const interruptable = typeof options.interruptable == 'undefined' ? true : !!options.interruptable;

    const top = (function($el, y = 0) {
        do {} while (y += $el.offsetTop, $el = $el.offsetParent);
        return y;
    })($el);

    const from            = window.scrollY;
    const ticks           = time * fps;
    const distance        = from - top + Math.min(top, offsetY);
    const distancePerTick = distance / ticks;
    let interval;

    const promise = new Promise((resolve, reject) => {
        function _interruptOnScroll() {
            if (window.scrollY != lastY) {
                _done(false);
            }
        }

        function _done(state) {
            Scroll._map.delete($el);

            if (interval) {
                clearInterval(interval);
                interval = null;
            }

            if (!interruptable) {
                Scroll._enableScroll();
            } else {
                window.removeEventListener('scroll', _interruptOnScroll);
            }

            state ? resolve() : reject();
        }

        if (!interruptable) {
            Scroll._disableScroll();
        } else {
            window.addEventListener('scroll', _interruptOnScroll)
        }

        // прокрутка не требуется
        if (!distance) {
            _done(true);
        }

        const easing = BezierEazing(0.25, 0.1, 0.25, 1.0);
        let lastY    = from;
        let tick     = 0;
        function _loop() {
            if (++tick >= ticks) {
                _done(true);
                return;
            }

            lastY = Math.round(from - easing(distancePerTick * tick / distance) * distance);

            window.scrollTo({
                top: lastY,
                behavior: 'instant',
            });
        }

        interval = setInterval(_loop, 1000 / fps);
    });

    Scroll._map.set($el, promise);

    return promise;

}

export default Scroll;
