/**
 *  Copyright (c) 2025
 *  @Version : 1.0.0
 *  @Author  : https://salarizadi.ir
 *  @Repository : https://github.com/salarizadi/longpress
 *  @Description: A jQuery plugin for handling long press events on both mobile and desktop devices.
 */

(function($) {
    'use strict';

    $.fn.longPress = function(options) {
        // Default settings
        const settings = $.extend({
            holdTime: 500,         // Time in ms to trigger initial hold
            maxHoldTime: null,     // Maximum hold time in ms (null = unlimited)
            holdClass: 'holding',     // CSS class when holding
            onHoldStart: () => {}, // Callback when hold starts
            onHold: () => {},      // Callback while holding
            onHoldEnd: () => {},   // Callback when hold ends
            onMaxHold: () => {},   // Callback when max hold time is reached
            progressBar: false,     // Whether to show progress bar
            progressBarClass: 'button-hold-progress' // Progress bar class
        }, options);

        return this.each(function() {
            const $button = $(this);
            let isHolding = false;
            let holdTimeout = null;
            let holdInterval = null;
            let holdStartTime = null;
            let $progressBar = null;

            // Add progress bar if enabled
            if (settings.progressBar) {
                $progressBar = $('<div>', {
                    class: settings.progressBarClass,
                    css: {
                        width: '0%',
                        height: '3px',
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.05s linear'
                    }
                }).appendTo($button);

                // Make button relative if it's not already
                if ($button.css('position') === 'static') {
                    $button.css('position', 'relative');
                }
            }

            // Prevent text selection
            $button.css({
                'user-select': 'none',
                '-webkit-user-select': 'none',
                'touch-action': 'manipulation'
            });

            // Calculate progress percentage based on hold time
            const calculateProgress = (currentTime) => {
                if (settings.maxHoldTime) {
                    return Math.min(((currentTime - holdStartTime) / settings.maxHoldTime) * 100, 100);
                }
                return Math.min(((currentTime - holdStartTime) / 100) * 2, 100);
            };

            // Start holding
            const startHold = function(e) {
                if (isHolding) return;
                isHolding = true;
                holdStartTime = Date.now();

                $button.addClass(settings.holdClass);

                // Start hold timer
                holdTimeout = setTimeout(() => {
                    settings.onHoldStart.call($button, e);
                    
                    // Continuous hold callback
                    holdInterval = setInterval(() => {
                        const currentTime = Date.now();
                        const holdDuration = currentTime - holdStartTime;
                        const progress = calculateProgress(currentTime);
                        
                        if ($progressBar) {
                            $progressBar.css('width', progress + '%');
                        }
                        
                        settings.onHold.call($button, e, progress, holdDuration);

                        // Check if max hold time is reached
                        if (settings.maxHoldTime && holdDuration >= settings.maxHoldTime) {
                            settings.onMaxHold.call($button, e);
                            endHold(e);
                        }
                    }, 50);
                }, settings.holdTime);

                // Prevent context menu on long press for mobile
                e.preventDefault();
            };

            // End holding
            const endHold = function(e) {
                if (!isHolding) return;
                isHolding = false;

                $button.removeClass(settings.holdClass);
                if ($progressBar) {
                    $progressBar.css('width', '0%');
                }

                clearTimeout(holdTimeout);
                clearInterval(holdInterval);

                const holdDuration = Date.now() - holdStartTime;
                settings.onHoldEnd.call($button, e, holdDuration);
            };

            // Bind events
            $button
                .on('mousedown touchstart', startHold)
                .on('contextmenu', e => e.preventDefault());

            $(document)
                .on('mouseup touchend touchcancel', endHold);

            // Store cleanup function
            $button.data('longPressCleanup', function() {
                $button
                    .off('mousedown touchstart')
                    .off('contextmenu');
                $(document)
                    .off('mouseup touchend touchcancel');
                if ($progressBar) {
                    $progressBar.remove();
                }
            });
        });
    };

    // Method to destroy the plugin
    $.fn.longPressDestroy = function() {
        return this.each(function() {
            const $button = $(this);
            const cleanup = $button.data('longPressCleanup');
            if (cleanup) {
                cleanup();
                $button.removeData('longPressCleanup');
            }
        });
    };
})(jQuery);
