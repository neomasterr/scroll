[![npm](https://img.shields.io/npm/v/@neomasterr/scroll.svg?style=flat-square)](https://www.npmjs.org/@neomasterr/scroll)

# scroll

## Install
```
npm install @neomasterr/scroll
```

## Usage
### Example 1
default behaviour
```JAVASCRIPT
import Scroll from '@neomasterr/scroll';

Scroll.to(document.getElementById('foo'));
```

### Example 2
custom options
```JAVASCRIPT
import Scroll from '@neomasterr/scroll';

Scroll.to(document.getElementById('foo'), {
    time: 2.0,
    fps: 60,
    offsetY: 500,
    interruptable: false,
});
```

### Example 3
callback (promise)
```JAVASCRIPT
import Scroll from '@neomasterr/scroll';

Scroll.to(document.getElementById('foo')).then(() => {
    // scroll done
}).catch(() => {
    // scroll interrupted    
});
```
