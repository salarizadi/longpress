# jQuery LongPress Plugin

A jQuery plugin for handling long press events on both mobile and desktop devices.

## Features

- Works with both touch and mouse events
- Configurable hold duration
- Optional maximum hold time limit
- Progress bar support
- Customizable callbacks
- Mobile-friendly
- No external dependencies (except jQuery)

## Installation

```html
<script src="jquery.longpress.js"></script>
```

## Usage

```javascript
// Basic usage
$('#button').longPress();

// With options
$('#button').longPress({
    holdTime: 500,         // Initial hold time (ms)
    maxHoldTime: 3000,     // Maximum hold time (ms)
    progressBar: true,     // Show progress bar
    onHoldStart: function() {
        console.log('Hold started');
    },
    onHold: function(e, progress, duration) {
        console.log('Progress:', progress + '%');
    },
    onHoldEnd: function(e, duration) {
        console.log('Hold ended');
    },
    onMaxHold: function() {
        console.log('Maximum hold time reached');
    }
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| holdTime | Number | 500 | Initial delay before hold starts (ms) |
| maxHoldTime | Number/null | null | Maximum hold duration (ms) |
| holdClass | String | 'holding' | CSS class added while holding |
| progressBar | Boolean | false | Show progress bar |
| onHoldStart | Function | null | Called when hold starts |
| onHold | Function | null | Called during hold |
| onHoldEnd | Function | null | Called when hold ends |
| onMaxHold | Function | null | Called at maximum hold time |

## Browser Support
 - Chrome (latest)
 - Firefox (latest)
 - Safari (latest)
 - Edge (latest)
 - iOS Safari (latest)
 - Android Browser (latest)
