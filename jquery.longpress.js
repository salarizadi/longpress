/**
 *  Copyright (c) 2025
 *  @Version : 2.0.0
 *  @Author  : https://salarizadi.ir
 *  @Repository : https://github.com/salarizadi/longpress
 *  @Description: A jQuery plugin for handling long press events on both mobile and desktop devices.
 */

(function ($) {
    "use strict";

    // Store all active instances to ensure proper cleanup
    const activeInstances = new WeakMap();

    $.fn.longPress = function (options) {
        // Default settings
        const settings = $.extend(
            {
                holdTime: 500,
                maxHoldTime: null,
                holdClass: "holding",
                onHoldStart: () => {},
                onHold: () => {},
                onHoldEnd: () => {},
                onMaxHold: () => {},
                progressBar: false,
                progressBarClass: "button-hold-progress",
                throttleProgress: 16,
                touchMoveThreshold: 10,
                preventContextMenu: true
            },
            options
        );

        return this.each(function () {
            const $button = $(this);
            const instance = {
                isHolding: false,
                holdStartTime: null,
                initialTouch: null,
                initialMouse: null,
                animationFrameId: null,
                originalStyles: {},
                $progressBar: null,
                cleanup: null,
                promiseChain: Promise.resolve(),
                lastProgress: 0,
                holdTimeout: null,
                rightClickHolding: false // New flag for right-click holding
            };

            // Store original styles for cleanup
            [
                "user-select",
                "-webkit-user-select",
                "touch-action",
                "position"
            ].forEach((prop) => {
                instance.originalStyles[prop] = $button.css(prop);
            });

            // Setup progress bar
            if (settings.progressBar) {
                instance.$progressBar = $("<div>", {
                    class: settings.progressBarClass,
                    css: {
                        width: "0%",
                        height: "3px",
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        backgroundColor: "#4CAF50",
                        transition: "width 0.05s linear"
                    }
                });

                if ($button.css("position") === "static") {
                    $button.css("position", "relative");
                }
                $button.append(instance.$progressBar);
            }

            // Apply necessary styles
            $button.css({
                "user-select": "none",
                "-webkit-user-select": "none",
                "touch-action": "manipulation"
            });

            // Safe callback handler
            const safeCallback = async (callback, ...args) => {
                try {
                    await instance.promiseChain;
                    instance.promiseChain = instance.promiseChain
                        .then(() => Promise.resolve(callback.call($button, ...args)))
                        .catch((error) =>
                            console.error("LongPress callback error:", error)
                        );
                } catch (error) {
                    console.error("LongPress callback execution error:", error);
                }
            };

            // Progress calculation and update
            const updateProgress = () => {
                if (!instance.isHolding) return;

                const currentTime = Date.now();
                const holdDuration = currentTime - instance.holdStartTime;
                const progress = settings.maxHoldTime
                    ? Math.min((holdDuration / settings.maxHoldTime) * 100, 100)
                    : Math.min((holdDuration / 100) * 2, 100);

                if (Math.abs(progress - instance.lastProgress) >= 0.5) {
                    instance.lastProgress = progress;
                    if (instance.$progressBar) {
                        instance.$progressBar.css("width", `${progress}%`);
                    }
                    safeCallback(settings.onHold, null, progress, holdDuration);
                }

                if (settings.maxHoldTime && holdDuration >= settings.maxHoldTime) {
                    safeCallback(settings.onMaxHold);
                    endHold();
                    return;
                }

                instance.animationFrameId = requestAnimationFrame(updateProgress);
            };

            // Handle right-click specifically
            const handleContextMenu = function (e) {
                if (settings.preventContextMenu) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop event propagation
                }

                if (!instance.isHolding) {
                    startHold(e, true); // Pass true to indicate right-click
                }

                return false; // Prevent default context menu
            };

            // Start holding handler
            const startHold = function (e, isRightClick = false) {
                if (instance.isHolding) return;

                // Clear any existing timeout
                if (instance.holdTimeout) {
                    clearTimeout(instance.holdTimeout);
                }

                const evt = e.touches ? e.touches[0] : e;
                if (e.type === "mousedown" || isRightClick) {
                    instance.initialMouse = { x: evt.pageX, y: evt.pageY };
                    instance.rightClickHolding = isRightClick;
                } else {
                    instance.initialTouch = { x: evt.pageX, y: evt.pageY };
                }

                instance.isHolding = true;
                instance.holdStartTime = Date.now();
                instance.lastProgress = 0;

                $button.addClass(settings.holdClass);

                // Set timeout for hold start
                instance.holdTimeout = setTimeout(async () => {
                    if (instance.isHolding) {
                        await safeCallback(settings.onHoldStart, e);
                        if (instance.isHolding) {
                            updateProgress();
                        }
                    }
                }, settings.holdTime);

                // Only prevent default for touch events and right-clicks
                if (e.type === "touchstart" || isRightClick) {
                    e.preventDefault();
                }

                // Stop event propagation to prevent conflicts with Swiper
                e.stopPropagation();
            };

            // End holding handler
            const endHold = async function (e) {
                if (!instance.isHolding) return;

                clearTimeout(instance.holdTimeout);
                const holdDuration = Date.now() - instance.holdStartTime;
                instance.isHolding = false;
                instance.initialTouch = null;
                instance.initialMouse = null;
                instance.rightClickHolding = false;

                cancelAnimationFrame(instance.animationFrameId);
                $button.removeClass(settings.holdClass);

                if (instance.$progressBar) {
                    instance.$progressBar.css("width", "0%");
                }

                await safeCallback(settings.onHoldEnd, e, holdDuration);

                // Stop event propagation
                if (e) {
                    e.stopPropagation();
                }
            };

            // Mouse move handler
            const handleMouseMove = function (e) {
                if (!instance.isHolding) return;

                const initial = instance.initialMouse;
                if (!initial) return;

                const moveThreshold = settings.touchMoveThreshold;
                const deltaX = Math.abs(e.pageX - initial.x);
                const deltaY = Math.abs(e.pageY - initial.y);

                if (deltaX > moveThreshold || deltaY > moveThreshold) {
                    endHold(e);
                }

                // Stop event propagation
                e.stopPropagation();
            };

            // Touch move handler
            const handleTouchMove = function (e) {
                if (!instance.isHolding || !instance.initialTouch) return;

                const touch = e.touches[0];
                const moveThreshold = settings.touchMoveThreshold;
                const deltaX = Math.abs(touch.pageX - instance.initialTouch.x);
                const deltaY = Math.abs(touch.pageY - instance.initialTouch.y);

                if (deltaX > moveThreshold || deltaY > moveThreshold) {
                    endHold(e);
                }
            };

            // Bind events with namespaces and capture phase
            $button
                .on("mousedown.longpress", startHold)
                .on("touchstart.longpress", { passive: false }, startHold)
                .on("mousemove.longpress", handleMouseMove)
                .on("touchmove.longpress", { passive: true }, handleTouchMove)
                .on("contextmenu.longpress", handleContextMenu);

            // Global event binding for end events
            const $document = $(document);
            $document.on("mouseup.longpress mouseleave.longpress touchend.longpress touchcancel.longpress", (e) => {
                if (instance.isHolding) {
                    endHold(e);
                }
            }).on("visibilitychange.longpress", () => {
                if (document.hidden) {
                    endHold();
                }
            });

            // Cleanup function
            instance.cleanup = () => {
                endHold();
                clearTimeout(instance.holdTimeout);

                $button.off(".longpress").css(instance.originalStyles);

                if (instance.$progressBar) {
                    instance.$progressBar.remove();
                }

                $document.off(".longpress");
                activeInstances.delete($button[0]);
            };

            // Store instance data
            activeInstances.set($button[0], instance);
        });
    };

    // Destroy method
    $.fn.longPressDestroy = function () {
        return this.each(function () {
            const instance = activeInstances.get(this);
            if (instance && instance.cleanup) {
                instance.cleanup();
            }
        });
    };
})(jQuery);
