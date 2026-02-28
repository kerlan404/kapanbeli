/**
 * KAPAN BELI - SCROLL ANIMATIONS
 * Enhanced scroll animation handler
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        rootMargin: '-50px 0px',
        threshold: 0.05,
        staggerDelay: 50
    };

    // Observer instance
    let observer = null;

    /**
     * Initialize scroll animations
     */
    function initScrollAnimations() {
        // Create Intersection Observer
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered delay for multiple elements
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        
                        // Stop observing once visible (optional - remove if you want re-animation)
                        observer.unobserve(entry.target);
                    }, index * config.staggerDelay);
                }
            });
        }, {
            root: null,
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observe all animation elements
        const elementsToAnimate = document.querySelectorAll(
            '.animate-on-scroll, .animate-from-left, .animate-from-right, .animate-zoom, .animate-fade, .reveal-left, .reveal-right'
        );

        elementsToAnimate.forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Refresh observer (useful after dynamic content loading)
     */
    function refreshAnimations() {
        if (observer) {
            const elementsToAnimate = document.querySelectorAll(
                '.animate-on-scroll, .animate-from-left, .animate-from-right, .animate-zoom, .animate-fade, .reveal-left, .reveal-right'
            );
            
            elementsToAnimate.forEach(el => {
                if (!el.classList.contains('visible')) {
                    observer.observe(el);
                }
            });
        }
    }

    /**
     * Scroll to top functionality
     */
    function initScrollToTop() {
        let scrollBtn = document.querySelector('.scroll-to-top');
        
        // Create button if doesn't exist
        if (!scrollBtn) {
            scrollBtn = document.createElement('div');
            scrollBtn.className = 'scroll-to-top';
            scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            document.body.appendChild(scrollBtn);
        }

        // Show/hide on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        // Scroll to top on click
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Scroll progress indicator
     */
    function initScrollProgress() {
        let progressBar = document.querySelector('.scroll-progress');
        
        // Create progress bar if doesn't exist
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            progressBar.style.width = '0%';
            document.body.appendChild(progressBar);
        }

        // Update progress on scroll
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    /**
     * Parallax effect for elements with data-parallax attribute
     */
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            
            parallaxElements.forEach(el => {
                const speed = el.getAttribute('data-parallax') || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    /**
     * Initialize all animations on DOM ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initScrollAnimations();
                initScrollToTop();
                initScrollProgress();
                initParallax();
            });
        } else {
            initScrollAnimations();
            initScrollToTop();
            initScrollProgress();
            initParallax();
        }
    }

    // Expose functions globally
    window.KapanBeliAnimations = {
        init: init,
        refresh: refreshAnimations,
        initScrollAnimations: initScrollAnimations,
        initScrollToTop: initScrollToTop,
        initScrollProgress: initScrollProgress,
        initParallax: initParallax
    };

    // Auto-initialize
    init();

})();
