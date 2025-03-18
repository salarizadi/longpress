# jQuery LongPress Plugin

A jQuery plugin for handling long press events on both mobile and desktop devices.

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](https://github.com/salarizadi/longpress)
[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/salarizadi/longpress/badge)](https://www.jsdelivr.com/package/gh/salarizadi/longpress)
[![CodePen demo](https://img.shields.io/badge/CodePen-demo-blue.svg)](https://codepen.io/salariz/pen/OPJQbXz)

## Demo

[View Live Demo on CodePen](https://codepen.io/salariz/pen/OPJQbXz)

## Features

- Works with both touch and mouse events
- Configurable hold duration
- Optional maximum hold time limit
- Progress bar support
- Customizable callbacks
- Mobile-friendly
- Context menu prevention for right-clicks
- No external dependencies (except jQuery)

## Installation

```html
<script src="https://cdn.jsdelivr.net/gh/salarizadi/longpress@main/jquery.longpress.js"></script>
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
    },
    preventContextMenu: true // Prevent context menu on right-click
});

// To destroy the plugin instance
$('#myButton').longPressDestroy();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| holdTime | Number | 500 | Initial delay before hold starts (ms) |
| maxHoldTime | Number/null | null | Maximum hold duration (ms) |
| holdClass | String | 'holding' | CSS class added while holding |
| progressBar | Boolean | false | Show progress bar |
| progressBarClass | String | 'button-hold-progress' | CSS class for the progress bar |
| throttleProgress | Number | 16 | Throttle interval for progress updates (ms) |
| touchMoveThreshold | Number | 10 | Movement threshold to cancel hold (px) |
| preventContextMenu | Boolean | true | Prevent context menu on right-click |
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
