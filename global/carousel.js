
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
                return true;
            } catch (err) {
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
            'Video Generator': 'A surreal, low-saturated cinematic editorial of a lone woman standing in a sun-drenched meadow of wild daisies, her windswept hair partly veiling her face as she gazes upward. Shot from a low angle with an 85mm lens feel, she\'s isolated against a vast pale-blue sky, the field softly blooming in textured foreground blur. Natural midday light creates airy highlights, her minimal black outfit adding modern contrast to the muted pastoral palette of serene blues, soft whites, and earthy tones. Add natural cinematic motion to the scene - gentle daisy sways, drifting hair, subtle light shimmer - and move the camera slowly in a floating arc for a dreamy high-fashion countryside campaign mood.',
            'Watermark Remover': 'Remove the watermark from the image',
            'Product Shoot': 'Surreal luxury skincare campaign scene featuring a large emerald-green serum jar floating above soft cloud layers, its glossy glass surface catching crisp sunlight with golden particles suspended inside; atop the oversized lid sits a serene woman in light neutral clothing, cross-legged in a peaceful pose. Dozens of vibrant yellow lemons drift mid-air around her in dynamic suspension, some sliced to reveal bright translucent pulp. The sky is a clear gradient blue, creating airy depth and whimsical elevation. Cinematic wide-angle perspective, ultra-realistic textures, premium high-fashion product aesthetic with dreamlike, editorial visual energy.',
            'Avataar': 'Create a high-quality 3D stylized character portrait of Post Malone, rendered in a Pixar-realistic style. He faces the camera smiling, with a buzz cut, thick eyebrows, expressive eyes, and a full beard. His face and neck feature iconic Post Malone tattoos—script lettering, symbols, stars, hearts, and playful graphic elements—accurately placed. He wears a blue denim jacket with a brown corduroy collar and silver grills on his teeth. Clean gray studio background, soft diffused lighting, shallow depth of field, ultra-sharp focus, polished yet edgy, friendly modern character aesthetic.',
            'Ad Creative': 'Create a cinematic night-time lifestyle ad featuring a young man sitting sideways in the driver\'s seat of a modern blue sedan with the door open, one sneakered foot extended toward the camera. He wears a white T-shirt, neutral pants, and a gold chain, holding a slice of pepperoni pizza on a paper plate and a pink "Quick Eats" smoothie cup with a straw. Raindrops cover the car, reflecting teal and warm streetlights. Shallow depth of field, glossy reflections, urban mood. Bold white text reads "The Legacy" with "hella good" beneath.',
            'Photoshoot': 'A surreal cinematic portrait of a regal woman riding a black horse along a misty shoreline, her emerald embroidered robe drifting in the sea breeze as diffused dreamlike light casts soft highlights across the horse\'s onyx coat and subtle gold glints in the fabric. Muted aqua, soft sand, and deep black tones blend through atmospheric haze into an ethereal horizon. Shot with an 85mm full-frame look, shallow depth of field, and gentle lens bloom for a moody elevated editorial style.',
            'Digital Art': 'A towering knight in gleaming black chrome armor stands heroically under a deep blue sky, captured from an ultra-low angle for monumental scale. Sunlight ignites brilliant star-like flares across the polished armor and the long reflective sword gripped firmly at center frame. A shimmering silver cape made of glittering, translucent mesh trails behind, catching light with iridescent sparkles. Billowing white clouds frame the figure, adding epic contrast and cinematic depth. Hyper-detailed metallic textures, crisp natural daylight, and bold high-contrast reflections create a premium fantasy campaign aesthetic-powerful, iconic, and visually arresting.',
            'Upscale': 'Upscale the image to 8x'
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
            autoplayInitialDelay: 6000, // 6 seconds delay for first slide (video)
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
            userHasTakenControl = true;
            stopTypewriter();
            pauseAutoplay('user took control (typing/uploading)');
        }

        // Reset user control (called when prompt box is cleared or reset)
        function resetUserControl() {
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
                const img = getMediaElement(slide);
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

            // Update indicators based on original index - use namespaced class to avoid Webflow conflicts
            document.querySelectorAll('.indicator').forEach((indicator, i) => {
                indicator.classList.toggle('carousel-active', i === originalIndex);
            });

            // Get and log active slide data (for debugging/integration purposes)
            const slideData = getActiveSlideData();

            // Clear carousel-injected images when slide changes in demo mode
            if (!userHasTakenControl && window.searchFeature?.clearImages) {
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
            } else {
                // Going forward: clone → first original
                newIndex = activeIndex - originalSlideCount;
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
                const img = getMediaElement(slide);
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
                indicator.classList.toggle('carousel-active', i === originalIndex);
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
            }

            goToSlide(targetIndex);
        }

        // Track the slide that was active when drag started
        let dragStartActiveIndex = activeIndex;

        // Autoplay state
        let autoplayTimer = null;
        let isAutoplayPaused = false;
        let autoplayPauseReason = ''; // Track why autoplay is paused
        let isFirstAutoplay = true; // Track if this is the first autoplay transition

        // Autoplay functions
        function startAutoplay() {
            if (!CONFIG.autoplayEnabled) return;

            stopAutoplay(); // Clear any existing timer

            if (!isAutoplayPaused) {
                if (isFirstAutoplay) {
                    // Wait 6 seconds on slide 0 (video plays), then start normal autoplay
                    autoplayTimer = setTimeout(() => {
                        isFirstAutoplay = false; // Mark that initial delay is done

                        // Start normal autoplay interval from slide 0
                        if (!isAutoplayPaused) {
                            autoplayTimer = setInterval(() => {
                                goToNext();
                            }, CONFIG.autoplayDelay);
                        }
                    }, CONFIG.autoplayInitialDelay);
                } else {
                    // Normal autoplay interval
                    autoplayTimer = setInterval(() => {
                        goToNext();
                    }, CONFIG.autoplayDelay);
                }
            } else {
            }
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                clearTimeout(autoplayTimer);
                autoplayTimer = null;
            }
        }

        function pauseAutoplay(reason = 'user interaction') {
            isAutoplayPaused = true;
            autoplayPauseReason = reason;
            stopAutoplay();

            // If user interacts before first autoplay completes, skip the initial delay
            if (isFirstAutoplay) {
                isFirstAutoplay = false;
            }
        }

        function resumeAutoplay() {
            isAutoplayPaused = false;
            autoplayPauseReason = '';
            startAutoplay();
        }

        // Drag handlers
        function handleDragStart(e) {
            // Don't start new drag while momentum is active
            if (isMomentum) return;

            // CRITICAL: Only process if event originated from carousel viewport
            const viewport = document.querySelector('.viewport');
            if (!viewport || !viewport.contains(e.target)) {
                return; // Event not from carousel - ignore completely
            }

            // IMPORTANT: Stop event from bubbling to prevent interfering with navbar/other interactions
            e.stopPropagation();

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
            pauseAutoplay('carousel drag started');

            // IMPORTANT: Attach document listeners only when dragging starts
            if (e.type.includes('mouse')) {
                document.addEventListener('mousemove', handleDragMove, { capture: true });
                document.addEventListener('mouseup', handleDragEnd, { capture: true });
            } else {
                document.addEventListener('touchmove', handleDragMove, { passive: false, capture: true });
                document.addEventListener('touchend', handleDragEnd, { capture: true });
            }
        }

        function handleDragMove(e) {
            if (!isDragging) {
                // Safety: If not dragging, remove listeners and bail
                if (e.type.includes('mouse')) {
                    document.removeEventListener('mousemove', handleDragMove, { capture: true });
                    document.removeEventListener('mouseup', handleDragEnd, { capture: true });
                } else {
                    document.removeEventListener('touchmove', handleDragMove, { capture: true });
                    document.removeEventListener('touchend', handleDragEnd, { capture: true });
                }
                return;
            }

            // IMPORTANT: Only preventDefault and stopPropagation when actively dragging
            e.preventDefault();
            e.stopPropagation();

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

            // IMPORTANT: Stop event from bubbling
            e.stopPropagation();

            document.body.style.cursor = '';

            const dragOffset = dragCurrentX - dragStartX;
            const timeSinceLastUpdate = Date.now() - lastDragTime;

            // Calculate velocity (px per ms) over the tracked period
            const velocity = (dragCurrentX - lastDragX) / Math.max(timeSinceLastUpdate, 1);

            // IMPORTANT: Remove document listeners immediately to free up navbar
            if (e.type.includes('mouse')) {
                document.removeEventListener('mousemove', handleDragMove, { capture: true });
                document.removeEventListener('mouseup', handleDragEnd, { capture: true });
            } else {
                document.removeEventListener('touchmove', handleDragMove, { capture: true });
                document.removeEventListener('touchend', handleDragEnd, { capture: true });
            }

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

        // ===== IMAGE/VIDEO LOADING HELPERS =====
        // Prevent clones from downloading images/videos unnecessarily

        // Helper to get media element (img or video) from a slide
        function getMediaElement(slide) {
            return slide.querySelector('img') || slide.querySelector('video');
        }

        function unloadImg(img) {
            if (!img) return;

            // Handle video elements
            if (img.tagName === 'VIDEO') {
                const srcAttr = img.getAttribute('src');
                if (srcAttr) {
                    img.dataset.originalSrc = srcAttr;
                }
                img.pause();
                img.removeAttribute('src');
                img.load(); // Reset video element
                return;
            }

            // Handle image elements
            if (img.tagName !== 'IMG') return;

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
            if (!img) return;

            // Handle video elements
            if (img.tagName === 'VIDEO') {
                const hasStoredSrc = !!img.dataset.originalSrc;
                const hasSrc = img.hasAttribute('src');

                if (hasStoredSrc && !hasSrc) {
                    img.setAttribute('src', img.dataset.originalSrc);
                    img.load();
                    img.play().catch(() => {}); // Play video, ignore errors
                } else if (hasSrc) {
                    img.play().catch(() => {}); // Ensure video is playing
                }
                return;
            }

            // Handle image elements
            if (img.tagName !== 'IMG') return;

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

                    // Apply interpolated values using Motion One for consistency
                    animate(
                        slide,
                        {
                            x: state.x,
                            opacity: state.opacity,
                            width: `${state.width}px`,
                            height: `${state.height}px`,
                            marginLeft: `${state.marginLeft}px`,
                            marginTop: `${state.marginTop}px`,
                        },
                        { duration: 0 }
                    );

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

            } catch (err) {
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
                return;
            }

            // Clone slides for seamless infinite loop
            // Structure: [...clones, ...original slides, ...clones]
            const clonesBefore = originalSlides.map(slide => {
                const clone = slide.cloneNode(true);
                clone.removeAttribute('data-slide-index'); // Mark as clone
                clone.setAttribute('data-clone', 'before');

                // Unload media from clone to prevent unnecessary downloads
                const img = getMediaElement(clone);
                if (img) {
                    unloadImg(img);
                }

                return clone;
            });

            const clonesAfter = originalSlides.map(slide => {
                const clone = slide.cloneNode(true);
                clone.removeAttribute('data-slide-index'); // Mark as clone
                clone.setAttribute('data-clone', 'after');

                // Unload media from clone to prevent unnecessary downloads
                const img = getMediaElement(clone);
                if (img) {
                    unloadImg(img);
                }

                return clone;
            });


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
                    // IMPORTANT: Prevent click from bubbling to navbar/other elements
                    e.stopPropagation();

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


                        goToSlide(bestTarget);
                    }
                });
            });

            // Create indicators only for original slides (not clones)
            for (let i = 0; i < originalSlideCount; i++) {
                const indicator = document.createElement('button');
                indicator.className = 'indicator';
                indicator.textContent = (i + 1).toString();
                indicator.addEventListener('click', (e) => {
                    // IMPORTANT: Prevent indicator clicks from bubbling
                    e.stopPropagation();

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


                    goToSlide(bestTarget);
                });
                indicatorsContainer.appendChild(indicator);
            }

            // Start at the first original slide (after the first set of clones)
            activeIndex = originalSlideCount;
            dragStartActiveIndex = activeIndex;

            // Position all slides at their final positions with opacity 0
            // USE MOTION ONE from the start to avoid transform mismatch
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
                const img = getMediaElement(slide);
                if (img && shouldHydrate) {
                    hydrateImg(img);
                }

                // Use Motion One with duration 0 for instant positioning
                // This ensures consistent transform handling with later animations
                animate(
                    slide,
                    {
                        x: baseX,
                        opacity: 0,
                        width: `${width}px`,
                        height: `${height}px`,
                        marginLeft: `${-width / 2}px`,
                        marginTop: `${-height / 2}px`,
                    },
                    { duration: 0 }
                );
            });

            // Hydrate nearby slides after initial load for smooth interaction
            setTimeout(() => {
                const hydrationRadius = getVisibleSlideCount();
                slideElements.forEach((slide, index) => {
                    const distance = Math.abs(index - activeIndex);
                    if (distance > 0 && distance <= hydrationRadius) {
                        const img = getMediaElement(slide);
                        if (img) {
                            hydrateImg(img);
                        }
                    }
                });
            }, 100);

            // Fade in slides smoothly after initial positioning settles
            // Small delay ensures Motion One has processed the initial state
            setTimeout(() => {
                slideElements.forEach((slide, index) => {
                    const distance = index - activeIndex;
                    const opacity = getOpacity(distance);

                    // Only animate opacity - positions already set by Motion One
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
            }, 100);

            // Add drag event listeners to viewport ONLY
            // Document listeners will be added dynamically when drag starts
            const viewport = document.querySelector('.viewport');

            // Mouse events - only mousedown on viewport
            viewport.addEventListener('mousedown', handleDragStart);

            // Touch events - only touchstart on viewport
            viewport.addEventListener('touchstart', handleDragStart, { passive: false });

            // Hover events for autoplay
            viewport.addEventListener('mouseenter', () => {
                pauseAutoplay('mouse hover on carousel');
            });

            viewport.addEventListener('mouseleave', () => {
                if (!userHasTakenControl) {
                    resumeAutoplay();
                }
            });

            // Navigation button event listeners
            document.getElementById('prevBtn').addEventListener('click', (e) => {
                // IMPORTANT: Prevent button clicks from bubbling
                e.stopPropagation();

                stopTypewriter();
                goToPrev();
            });

            document.getElementById('nextBtn').addEventListener('click', (e) => {
                // IMPORTANT: Prevent button clicks from bubbling
                e.stopPropagation();

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
                pauseAutoplay('tab/window hidden');
                stopTypewriter();

                // Cancel any ongoing settling animation
                if (isSettling && settlingAnimationFrame) {
                    cancelAnimationFrame(settlingAnimationFrame);
                    isSettling = false;
                }

                // IMPORTANT: Clean up document listeners if dragging
                if (isDragging) {
                    document.removeEventListener('mousemove', handleDragMove, { capture: true });
                    document.removeEventListener('mouseup', handleDragEnd, { capture: true });
                    document.removeEventListener('touchmove', handleDragMove, { capture: true });
                    document.removeEventListener('touchend', handleDragEnd, { capture: true });
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
                    const img = getMediaElement(slide);
                    if (img && shouldHydrate) {
                        hydrateImg(img);
                    }

                    slide.style.zIndex = zIndex.toString();

                    // Use Motion One with duration 0 for instant, consistent positioning
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

                // Resume autoplay
                resumeAutoplay();
            }
        }

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Intersection Observer - pause when carousel scrolls out of view
        function setupIntersectionObserver() {
            const carouselSection = document.querySelector('.viewport')?.parentElement;
            if (!carouselSection) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Carousel is visible - resume if not in user control mode
                        if (!userHasTakenControl && !isDragging) {
                            resumeAutoplay();
                        }
                    } else {
                        // Carousel scrolled out of view - pause everything
                        pauseAutoplay('carousel scrolled out of view');
                    }
                });
            }, {
                threshold: 0.2, // Trigger when 20% visible
                rootMargin: '0px'
            });

            observer.observe(carouselSection);
        }

        // Setup intersection observer after initialization
        setTimeout(setupIntersectionObserver, 1000);

        // Click outside detector - pause when user interacts with navbar or other content
        function handleClickOutside(e) {
            const viewport = document.querySelector('.viewport');
            const carouselContainer = viewport?.parentElement;

            // If click is outside carousel and autoplay is running
            if (carouselContainer && !carouselContainer.contains(e.target)) {
                // Check if click is on navbar - if so, ignore
                const navbar = document.querySelector('.nav_container, .w-nav');
                if (navbar && navbar.contains(e.target)) {
                    return; // Navbar click - don't pause carousel
                }

                // User clicked outside carousel (other content, etc.)
                // Temporarily pause autoplay for better UX
                if (!isAutoplayPaused && CONFIG.autoplayEnabled) {
                    pauseAutoplay('click outside carousel (content)');

                    // Auto-resume after 5 seconds if user hasn't taken control
                    setTimeout(() => {
                        if (!userHasTakenControl && !isDragging) {
                            resumeAutoplay();
                        }
                    }, 5000);
                }
            }
        }

        // Add click outside listener (non-intrusive)
        document.addEventListener('click', handleClickOutside, { passive: true });

        // ⚡ PERFORMANCE OPTIMIZATION: Defer carousel initialization
        // Wait for Motion One to load AND LCP before initializing
        async function deferredInit() {
            performance.mark('carousel-init-start');

            // CRITICAL: Ensure Motion One is loaded before initializing
            // This prevents using the fallback animate function which is less reliable
            if (!animate || animate === animateFallback) {
                await loadMotionOne();
            }

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

                    // CRITICAL: Preserve current slide position
                    const currentSlideBeforeFocus = activeIndex;

                    // If typewriter is active, show full prompt immediately
                    if (isTypewriterActive && currentTypewriterPrompt) {
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

                    // CRITICAL: Preserve current slide position
                    const currentSlideBeforeBlur = activeIndex;

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
                    } else {
                    }

                    // Rule: If user has uploaded images, stay in user mode
                    if (hasUserImages) {
                        return; // Exit early - don't reset to demo mode
                    }

                    // If user didn't modify anything and has no user-added images, reset to demo mode
                    if (userDidNotModify && !hasUserImages && userHasTakenControl) {

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
                    markUserControl();

                    // Verify position preserved
                    if (activeIndex !== positionBeforeAction) {
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
                        markUserControl();

                        // Verify position preserved
                        if (activeIndex !== positionBeforeAction) {
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
                    markUserControl();

                    // Verify position preserved
                    if (activeIndex !== positionBeforeAction) {
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
