
        // ⚡ PERFORMANCE OPTIMIZATION: Lazy load Motion One after LCP
        // This reduces initial bundle blocking and improves LCP by ~2-3s

        let animate; // Will be loaded dynamically

        // Temporary fallback using native Web Animations API
        function animateFallback(element, keyframes, options) {
            if (!element) return;

            const duration = (options.duration || 0) * 1000; // Convert to ms
            const easing = options.easing || 'linear';

            // Build keyframes for Web Animations API
            const webKeyframes = [];

            // Handle different keyframe formats
            if (typeof keyframes === 'object') {
                const frame = {};
                for (const prop in keyframes) {
                    if (prop === 'x') {
                        frame.transform = `translateX(${keyframes.x}px)`;
                    } else if (prop === 'width' || prop === 'height') {
                        frame[prop] = keyframes[prop];
                    } else if (prop === 'marginLeft' || prop === 'marginTop') {
                        frame[prop] = keyframes[prop];
                    } else {
                        frame[prop] = keyframes[prop];
                    }
                }
                webKeyframes.push(frame);
            }

            // Use native Web Animations API
            return element.animate(webKeyframes, {
                duration: duration,
                easing: easing,
                fill: 'forwards'
            });
        }

        // Use fallback initially
        animate = animateFallback;

        // Lazy load Motion One library after page is interactive
        async function loadMotionOne() {
            try {
                const motionModule = await import('https://cdn.jsdelivr.net/npm/motion@10.18.0/+esm');
                animate = motionModule.animate;
                console.log('[CAROUSEL] Motion One loaded');
                return true;
            } catch (err) {
                console.warn('[CAROUSEL] Failed to load Motion One, using fallback:', err);
                return false;
            }
        }

        // Load Motion One after a delay to prioritize LCP
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadMotionOne(), { timeout: 2000 });
        } else {
            setTimeout(() => loadMotionOne(), 1000);
        }

        // ===== DATA =====
        // Note: Image URLs are now defined in HTML with proper srcset/sizes
        // This data structure is only used for prompts and metadata

        const prompts = {
            'Photoshoot': 'A luxury fashion campaign portrait of a confident woman in a blush pink tailored suit with a bralette underneath. She stands against a neutral beige fabric backdrop with soft shadows adding dimension. Her gaze is powerful, hair styled effortlessly sleek. Lighting is soft but directional, highlighting the satin sheen of the suit fabric. Ultra-realistic textures, clean editorial finish, cinematic luxury advertising style.',
            'Ad Creative': 'A playful food campaign visual featuring two colorful eclairs - one chocolate, one strawberry - floating on a pastel blue background. Repeating text pattern reads "So Yum" in centre in all caps white sans-serif font. Soft shadows and realistic textures on the pastries. Fun, graphic, and modern lifestyle branding aesthetic.',
            'Poster': 'A retro-inspired sneaker poster ad featuring a pair of Nike Dunk High sneakers in burnt orange and white, floating mid-air against a bright blue sky with soft white clouds. The sneakers are shown in photorealistic detail with visible leather texture, stitching, and laces, arranged to highlight both the side profile and top view. The composition is minimalist, with the Nike swoosh logo and bold white text placed subtly around the frame, alongside smaller retro tagline text with a slightly blurred, print-like effect. The overall style has a vintage sports ad aesthetic with a dreamy, nostalgic mood, enhanced by a grainy overlay and soft tones, evoking the feel of classic 90s sneaker campaigns',
            'Digital Art': 'A minimalist surreal scene featuring a human silhouette made of translucent water standing on a dry cracked desert floor. The figure mirrors the sky above, reflecting clouds and light. Colors are muted - soft ivory, desaturated cyan, and warm beige. Lighting is cinematic and diffused. Symbolic, emotional, and deeply aesthetic digital artwork.',
            'Social media': 'A lifestyle beverage ad featuring a chilled Corona-style beer bottle leaning casually against a carved sandy surface with soft ripples, surrounded by freshly sliced limes glistening with juice. Golden sunlight spills across the scene, illuminating condensation droplets and highlighting the rich amber tones of the beer. The background features smooth, sunlit sand tones for a relaxed beach-day feel. Overlay elegant, minimalist text at the top that reads "Taste the Sun" in bold modern sans-serif, with a smaller tagline below: "Golden moments. Cold beer. Endless summer." The overall image is cinematic, hyper-detailed, and refreshing - a premium lifestyle campaign visual designed for social media.',
            'Remove watermarks': 'Remove the watermark from this image',
            'Logo': 'A minimalist logo design for a luxury skincare brand named "LUNEA". The logo features thin modern serif typography paired with a delicate crescent moon motif integrated into the text. Only two colors - moss green and ivory. Clean composition with balanced negative space on a textured off-white background. Elegant, calm, and modern wellness-inspired identity.',
            'Remove background': 'Remove background of this image',
            'Upscale': 'Upscale this image'
        };

        // Helper function to get slide data
        function getSlideData(slideElement) {
            const label = slideElement.getAttribute('data-label');
            const injectUrl = slideElement.getAttribute('data-inject-url') || '';
            const prompt = prompts[label] || '';
            const slideIndex = slideElement.getAttribute('data-slide-index');

            return {
                label,
                injectUrl,
                prompt,
                slideIndex
            };
        }

        // Helper function to get current active slide data
        function getActiveSlideData() {
            const originalIndex = ((activeIndex - originalSlideCount) % originalSlideCount + originalSlideCount) % originalSlideCount;
            const activeSlide = slideElements[activeIndex];
            return getSlideData(activeSlide);
        }

        // Smooothy-inspired lerp and damp functions
        const lerp = (start, end, factor) => start + (end - start) * factor;

        const damp = (current, target, smoothing, deltaTime) => {
            return lerp(current, target, 1 - Math.exp(-smoothing * deltaTime));
        };

        // Detect if device is mobile
        const isMobile = window.innerWidth <= 768;

        // Configuration
        const CONFIG = {
            minOpacity: isMobile ? 0.1 : 1,
            maxOpacity: 1.0,
            minScale: 0.7,
            maxScale: 1.0,
            scaleDistance: 2,
            slideSpacing: 320, // Spacing between slide centers
            animationDuration: 0.9,
            animationEasing: 'ease', // Smooth easing instead of bounce
            // Different dimensions for active vs inactive
            inactiveWidth: 328,
            inactiveHeight: 437,
            activeWidth: isMobile ? 328 : 748,
            activeHeight: 437,
            // Autoplay settings
            autoplayEnabled: true,
            autoplayDelay: 3000, // 3 seconds between slides
            // Momentum physics settings
            momentumEnabled: true,
            momentumFriction: 0.78,        // Higher = slides further (0-1)
            momentumMinVelocity: 0.25,      // Minimum speed to trigger momentum (px/ms)
            // Smooothy-inspired smooth settling
            lerpFactor: 0.2,               // Smoothness for settling (0.1-0.3)
            snapLerpFactor: 0.55,           // Faster snap for responsive feel (0.15-0.25)
            useSmoothSettling: false,        // Enable smooth lerp-based settling
        };

        let activeIndex = 0;
        const slideElements = [];
        let originalSlideCount = 0; // Will be set after reading HTML slides

        // Drag state
        let isDragging = false;
        let isMomentum = false; // Track momentum phase separately
        let isTransitioning = false; // Prevent navigation during loop reset
        let isSettling = false; // Track smooth settling phase
        let dragStartX = 0;
        let dragCurrentX = 0;
        let dragStartTime = 0;
        let lastDragX = 0;      // Track for velocity calculation
        let lastDragTime = 0;   // Track for velocity calculation

        // Smooth settling state (Smooothy-inspired)
        let targetSlideIndex = 0;
        let settlingStartTime = 0;
        let settlingAnimationFrame = null;

        // Store current interpolated values for each slide
        const slideStates = new Map(); // Map<slideElement, {x, opacity, width, height, marginLeft, marginTop}>

        // Typewriter animation state
        let typewriterTimeout = null;
        let currentTypewriterPrompt = '';
        let isTypewriterActive = false;
        let userHasTakenControl = false; // Track if user has started typing
        let injectedSlideKeys = new Set(); // Track which slides have had images injected

        // Typewriter animation function
        function typewriterEffect(text, speed = 30) {
            // Don't start typewriter if user has taken control
            if (userHasTakenControl) {
                // Just set the full prompt directly without animation
                currentTypewriterPrompt = text;
                if (window.searchFeature?.setPrompt) {
                    window.searchFeature.setPrompt(text, false);
                }
                return;
            }

            // Clear any existing typewriter animation
            if (typewriterTimeout) {
                clearTimeout(typewriterTimeout);
                typewriterTimeout = null;
            }

            // Stop if text is empty or search feature not available
            if (!text || !window.searchFeature?.setPrompt) return;

            // Store the full prompt and mark typewriter as active
            currentTypewriterPrompt = text;
            isTypewriterActive = true;

            // Notify prompt box that typewriter is active
            if (window.searchFeature?.setTypewriterActive) {
                window.searchFeature.setTypewriterActive(true);
            }

            let currentIndex = 0;

            function typeNextChar() {
                if (currentIndex <= text.length) {
                    const currentText = text.substring(0, currentIndex);
                    window.searchFeature.setPrompt(currentText, true); // true = isTypewriter
                    currentIndex++;
                    typewriterTimeout = setTimeout(typeNextChar, speed);
                } else {
                    // Typewriter complete
                    isTypewriterActive = false;
                    if (window.searchFeature?.setTypewriterActive) {
                        window.searchFeature.setTypewriterActive(false);
                    }
                }
            }

            // Start with empty and begin typing
            window.searchFeature.setPrompt('', true);
            typeNextChar();
        }

        // Stop typewriter animation
        function stopTypewriter() {
            if (typewriterTimeout) {
                clearTimeout(typewriterTimeout);
                typewriterTimeout = null;
            }
            isTypewriterActive = false;
            if (window.searchFeature?.setTypewriterActive) {
                window.searchFeature.setTypewriterActive(false);
            }
        }

        // Get full prompt for typewriter (used by prompt box)
        function getFullPrompt() {
            return currentTypewriterPrompt;
        }

        // Mark that user has taken control (called when user types in prompt box)
        function markUserControl() {
            console.log('[CAROUSEL] User has taken control');
            userHasTakenControl = true;
            stopTypewriter();
            pauseAutoplay();
        }

        // Reset user control (called when prompt box is cleared or reset)
        function resetUserControl() {
            console.log('[CAROUSEL] Resetting user control');
            userHasTakenControl = false;
            resumeAutoplay();
        }

        // Interpolation functions
        function getScale(distance) {
            const absDistance = Math.abs(distance);
            if (absDistance === 0) return CONFIG.maxScale;

            const factor = Math.min(absDistance / CONFIG.scaleDistance, 1);
            return CONFIG.maxScale - (CONFIG.maxScale - CONFIG.minScale) * factor;
        }

        function getOpacity(distance) {
            const absDistance = Math.abs(distance);
            if (absDistance === 0) return CONFIG.maxOpacity;

            const factor = Math.min(absDistance / CONFIG.scaleDistance, 1);
            return CONFIG.maxOpacity - (CONFIG.maxOpacity - CONFIG.minOpacity) * factor;
        }

        function getXPosition(distance) {
            return distance * CONFIG.slideSpacing;
        }

        // Calculate dynamic X position maintaining constant gaps
        function getXPositionDynamic(index, activeIndex, dragging = false, dragStartActive = activeIndex) {
            const gap = 12; // Constant edge-to-edge gap between ALL slides

            if (index === activeIndex) {
                return 0;
            }

            // Calculate cumulative position by walking from active to target
            let position = 0;

            if (index < activeIndex) {
                // Walking left from active
                for (let i = activeIndex - 1; i >= index; i--) {
                    let currentWidth, nextWidth;

                    if (dragging) {
                        // During drag: the drag-start active slide stays large
                        currentWidth = i === dragStartActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                        nextWidth = (i + 1) === dragStartActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    } else {
                        // Current slide (i) and next slide (i+1 which is closer to active)
                        currentWidth = i === activeIndex ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                        nextWidth = (i + 1) === activeIndex ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    }

                    position -= (nextWidth / 2) + gap + (currentWidth / 2);
                }
            } else {
                // Walking right from active
                for (let i = activeIndex + 1; i <= index; i++) {
                    let currentWidth, prevWidth;

                    if (dragging) {
                        // During drag: the drag-start active slide stays large
                        currentWidth = i === dragStartActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                        prevWidth = (i - 1) === dragStartActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    } else {
                        // Current slide (i) and previous slide (i-1 which is closer to active)
                        currentWidth = i === activeIndex ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                        prevWidth = (i - 1) === activeIndex ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    }

                    position += (prevWidth / 2) + gap + (currentWidth / 2);
                }
            }

            return position;
        }

        function getZIndex(distance) {
            return 100 - Math.abs(Math.round(distance * 10));
        }

        // Calculate how many slides are visible based on viewport width
        function getVisibleSlideCount() {
            const viewportWidth = window.innerWidth;
            const slideWidth = CONFIG.inactiveWidth;
            const gap = 12;

            // Calculate how many slides fit in viewport
            // Add buffer of 2 for slides partially visible on edges
            const visibleCount = Math.ceil(viewportWidth / (slideWidth + gap)) + 2;

            // Return half of visible count as the hydration radius
            // This ensures we load all visible slides + some buffer
            return Math.max(2, Math.ceil(visibleCount / 2));
        }

        // Update all slide positions with optional drag offset
        function updateSlidePositions(newActiveIndex, dragOffset = 0) {
            // PERFORMANCE: Batch DOM reads first, then writes
            const positions = [];

            // Calculate dynamic hydration radius based on viewport
            const hydrationRadius = getVisibleSlideCount();

            // Calculate virtual center based on drag offset for proper image loading during drag
            const virtualCenter = dragOffset / CONFIG.slideSpacing;
            const visualActiveIndex = newActiveIndex - virtualCenter;

            // READ phase - gather all calculations
            slideElements.forEach((slide, index) => {
                const distance = index - newActiveIndex;
                let isActive;
                if (isDragging) {
                    isActive = index === dragStartActiveIndex;
                } else {
                    isActive = distance === 0;
                }

                const baseX = getXPositionDynamic(index, newActiveIndex, isDragging, dragStartActiveIndex);
                const x = baseX + dragOffset;
                const opacity = getOpacity(distance);
                const zIndex = getZIndex(distance);
                const width = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                const height = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;

                // Calculate visual distance for hydration (accounts for drag offset)
                const visualDistance = Math.abs(index - visualActiveIndex);

                positions.push({ slide, index, distance, isActive, x, opacity, zIndex, width, height, visualDistance });
            });

            // WRITE phase - apply all changes
            positions.forEach(({ slide, x, opacity, zIndex, width, height, visualDistance }) => {
                slide.style.zIndex = zIndex.toString();

                // Hydrate images based on visual position (what's actually in viewport during drag)
                // Use dynamic radius based on viewport width
                const shouldHydrate = visualDistance <= hydrationRadius;
                const img = slide.querySelector('img');
                if (img && shouldHydrate) {
                    hydrateImg(img);
                }

                // PERFORMANCE: Add will-change hint for actively transitioning slides
                const shouldAnimatePosition = !isDragging && !isMomentum;
                if (shouldAnimatePosition) {
                    slide.style.willChange = 'transform, opacity, width, height';
                } else {
                    slide.style.willChange = 'auto';
                }

                const positionOptions = shouldAnimatePosition ? {
                    duration: CONFIG.animationDuration * 0.6,
                    easing: CONFIG.animationEasing,
                } : {
                    duration: 0,
                    easing: 'linear',
                };

                // Always update position
                animate(slide, {
                    x,
                    opacity
                }, positionOptions);

                // Size: only animate when NOT dragging/momentum
                if (!isDragging && !isMomentum) {
                    const sizeOptions = {
                        duration: CONFIG.animationDuration * 0.6,
                        easing: CONFIG.animationEasing,
                    };

                    animate(
                        slide,
                        {
                            width: `${width}px`,
                            height: `${height}px`,
                            marginLeft: `${-width / 2}px`,
                            marginTop: `${-height / 2}px`,
                        },
                        sizeOptions
                    );
                }
            });

            // Update UI only if not dragging
            if (!isDragging) {
                updateControls(newActiveIndex);
            }
        }

        // Update controls state
        function updateControls(index) {
            activeIndex = index;

            // Calculate the original slide index (accounting for clones)
            const originalIndex = ((index - originalSlideCount) % originalSlideCount + originalSlideCount) % originalSlideCount;

            // Never disable buttons in infinite loop
            document.getElementById('prevBtn').disabled = false;
            document.getElementById('nextBtn').disabled = false;

            // Update indicators based on original index
            document.querySelectorAll('.indicator').forEach((indicator, i) => {
                indicator.classList.toggle('active', i === originalIndex);
            });

            // Get and log active slide data (for debugging/integration purposes)
            const slideData = getActiveSlideData();
            console.log('Active Slide:', slideData);

            // Clear carousel-injected images when slide changes in demo mode
            if (!userHasTakenControl && window.searchFeature?.clearImages) {
                console.log('[CAROUSEL] Demo mode - clearing carousel images for new slide');
                window.searchFeature.clearImages('carousel');
            }

            // Update prompt box with active slide's prompt using typewriter animation
            if (slideData.prompt && window.searchFeature?.setPrompt) {
                typewriterEffect(slideData.prompt, 30); // 30ms per character
            }

            // Update debug with original index
            const debugElement = document.getElementById('debug');
            if (debugElement) {
                debugElement.textContent = `Active Index: ${originalIndex + 1} / ${originalSlideCount}`;
            }
        }

        // Navigation
        function goToSlide(index) {
            if (isTransitioning) return; // Prevent navigation during reset only

            // Cancel any ongoing settling animation
            if (isSettling && settlingAnimationFrame) {
                cancelAnimationFrame(settlingAnimationFrame);
                isSettling = false;
            }

            activeIndex = index;
            dragStartActiveIndex = index; // Keep in sync
            targetSlideIndex = index;

            if (CONFIG.useSmoothSettling) {
                // Use smooth lerp-based settling for consistent animation
                startSmoothSettling();
            } else {
                // Use Motion One animation (original behavior)
                updateSlidePositions(activeIndex);

                // BUG FIX: Reset position AFTER animation completes (not during)
                // This prevents visible jumps during the animation
                const isClone = (index < originalSlideCount) || (index >= originalSlideCount * 2);
                if (isClone) {
                    const animationDuration = CONFIG.animationDuration * 0.6 * 1000; // Convert to ms
                    setTimeout(() => {
                        checkAndResetLoopPosition();
                    }, animationDuration);
                }
            }
        }

        // Check and reset loop position after animation completes
        function checkAndResetLoopPosition() {
            const isClone = (activeIndex < originalSlideCount) || (activeIndex >= originalSlideCount * 2);

            if (!isClone || isDragging || isMomentum || isSettling || isTransitioning) {
                return; // Not on a clone or actively moving
            }

            let newIndex;
            if (activeIndex < originalSlideCount) {
                // Going backward: clone → last original
                newIndex = activeIndex + originalSlideCount;
                console.log('[CAROUSEL] Seamless backward loop:', activeIndex, '→', newIndex);
            } else {
                // Going forward: clone → first original
                newIndex = activeIndex - originalSlideCount;
                console.log('[CAROUSEL] Seamless forward loop:', activeIndex, '→', newIndex);
            }

            // Block transitions during reset
            isTransitioning = true;

            // Update indices
            activeIndex = newIndex;
            dragStartActiveIndex = newIndex;
            targetSlideIndex = newIndex;

            // Instantly reposition all slides using Motion One (smoother than direct style manipulation)
            const hydrationRadius = getVisibleSlideCount();

            slideElements.forEach((slide, slideIndex) => {
                const distance = slideIndex - newIndex;
                const isActive = distance === 0;
                const baseX = getXPositionDynamic(slideIndex, newIndex, false);
                const opacity = getOpacity(distance);
                const width = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                const height = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;
                const zIndex = getZIndex(distance);

                slide.style.zIndex = zIndex.toString();

                // Hydrate images based on viewport-aware radius
                const shouldHydrate = Math.abs(distance) <= hydrationRadius;
                const img = slide.querySelector('img');
                if (img && shouldHydrate) {
                    hydrateImg(img);
                }

                // Use Motion One with duration 0 for instant, smooth repositioning
                animate(
                    slide,
                    {
                        x: baseX,
                        opacity: opacity,
                        width: `${width}px`,
                        height: `${height}px`,
                        marginLeft: `${-width / 2}px`,
                        marginTop: `${-height / 2}px`,
                    },
                    { duration: 0 }
                );
            });

            // Update indicators only (DON'T trigger typewriter or content changes)
            const originalIndex = ((newIndex - originalSlideCount) % originalSlideCount + originalSlideCount) % originalSlideCount;
            document.querySelectorAll('.indicator').forEach((indicator, i) => {
                indicator.classList.toggle('active', i === originalIndex);
            });

            // Re-enable transitions
            setTimeout(() => {
                isTransitioning = false;
            }, 50);
        }

        function goToPrev() {
            stopTypewriter();

            // Calculate target index
            let targetIndex = activeIndex - 1;

            // BUG FIX: If we would land on a clone, wrap to the equivalent original instead
            if (targetIndex < originalSlideCount) {
                // Would land on clone before → jump to last original
                targetIndex = targetIndex + originalSlideCount;
                console.log('[CAROUSEL] Button prev wrap: avoiding clone, jumping to', targetIndex);
            }

            goToSlide(targetIndex);
        }

        function goToNext() {
            stopTypewriter();

            // Calculate target index
            let targetIndex = activeIndex + 1;

            // BUG FIX: If we would land on a clone, wrap to the equivalent original instead
            if (targetIndex >= originalSlideCount * 2) {
                // Would land on clone after → jump to first original
                targetIndex = targetIndex - originalSlideCount;
                console.log('[CAROUSEL] Button next wrap: avoiding clone, jumping to', targetIndex);
            }

            goToSlide(targetIndex);
        }

        // Track the slide that was active when drag started
        let dragStartActiveIndex = activeIndex;

        // Autoplay state
        let autoplayTimer = null;
        let isAutoplayPaused = false;

        // Autoplay functions
        function startAutoplay() {
            if (!CONFIG.autoplayEnabled) return;

            stopAutoplay(); // Clear any existing timer

            if (!isAutoplayPaused) {
                autoplayTimer = setInterval(() => {
                    goToNext();
                }, CONFIG.autoplayDelay);
            }
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        function pauseAutoplay() {
            isAutoplayPaused = true;
            stopAutoplay();
        }

        function resumeAutoplay() {
            isAutoplayPaused = false;
            startAutoplay();
        }

        // Drag handlers
        function handleDragStart(e) {
            // Don't start new drag while momentum is active
            if (isMomentum) return;

            isDragging = true;
            dragStartActiveIndex = activeIndex; // Remember which slide was active
            dragStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            dragCurrentX = dragStartX;
            dragStartTime = Date.now();
            lastDragX = dragStartX;
            lastDragTime = dragStartTime;

            document.body.style.cursor = 'grabbing';

            // Stop typewriter when user starts dragging
            stopTypewriter();

            // Pause autoplay when user interacts
            pauseAutoplay();
        }

        function handleDragMove(e) {
            if (!isDragging) return;

            e.preventDefault();

            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const currentTime = Date.now();

            dragCurrentX = currentX;

            // Update velocity tracking (keep last position from 100ms ago for better velocity calculation)
            if (currentTime - lastDragTime > 100) {
                lastDragX = currentX;
                lastDragTime = currentTime;
            }

            const dragOffset = currentX - dragStartX;

            // Update slide states during drag for smooth transition to settling
            slideElements.forEach((slide, index) => {
                const distance = index - activeIndex;
                const isActive = index === dragStartActiveIndex;
                const baseX = getXPositionDynamic(index, activeIndex, true, dragStartActiveIndex);
                const x = baseX + dragOffset;
                const width = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                const height = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;
                const opacity = getOpacity(distance);

                // Update slide state for smooth settling later
                slideStates.set(slide, {
                    x: x,
                    opacity: opacity,
                    width: width,
                    height: height,
                    marginLeft: -width / 2,
                    marginTop: -height / 2,
                });
            });

            // Update positions with drag offset
            updateSlidePositions(activeIndex, dragOffset);
        }

        function handleDragEnd(e) {
            if (!isDragging) return;

            document.body.style.cursor = '';

            const dragOffset = dragCurrentX - dragStartX;
            const timeSinceLastUpdate = Date.now() - lastDragTime;

            // Calculate velocity (px per ms) over the tracked period
            const velocity = (dragCurrentX - lastDragX) / Math.max(timeSinceLastUpdate, 1);

            if (CONFIG.momentumEnabled && Math.abs(velocity) > CONFIG.momentumMinVelocity) {
                // Apply momentum physics - keep isDragging true during momentum
                isMomentum = true;
                applyMomentum(velocity, dragOffset);
            } else {
                // No momentum - just snap to nearest
                isDragging = false;
                snapToNearest(dragOffset);
            }
        }

        // Apply momentum-based sliding with friction
        function applyMomentum(initialVelocity, currentOffset) {
            let velocity = initialVelocity;
            let offset = currentOffset;
            let animationFrame;

            const momentumStep = () => {
                // Apply friction - reduces velocity each frame
                velocity *= CONFIG.momentumFriction;

                // Update offset based on velocity (assuming ~60fps)
                offset += velocity * 16; // 16ms per frame

                // Calculate which slide would be closest with this offset
                let potentialNearestIndex = dragStartActiveIndex;
                let minDistance = Infinity;

                for (let i = 0; i < slideElements.length; i++) {
                    const basePosition = getXPositionDynamic(i, activeIndex, true, dragStartActiveIndex);
                    const slidePosition = basePosition + offset;
                    const absDistance = Math.abs(slidePosition);

                    if (absDistance < minDistance) {
                        minDistance = absDistance;
                        potentialNearestIndex = i;
                    }
                }

                // Check if we're about to overshoot into clone territory
                const wouldOvershoot = potentialNearestIndex < originalSlideCount ||
                    potentialNearestIndex >= originalSlideCount * 2;

                // Continue if velocity is significant
                if (Math.abs(velocity) > CONFIG.momentumMinVelocity) {
                    // Update positions during momentum (still in "dragging" mode)
                    updateSlidePositions(activeIndex, offset);
                    animationFrame = requestAnimationFrame(momentumStep);
                } else {
                    // Momentum finished - transition to smooth settling
                    isDragging = false;
                    isMomentum = false;

                    // Find nearest and use smooth settling
                    let nearestIndex = dragStartActiveIndex;
                    let minDist = Infinity;

                    for (let i = 0; i < slideElements.length; i++) {
                        const basePosition = getXPositionDynamic(i, dragStartActiveIndex, true, dragStartActiveIndex);
                        const slidePosition = basePosition + offset;
                        const absDistance = Math.abs(slidePosition);

                        // Add a small bias for the original slides to prevent flickering at loop points
                        const bias = (i >= originalSlideCount && i < originalSlideCount * 2) ? 0.95 : 1.0;
                        const biasedDistance = absDistance * bias;

                        if (biasedDistance < minDist) {
                            minDist = biasedDistance;
                            nearestIndex = i;
                        }
                    }

                    targetSlideIndex = nearestIndex;
                    activeIndex = nearestIndex;
                    dragStartActiveIndex = nearestIndex;

                    if (CONFIG.useSmoothSettling) {
                        startSmoothSettling();
                    } else {
                        updateSlidePositions(nearestIndex);

                        // Resume autoplay if user hasn't taken control
                        if (!userHasTakenControl) {
                            resumeAutoplay();
                        }

                        // BUG FIX: Reset position AFTER animation completes
                        const isClone = (nearestIndex < originalSlideCount) || (nearestIndex >= originalSlideCount * 2);
                        if (isClone) {
                            const animationDuration = CONFIG.animationDuration * 0.6 * 1000; // Convert to ms
                            setTimeout(() => {
                                checkAndResetLoopPosition();
                            }, animationDuration);
                        }
                    }
                }
            };

            animationFrame = requestAnimationFrame(momentumStep);
        }

        // Snap to nearest slide without momentum
        function snapToNearest(dragOffset) {
            // Calculate which slide is now closest to center
            let nearestIndex = activeIndex;
            let minDistance = Infinity;

            for (let i = 0; i < slideElements.length; i++) {
                const basePosition = getXPositionDynamic(i, activeIndex, true, dragStartActiveIndex);
                const slidePosition = basePosition + dragOffset;
                const absDistance = Math.abs(slidePosition);

                // Add a small bias for the original slides (middle set) to prevent picking clones prematurely
                const bias = (i >= originalSlideCount && i < originalSlideCount * 2) ? 0.95 : 1.0;
                const biasedDistance = absDistance * bias;

                if (biasedDistance < minDistance) {
                    minDistance = biasedDistance;
                    nearestIndex = i;
                }
            }

            // Update active index and reset drag start index
            targetSlideIndex = nearestIndex;
            activeIndex = nearestIndex;
            dragStartActiveIndex = nearestIndex; // IMPORTANT: Reset for next interaction

            if (CONFIG.useSmoothSettling) {
                // Use smooth lerp-based settling (Smooothy-inspired)
                startSmoothSettling();
            } else {
                // Use Motion One animation (original behavior)
                updateSlidePositions(nearestIndex);

                // Resume autoplay if user hasn't taken control
                if (!userHasTakenControl) {
                    resumeAutoplay();
                }

                // BUG FIX: Reset position AFTER animation completes
                const isClone = (nearestIndex < originalSlideCount) || (nearestIndex >= originalSlideCount * 2);
                if (isClone) {
                    const animationDuration = CONFIG.animationDuration * 0.6 * 1000; // Convert to ms
                    setTimeout(() => {
                        checkAndResetLoopPosition();
                    }, animationDuration);
                }
            }
        }

        // ===== IMAGE LOADING HELPERS =====
        // Prevent clones from downloading images unnecessarily

        function unloadImg(img) {
            if (!img || img.tagName !== 'IMG') return;

            // Store original attributes for later restoration (use getAttribute to check attribute, not property)
            const srcAttr = img.getAttribute('src');
            const srcsetAttr = img.getAttribute('srcset');

            if (srcAttr) {
                img.dataset.originalSrc = srcAttr;
            }
            if (srcsetAttr) {
                img.dataset.originalSrcset = srcsetAttr;
            }

            // Remove src and srcset to prevent download
            img.removeAttribute('src');
            img.removeAttribute('srcset');
        }

        function hydrateImg(img) {
            if (!img || img.tagName !== 'IMG') return;

            const hasSrc = img.hasAttribute('src');
            const hasSrcset = img.hasAttribute('srcset');
            const hasStoredSrc = !!img.dataset.originalSrc;
            const hasStoredSrcset = !!img.dataset.originalSrcset;

            // Restore src/srcset if they were previously stored and are currently missing
            if (hasStoredSrc && !hasSrc) {
                img.setAttribute('src', img.dataset.originalSrc);
            }
            if (hasStoredSrcset && !hasSrcset) {
                img.setAttribute('srcset', img.dataset.originalSrcset);
            }

            // Warn if image has no src at all (shouldn't happen)
            if (!hasSrc && !hasStoredSrc) {
                console.warn('[CAROUSEL] Image has no src or stored src:', img.alt);
            }
        }

        // Smooth settling animation using RAF and lerp (Smooothy-inspired)
        function startSmoothSettling() {
            isSettling = true;
            settlingStartTime = performance.now();
            let lastTime = settlingStartTime;

            // Initialize slide states from CURRENT positions (not target) to avoid jump
            slideElements.forEach((slide, index) => {
                // Get current computed transform values
                const computedStyle = window.getComputedStyle(slide);
                const transform = computedStyle.transform;

                let currentX = 0;
                if (transform && transform !== 'none') {
                    const matrix = new DOMMatrix(transform);
                    currentX = matrix.m41; // translateX value
                }

                const currentWidth = parseFloat(computedStyle.width) || CONFIG.inactiveWidth;
                const currentHeight = parseFloat(computedStyle.height) || CONFIG.inactiveHeight;
                const currentOpacity = parseFloat(computedStyle.opacity) || 1;

                slideStates.set(slide, {
                    x: currentX,
                    opacity: currentOpacity,
                    width: currentWidth,
                    height: currentHeight,
                    marginLeft: -currentWidth / 2,
                    marginTop: -currentHeight / 2,
                });
            });

            const settlingStep = (currentTime) => {
                const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
                lastTime = currentTime;

                let allSettled = true;

                slideElements.forEach((slide, index) => {
                    const distance = index - targetSlideIndex;
                    const isActive = distance === 0;

                    // Calculate target values
                    const targetX = getXPositionDynamic(index, targetSlideIndex, false);
                    const targetOpacity = getOpacity(distance);
                    const targetWidth = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    const targetHeight = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;
                    const targetMarginLeft = -targetWidth / 2;
                    const targetMarginTop = -targetHeight / 2;

                    const state = slideStates.get(slide);

                    // Use exponential damping for position (X) and size - smooth sliding and resizing
                    const smoothing = 15 * CONFIG.snapLerpFactor;
                    state.x = damp(state.x, targetX, smoothing, deltaTime);
                    state.opacity = damp(state.opacity, targetOpacity, smoothing, deltaTime);

                    // Also smooth the width/height to prevent overlap during size changes
                    state.width = damp(state.width, targetWidth, smoothing, deltaTime);
                    state.height = damp(state.height, targetHeight, smoothing, deltaTime);

                    // Calculate margins directly from current width/height to maintain center anchor
                    state.marginLeft = -state.width / 2;
                    state.marginTop = -state.height / 2;

                    // Apply interpolated values
                    slide.style.transform = `translateX(${state.x}px) translateZ(0)`;
                    slide.style.opacity = state.opacity.toString();
                    slide.style.width = `${state.width}px`;
                    slide.style.height = `${state.height}px`;
                    slide.style.marginLeft = `${state.marginLeft}px`;
                    slide.style.marginTop = `${state.marginTop}px`;

                    // Check if position and size have settled
                    const threshold = 1.5;
                    if (
                        Math.abs(state.x - targetX) > threshold ||
                        Math.abs(state.width - targetWidth) > threshold
                    ) {
                        allSettled = false;
                    }
                });

                if (!allSettled) {
                    settlingAnimationFrame = requestAnimationFrame(settlingStep);
                } else {
                    // Settling complete
                    isSettling = false;
                    updateControls(targetSlideIndex);

                    // Resume autoplay if user hasn't taken control
                    if (!userHasTakenControl) {
                        resumeAutoplay();
                    }

                    // BUG FIX: Reset position if we settled on a clone
                    const isClone = (targetSlideIndex < originalSlideCount) || (targetSlideIndex >= originalSlideCount * 2);
                    if (isClone) {
                        // Reset immediately since settling is already complete
                        checkAndResetLoopPosition();
                    }
                }
            };

            settlingAnimationFrame = requestAnimationFrame(settlingStep);
        }

        // ⚡ PERFORMANCE: Lazy inject remaining slides
        function injectLazySlides() {
            const lazyDataScript = document.getElementById('lazy-slides-data');
            if (!lazyDataScript) {
                console.log('[CAROUSEL] No lazy slides to inject');
                return;
            }

            try {
                const lazySlides = JSON.parse(lazyDataScript.textContent);
                const slidesContainer = document.getElementById('slides');

                lazySlides.forEach(slideData => {
                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'slide';
                    slideDiv.setAttribute('data-slide-index', slideData.index);
                    slideDiv.setAttribute('data-label', slideData.label);
                    if (slideData.injectUrl) {
                        slideDiv.setAttribute('data-inject-url', slideData.injectUrl);
                    }

                    const img = document.createElement('img');
                    img.src = slideData.src;
                    img.srcset = slideData.srcset;
                    img.sizes = "(max-width: 768px) 100vw, 777px";
                    img.width = 777;
                    img.height = 437;
                    img.alt = slideData.label;
                    img.loading = "lazy";
                    img.decoding = "async";
                    img.setAttribute('fetchpriority', 'low');

                    slideDiv.appendChild(img);
                    slidesContainer.appendChild(slideDiv);
                });

                console.log('[CAROUSEL] Injected', lazySlides.length, 'lazy slides');
            } catch (err) {
                console.error('[CAROUSEL] Failed to inject lazy slides:', err);
            }
        }

        // Initialize slides
        function init() {
            const slidesContainer = document.getElementById('slides');
            const indicatorsContainer = document.getElementById('indicators');

            // ⚡ PERFORMANCE: Inject lazy slides first (if using optimized HTML)
            injectLazySlides();

            // Get all original slide elements from HTML (now includes lazy-injected)
            const originalSlides = Array.from(slidesContainer.querySelectorAll('.slide[data-slide-index]'));
            originalSlideCount = originalSlides.length;

            if (originalSlideCount === 0) {
                console.error('No slides found in HTML!');
                return;
            }

            // Clone slides for seamless infinite loop
            // Structure: [...clones, ...original slides, ...clones]
            const clonesBefore = originalSlides.map(slide => {
                const clone = slide.cloneNode(true);
                clone.removeAttribute('data-slide-index'); // Mark as clone
                clone.setAttribute('data-clone', 'before');

                // Unload images from clone to prevent unnecessary downloads
                const img = clone.querySelector('img');
                if (img) {
                    unloadImg(img);
                }

                return clone;
            });

            const clonesAfter = originalSlides.map(slide => {
                const clone = slide.cloneNode(true);
                clone.removeAttribute('data-slide-index'); // Mark as clone
                clone.setAttribute('data-clone', 'after');

                // Unload images from clone to prevent unnecessary downloads
                const img = clone.querySelector('img');
                if (img) {
                    unloadImg(img);
                }

                return clone;
            });

            console.log('[CAROUSEL] Created', clonesBefore.length, 'clones before and', clonesAfter.length, 'clones after. Total slides:', originalSlideCount * 3);

            // Build slideElements array in correct order
            slideElements.length = 0; // Clear array
            slideElements.push(...clonesBefore);
            slideElements.push(...originalSlides);
            slideElements.push(...clonesAfter);

            // Prepend clones before (in reverse order to maintain sequence)
            for (let i = clonesBefore.length - 1; i >= 0; i--) {
                slidesContainer.prepend(clonesBefore[i]);
            }

            // Original slides already in DOM - do nothing

            // Append clones after
            clonesAfter.forEach(clone => {
                slidesContainer.appendChild(clone);
            });

            // Add label tags to all slides
            slideElements.forEach((slide) => {
                // Get the label from data-label attribute
                const label = slide.getAttribute('data-label');

                if (label) {
                    // Create tag container
                    const tag = document.createElement('div');
                    tag.className = 'slide-tag';
                    tag.textContent = label;

                    // Add tag to slide
                    slide.appendChild(tag);
                }
            });

            // Add click handlers to all slides (including clones)
            slideElements.forEach((slide, index) => {
                slide.addEventListener('click', (e) => {
                    // Check if this was a drag (not a real click)
                    const dragDistance = Math.abs(dragCurrentX - dragStartX);
                    if (dragDistance <= 5) { // Only navigate if it's a real click
                        stopTypewriter();

                        // BUG FIX: Calculate shortest path to target (including wrap-around)
                        // This makes click-to-center work like drag/autoplay with seamless wrapping

                        // Normalize clicked index to its original equivalent
                        let clickedOriginalIndex = index;
                        if (index < originalSlideCount) {
                            clickedOriginalIndex = index + originalSlideCount;
                        } else if (index >= originalSlideCount * 2) {
                            clickedOriginalIndex = index - originalSlideCount;
                        }

                        // Calculate which "version" of the target to navigate to (original, clone-before, or clone-after)
                        // to achieve the shortest distance
                        const currentIndex = activeIndex;

                        // Get the original index value (0-8 for 9 slides)
                        const targetOriginalValue = ((clickedOriginalIndex - originalSlideCount) % originalSlideCount + originalSlideCount) % originalSlideCount;

                        // Calculate distances to all three versions of the target
                        const targetInOriginals = originalSlideCount + targetOriginalValue; // Index in original slides
                        const targetInClonesBefore = targetOriginalValue; // Index in clones before
                        const targetInClonesAfter = (originalSlideCount * 2) + targetOriginalValue; // Index in clones after

                        const distanceToOriginal = Math.abs(currentIndex - targetInOriginals);
                        const distanceToBefore = Math.abs(currentIndex - targetInClonesBefore);
                        const distanceToAfter = Math.abs(currentIndex - targetInClonesAfter);

                        // Choose the version with shortest distance
                        let bestTarget = targetInOriginals;
                        let minDistance = distanceToOriginal;

                        if (distanceToBefore < minDistance) {
                            bestTarget = targetInClonesBefore;
                            minDistance = distanceToBefore;
                        }

                        if (distanceToAfter < minDistance) {
                            bestTarget = targetInClonesAfter;
                        }

                        console.log('[CAROUSEL] Click shortest path:', currentIndex, '→', bestTarget, 'to reach slide', targetOriginalValue);

                        goToSlide(bestTarget);
                    }
                });
            });

            // Create indicators only for original slides (not clones)
            for (let i = 0; i < originalSlideCount; i++) {
                const indicator = document.createElement('button');
                indicator.className = 'indicator';
                indicator.textContent = (i + 1).toString();
                indicator.addEventListener('click', () => {
                    stopTypewriter();

                    // BUG FIX: Use shortest path to target (same logic as slide clicks)
                    const targetOriginalValue = i;
                    const currentIndex = activeIndex;

                    // Calculate distances to all three versions of the target
                    const targetInOriginals = originalSlideCount + targetOriginalValue;
                    const targetInClonesBefore = targetOriginalValue;
                    const targetInClonesAfter = (originalSlideCount * 2) + targetOriginalValue;

                    const distanceToOriginal = Math.abs(currentIndex - targetInOriginals);
                    const distanceToBefore = Math.abs(currentIndex - targetInClonesBefore);
                    const distanceToAfter = Math.abs(currentIndex - targetInClonesAfter);

                    // Choose the version with shortest distance
                    let bestTarget = targetInOriginals;
                    let minDistance = distanceToOriginal;

                    if (distanceToBefore < minDistance) {
                        bestTarget = targetInClonesBefore;
                        minDistance = distanceToBefore;
                    }

                    if (distanceToAfter < minDistance) {
                        bestTarget = targetInClonesAfter;
                    }

                    console.log('[CAROUSEL] Indicator shortest path:', currentIndex, '→', bestTarget, 'for slide', targetOriginalValue);

                    goToSlide(bestTarget);
                });
                indicatorsContainer.appendChild(indicator);
            }

            // Start at the first original slide (after the first set of clones)
            activeIndex = originalSlideCount;
            dragStartActiveIndex = activeIndex;

            // Position all slides at their final positions with opacity 0
            slideElements.forEach((slide, index) => {
                const distance = index - activeIndex;
                const isActive = distance === 0;
                const baseX = getXPositionDynamic(index, activeIndex, false);
                const width = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                const height = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;
                const zIndex = getZIndex(distance);

                slide.style.zIndex = zIndex.toString();
                slide.style.display = 'flex'; // Safari fix

                // For LCP optimization: only hydrate active slide initially
                // Adjacent slides will be hydrated after initial load
                const shouldHydrate = distance === 0;
                const img = slide.querySelector('img');
                if (img && shouldHydrate) {
                    hydrateImg(img);
                }

                // Directly set initial styles at final positions but invisible
                slide.style.transform = `translateX(${baseX}px) translateZ(0)`;
                slide.style.opacity = '0';
                slide.style.width = `${width}px`;
                slide.style.height = `${height}px`;
                slide.style.marginLeft = `${-width / 2}px`;
                slide.style.marginTop = `${-height / 2}px`;
            });

            // Hydrate nearby slides after initial load for smooth interaction
            setTimeout(() => {
                const hydrationRadius = getVisibleSlideCount();
                slideElements.forEach((slide, index) => {
                    const distance = Math.abs(index - activeIndex);
                    if (distance > 0 && distance <= hydrationRadius) {
                        const img = slide.querySelector('img');
                        if (img) {
                            hydrateImg(img);
                        }
                    }
                });
            }, 100);

            // Fade in slides smoothly
            // Use setTimeout to ensure initial styles are rendered first
            setTimeout(() => {
                slideElements.forEach((slide, index) => {
                    const distance = index - activeIndex;
                    const opacity = getOpacity(distance);

                    // Only animate opacity - positions are already set
                    animate(
                        slide,
                        {
                            opacity: opacity,
                        },
                        {
                            duration: 0.4,
                            easing: 'ease-out'
                        }
                    );
                });

                updateControls(activeIndex);
            }, 50);

            // Add drag event listeners to viewport
            const viewport = document.querySelector('.viewport');

            // Mouse events
            viewport.addEventListener('mousedown', handleDragStart);
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);

            // Touch events
            viewport.addEventListener('touchstart', handleDragStart, { passive: false });
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);

            // Hover events for autoplay
            viewport.addEventListener('mouseenter', () => {
                pauseAutoplay();
            });

            viewport.addEventListener('mouseleave', () => {
                resumeAutoplay();
            });

            // Navigation button event listeners
            document.getElementById('prevBtn').addEventListener('click', () => {
                stopTypewriter();
                goToPrev();
            });

            document.getElementById('nextBtn').addEventListener('click', () => {
                stopTypewriter();
                goToNext();
            });

            // Start autoplay after initialization
            startAutoplay();
        }


        // Page Visibility API - pause slider when tab is not visible
        function handleVisibilityChange() {
            if (document.hidden) {
                // Tab became hidden - pause everything
                stopAutoplay();
                stopTypewriter();

                // Cancel any ongoing settling animation
                if (isSettling && settlingAnimationFrame) {
                    cancelAnimationFrame(settlingAnimationFrame);
                    isSettling = false;
                }

                // Reset drag state to prevent broken state
                isDragging = false;
                isMomentum = false;
                isTransitioning = false;
            } else {
                // Tab became visible - reset to current position and resume

                // Force immediate positioning to prevent slides from being out of view
                const hydrationRadius = getVisibleSlideCount();

                slideElements.forEach((slide, index) => {
                    const distance = index - activeIndex;
                    const isActive = distance === 0;
                    const baseX = getXPositionDynamic(index, activeIndex, false);
                    const opacity = getOpacity(distance);
                    const width = isActive ? CONFIG.activeWidth : CONFIG.inactiveWidth;
                    const height = isActive ? CONFIG.activeHeight : CONFIG.inactiveHeight;
                    const zIndex = getZIndex(distance);

                    // Hydrate images based on viewport-aware radius
                    const shouldHydrate = Math.abs(distance) <= hydrationRadius;
                    const img = slide.querySelector('img');
                    if (img && shouldHydrate) {
                        hydrateImg(img);
                    }

                    // Use direct style manipulation for instant positioning
                    slide.style.transform = `translateX(${baseX}px) translateZ(0)`;
                    slide.style.opacity = opacity.toString();
                    slide.style.width = `${width}px`;
                    slide.style.height = `${height}px`;
                    slide.style.marginLeft = `${-width / 2}px`;
                    slide.style.marginTop = `${-height / 2}px`;
                    slide.style.zIndex = zIndex.toString();
                });

                // Resume autoplay
                resumeAutoplay();
            }
        }

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // ⚡ PERFORMANCE OPTIMIZATION: Defer carousel initialization
        // Wait for LCP before initializing to avoid blocking main thread
        function deferredInit() {
            performance.mark('carousel-init-start');

            // Check if DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(init, 100); // Small delay to let LCP render
                });
            } else {
                // DOM already loaded
                if ('requestIdleCallback' in window) {
                    // Wait for idle time (after LCP)
                    requestIdleCallback(function() {
                        init();
                        performance.mark('carousel-init-end');
                        performance.measure('carousel-init', 'carousel-init-start', 'carousel-init-end');
                    }, { timeout: 1500 });
                } else {
                    // Fallback: delay by 500ms to allow LCP
                    setTimeout(init, 500);
                }
            }
        }

        // Start deferred initialization
        deferredInit();

        // Monitor prompt box for user interactions
        function setupPromptBoxMonitoring() {
            const promptTextArea = document.getElementById('textArea');
            const addButton = document.getElementById('addButton');
            const generateButton = document.getElementById('generateButton');
            const fileInput = document.getElementById('fileInput');

            // Monitor focus on textarea - user is showing intent to interact
            if (promptTextArea) {
                promptTextArea.addEventListener('focus', () => {
                    console.log('[CAROUSEL] Textarea focused - user taking control');

                    // CRITICAL: Preserve current slide position
                    const currentSlideBeforeFocus = activeIndex;
                    console.log('[CAROUSEL] Current slide at focus:', currentSlideBeforeFocus);

                    // If typewriter is active, show full prompt immediately
                    if (isTypewriterActive && currentTypewriterPrompt) {
                        console.log('[CAROUSEL] Stopping typewriter and showing full prompt');
                        stopTypewriter();
                        if (window.searchFeature?.setPrompt) {
                            window.searchFeature.setPrompt(currentTypewriterPrompt, false);
                        }
                    }

                    // Auto-inject sample image if user hasn't added images yet
                    const slideData = getActiveSlideData();
                    const slideKey = `slide-${slideData.id}`;

                    // Check if user has uploaded any images
                    const imagesSection = document.getElementById('imagesSection');
                    const hasImages = imagesSection?.children?.length > 0;

                    // Only inject if: no images exist, slide has injectUrl, and we haven't injected this slide before
                    if (!hasImages && slideData.injectUrl && !injectedSlideKeys.has(slideKey)) {
                        console.log('[CAROUSEL] Auto-injecting sample image for slide:', slideData.label);
                        if (window.searchFeature?.setExternalImage) {
                            window.searchFeature.setExternalImage(slideData.injectUrl, slideKey);
                            injectedSlideKeys.add(slideKey);
                        }
                    }

                    markUserControl();

                    // VERIFY: Ensure slide position hasn't changed during focus
                    if (activeIndex !== currentSlideBeforeFocus) {
                        console.error('[CAROUSEL] BUG: Slide position changed during focus!',
                            'Before:', currentSlideBeforeFocus, 'After:', activeIndex);
                        // Force position back (defensive)
                        activeIndex = currentSlideBeforeFocus;
                        dragStartActiveIndex = currentSlideBeforeFocus;
                        targetSlideIndex = currentSlideBeforeFocus;
                    }
                });

                // Monitor blur/defocus - resume typewriter if user didn't type anything
                promptTextArea.addEventListener('blur', () => {
                    console.log('[CAROUSEL] Textarea blurred - checking if we should reset');

                    // CRITICAL: Preserve current slide position
                    const currentSlideBeforeBlur = activeIndex;
                    console.log('[CAROUSEL] Current slide before blur:', currentSlideBeforeBlur);

                    // Get current state
                    const promptValue = promptTextArea.value || '';

                    // Check if user actually modified the prompt
                    // User didn't modify if: prompt is empty OR matches what carousel set
                    const userDidNotModify = (promptValue.length === 0) || (promptValue === currentTypewriterPrompt);

                    // OPTION A: User images lock the system in user mode
                    // Check if user added their own images via API (primary method)
                    let hasUserImages = false;

                    if (window.searchFeature?.getImageCount) {
                        const userImageCount = window.searchFeature.getImageCount('user');
                        hasUserImages = userImageCount > 0;
                        console.log('[CAROUSEL] User image count from API:', userImageCount);
                    } else {
                        console.warn('[CAROUSEL] getImageCount API not available - assuming no user images');
                    }

                    // Rule: If user has uploaded images, stay in user mode
                    if (hasUserImages) {
                        console.log('[CAROUSEL] User has uploaded images - staying in user mode (no auto-demo)');
                        return; // Exit early - don't reset to demo mode
                    }

                    // If user didn't modify anything and has no user-added images, reset to demo mode
                    if (userDidNotModify && !hasUserImages && userHasTakenControl) {
                        console.log('[CAROUSEL] No modifications and no user images - resetting to demo mode');
                        console.log('[CAROUSEL] PRESERVING slide position:', currentSlideBeforeBlur);

                        // Clear any auto-injected carousel images
                        if (window.searchFeature?.clearImages) {
                            window.searchFeature.clearImages('carousel');
                        }

                        // Clear injected slide keys to allow re-injection
                        injectedSlideKeys.clear();

                        // Reset to demo mode WITHOUT changing carousel position
                        resetUserControl();

                        // VERIFY: Ensure slide position hasn't changed
                        if (activeIndex !== currentSlideBeforeBlur) {
                            console.error('[CAROUSEL] BUG: Slide position changed during blur!',
                                'Before:', currentSlideBeforeBlur, 'After:', activeIndex);
                            // Force position back (defensive)
                            activeIndex = currentSlideBeforeBlur;
                            dragStartActiveIndex = currentSlideBeforeBlur;
                            targetSlideIndex = currentSlideBeforeBlur;
                        } else {
                            console.log('[CAROUSEL] ✓ Slide position preserved correctly');
                        }

                        // Don't re-trigger typewriter here - it will happen on next slide change
                        // This allows the typing to restart naturally when updateControls is called
                    }
                });

                // Monitor input changes
                promptTextArea.addEventListener('input', (e) => {
                    const currentValue = e.target.value;
                    const hasValue = currentValue.length > 0;

                    // User typed something - take control
                    if (hasValue && !userHasTakenControl) {
                        console.log('[CAROUSEL] User typed in textarea - taking control');
                        markUserControl();
                    }

                    // BUG FIX: Deleting text is still user control - do NOT auto-reset
                    // User clearing the prompt intentionally means they want it empty
                    // Only the blur handler should check for returning to demo mode
                });
            }

            // Monitor add button clicks
            if (addButton) {
                addButton.addEventListener('click', () => {
                    const positionBeforeAction = activeIndex;
                    console.log('[CAROUSEL] Add button clicked - user taking control');
                    markUserControl();

                    // Verify position preserved
                    if (activeIndex !== positionBeforeAction) {
                        console.error('[CAROUSEL] Position changed on add button!');
                        activeIndex = positionBeforeAction;
                        dragStartActiveIndex = positionBeforeAction;
                        targetSlideIndex = positionBeforeAction;
                    }
                });
            }

            // Monitor file uploads
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const positionBeforeAction = activeIndex;
                        console.log('[CAROUSEL] File uploaded - user taking control');
                        markUserControl();

                        // Verify position preserved
                        if (activeIndex !== positionBeforeAction) {
                            console.error('[CAROUSEL] Position changed on file upload!');
                            activeIndex = positionBeforeAction;
                            dragStartActiveIndex = positionBeforeAction;
                            targetSlideIndex = positionBeforeAction;
                        }
                    }
                });
            }

            // Monitor generate button clicks
            if (generateButton) {
                generateButton.addEventListener('click', () => {
                    const positionBeforeAction = activeIndex;
                    console.log('[CAROUSEL] Generate button clicked - user taking control');
                    markUserControl();

                    // Verify position preserved
                    if (activeIndex !== positionBeforeAction) {
                        console.error('[CAROUSEL] Position changed on generate button!');
                        activeIndex = positionBeforeAction;
                        dragStartActiveIndex = positionBeforeAction;
                        targetSlideIndex = positionBeforeAction;
                    }
                });
            }

            // BUG FIX: Image removal observer removed
            // Removing images is user action - doesn't trigger auto-reset to demo mode
            // Only the blur handler should decide when to return to demo mode
        }

        // Setup monitoring after a brief delay to ensure DOM is ready
        setTimeout(setupPromptBoxMonitoring, 100);

        // Expose API for prompt box integration
        window.aiPhotoCarousel = {
            stopTypewriter,
            getFullPrompt,
            getStoredPrompt: getFullPrompt, // Alias for compatibility
            getCurrentSlide: getActiveSlideData,
            isTypewriting: () => isTypewriterActive,
            markUserControl,
            resetUserControl,
            hasUserControl: () => userHasTakenControl
        };
