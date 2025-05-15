/**
 *  Copyright (c) 2025
 *  @Version : 2.0.1
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
                onClick: () => {},
                progressBar: false,
                progressBarClass: "button-hold-progress",
                throttleProgress: 16,
                touchMoveThreshold: 3,
                preventContextMenu: true,
                enableSwipe: false,
                onSwipe: () => {}
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
                rightClickHolding: false,
                isSwiping: false,
                isScrolling: false,
                touchStartTime: null,
                hasMoved: false,
                clickHandled: false
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
                "touch-action": "pan-x pan-y"
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

            // End holding handler
            const endHold = async function (e) {
                if (!instance.isHolding) return;

                clearTimeout(instance.holdTimeout);
                const holdDuration = Date.now() - instance.holdStartTime;
                const touchDuration = instance.touchStartTime ? Date.now() - instance.touchStartTime : 0;

                instance.isHolding = false;
                const wasMoved = instance.hasMoved;
                const wasScrolling = instance.isScrolling;

                cancelAnimationFrame(instance.animationFrameId);
                $button.removeClass(settings.holdClass);

                if (instance.$progressBar) {
                    instance.$progressBar.css("width", "0%");
                }

                // Handle click vs hold vs scroll
                if (!instance.clickHandled && !wasMoved && !wasScrolling && touchDuration < 200) {
                    // Quick tap - trigger click
                    instance.clickHandled = true;
                    await safeCallback(settings.onClick, e, holdDuration);
                } else if (holdDuration >= settings.holdTime &&
                    ((!wasScrolling) || (!settings.enableSwipe && holdDuration >= settings.holdTime))) {
                    // Long press completed - trigger even if moved when swipe is disabled
                    // Only prevent default if the event is cancelable
                    if (e && e.cancelable) {
                        e.preventDefault();
                    }
                    await safeCallback(settings.onHoldEnd, e, holdDuration);
                }

                // Reset states
                instance.initialTouch = null;
                instance.initialMouse = null;
                instance.rightClickHolding = false;
                instance.isSwiping = false;
                instance.hasMoved = false;
                instance.isScrolling = false;

                // Don't reset touchStartTime immediately to prevent double events
                setTimeout(() => {
                    if (!instance.isHolding) {
                        instance.touchStartTime = null;
                        instance.clickHandled = false;
                    }
                }, 500);
            };

            // Handle right-click specifically
            const handleContextMenu = function (e) {
                if (settings.preventContextMenu && e.cancelable) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                if (!instance.isHolding) {
                    startHold(e, true);
                }

                return false;
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
                    // Ignore mousedown if it was triggered right after a touch event
                    if (instance.touchStartTime && (Date.now() - instance.touchStartTime) < 500) {
                        return;
                    }
                    instance.initialMouse = { x: evt.pageX, y: evt.pageY };
                    instance.rightClickHolding = isRightClick;
                    instance.touchStartTime = Date.now();
                } else {
                    instance.initialTouch = { x: evt.pageX, y: evt.pageY };
                    instance.touchStartTime = Date.now();
                }

                instance.isHolding = true;
                instance.holdStartTime = Date.now();
                instance.lastProgress = 0;
                instance.hasMoved = false;
                instance.isScrolling = false;
                instance.clickHandled = false;

                $button.addClass(settings.holdClass);

                // Set timeout for hold start
                instance.holdTimeout = setTimeout(async () => {
                    if (instance.isHolding && !instance.hasMoved) {
                        if (e && e.cancelable) {
                            e.preventDefault();
                        }
                        await safeCallback(settings.onHoldStart, e);
                        if (instance.isHolding) {
                            updateProgress();
                        }
                    }
                }, settings.holdTime);

                // Only prevent default for right-clicks
                if (isRightClick) {
                    e.preventDefault();
                }
            };

            // Touch move handler
            const handleTouchMove = function (e) {
                if (!instance.isHolding || !instance.initialTouch) return;

                const moveThreshold = settings.touchMoveThreshold;
                const touch = e.touches[0];
                const deltaX = touch.pageX - instance.initialTouch.x;
                const deltaY = touch.pageY - instance.initialTouch.y;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                const currentTime = Date.now();
                const holdDuration = currentTime - instance.holdStartTime;

                // Mark as moved if threshold exceeded
                if (absDeltaX > moveThreshold || absDeltaY > moveThreshold) {
                    instance.hasMoved = true;
                }

                // Handle swipe first if enabled
                if (settings.enableSwipe && instance.hasMoved) {
                    let direction = '';
                    // If horizontal movement is greater than vertical
                    if (absDeltaX > absDeltaY) {
                        direction = deltaX > 0 ? 'right' : 'left';
                        instance.isSwiping = true;
                        safeCallback(settings.onSwipe, e, direction, { deltaX, deltaY });
                        endHold(e);
                        return;
                    }
                    // If vertical movement is greater than horizontal
                    else if (absDeltaY > moveThreshold) {
                        direction = deltaY > 0 ? 'down' : 'up';
                        // If swipe is enabled, check for swipe first
                        if (absDeltaY > moveThreshold * 1.5) {
                            instance.isSwiping = true;
                            instance.isScrolling = false;
                            safeCallback(settings.onSwipe, e, direction, { deltaX, deltaY });
                            endHold(e);
                            return;
                        }
                        // Otherwise treat as scroll
                        else {
                            instance.isScrolling = true;
                            return;
                        }
                    }
                }
                // If not a swipe, check for scroll
                else if (absDeltaY > absDeltaX && absDeltaY > moveThreshold) {
                    instance.isScrolling = true;
                    return;
                }

                // Continue hold if swipe is disabled and we've exceeded hold time
                if (!settings.enableSwipe && holdDuration >= settings.holdTime) {
                    updateProgress();
                }
            };

            // Mouse move handler
            const handleMouseMove = function (e) {
                if (!instance.isHolding || !instance.initialMouse) return;

                const moveThreshold = settings.touchMoveThreshold;
                const deltaX = e.pageX - instance.initialMouse.x;
                const deltaY = e.pageY - instance.initialMouse.y;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                const currentTime = Date.now();
                const holdDuration = currentTime - instance.holdStartTime;

                if (absDeltaX > moveThreshold || absDeltaY > moveThreshold) {
                    instance.hasMoved = true;
                }

                if (settings.enableSwipe && instance.hasMoved) {
                    let direction = '';
                    if (absDeltaX > absDeltaY) {
                        direction = deltaX > 0 ? 'right' : 'left';
                    } else if (absDeltaY > moveThreshold) {
                        direction = deltaY > 0 ? 'down' : 'up';
                    }

                    if (direction) {
                        instance.isSwiping = true;
                        safeCallback(settings.onSwipe, e, direction, { deltaX, deltaY });
                        endHold(e);
                    }
                }

                // Continue hold if swipe is disabled and we've exceeded hold time
                if ((!settings.enableSwipe || !instance.hasMoved) && holdDuration >= settings.holdTime) {
                    updateProgress();

                    // If significant movement detected after hold started, end the hold
                    if (absDeltaX > moveThreshold * 3 || absDeltaY > moveThreshold * 3) {
                        endHold(e);
                    }
                }
            };

            // Bind events with namespaces and capture phase
            $button
                .on("mousedown.longpress", startHold)
                .on("touchstart.longpress", startHold)
                .on("mousemove.longpress", handleMouseMove)
                .on("touchmove.longpress", handleTouchMove)
                .on("contextmenu.longpress", handleContextMenu);

            // Global event binding for end events
            const $document = $(document);
            $document.on("mouseup.longpress touchend.longpress touchcancel.longpress", (e) => {
                if (instance.isHolding) {
                    endHold(e);
                }
            }).on("mouseleave.longpress", (e) => {
                // For mouseleave, only end if the mouse actually leaves the document
                if (instance.isHolding &&
                    (e.relatedTarget === null || !$.contains(document.documentElement, e.relatedTarget))) {
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
