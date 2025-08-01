
export const generateCarouselScript = (totalSlides: number): string => {
  return `
    (function() {
        let currentSlide = 0;
        const totalSlides = ${totalSlides};
        let autoRotateInterval;
        let isPaused = false;
        
        const wrapper = document.getElementById('carouselWrapper');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const dots = document.querySelectorAll('.dot');
        
        function updateCarousel() {
            const translateX = -currentSlide * 100;
            wrapper.style.transform = \`translateX(\${translateX}%)\`;
            
            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
            
            // Update button states
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === totalSlides - 1;
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateCarousel();
            } else {
                currentSlide = 0;
                updateCarousel();
            }
        }
        
        function prevSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                updateCarousel();
            }
        }
        
        function goToSlide(slideIndex) {
            currentSlide = slideIndex;
            updateCarousel();
        }
        
        // Event listeners
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', nextSlide);
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });
        
        // Auto-rotate every 10 seconds (reduced from 5 to minimize interference)
        function startAutoRotate() {
            if (!isPaused) {
                autoRotateInterval = setInterval(nextSlide, 10000);
            }
        }
        
        function stopAutoRotate() {
            clearInterval(autoRotateInterval);
        }
        
        function pauseWidget() {
            isPaused = true;
            stopAutoRotate();
        }
        
        function resumeWidget() {
            isPaused = false;
            startAutoRotate();
        }
        
        // Listen for editor save operations (Lovable-specific)
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'EDITOR_SAVE_START') {
                pauseWidget();
            } else if (event.data && event.data.type === 'EDITOR_SAVE_END') {
                resumeWidget();
            }
        });
        
        // Pause auto-rotate on hover
        const container = document.querySelector('.trading-widget-container');
        container.addEventListener('mouseenter', stopAutoRotate);
        container.addEventListener('mouseleave', () => {
            if (!isPaused) startAutoRotate();
        });
        
        // Initialize
        updateCarousel();
        startAutoRotate();
        
        // Refresh data every 60 seconds (increased from 30 to reduce interference)
        let refreshInterval = setInterval(() => {
            if (!isPaused && !document.hidden) {
                window.location.reload();
            }
        }, 60000);
        
        // Clear intervals on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(autoRotateInterval);
            clearInterval(refreshInterval);
        });
        
        // Pause when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseWidget();
            } else {
                resumeWidget();
            }
        });
    })();
  `;
};
