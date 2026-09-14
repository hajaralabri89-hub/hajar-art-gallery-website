/* ================================================
   HAJAR ART GALLERY — JAVASCRIPT
   Robust Error Handling
   Gallery System, Modals, PayPal Integration
   ================================================ */

'use strict';

/* ================================================
   GALLERY DATA
   FIX: Corrected "Unsopken" typo → "Unspoken" in
        the unspokenconnection photo filenames.
   ================================================ */
const galleries = {
    midnightbloom: {
        title: "Midnight Bloom",
        photos: [
            "Midnight Bloom.jpg",
            "Midnight Bloom1.jpg",
            "Midnight Bloom2.jpg",
            "Midnight Bloom3.jpg",
            "Midnight Bloom4.jpg"
        ]
    },
    whispersshoreline: {
        title: "Whispers of the Shoreline",
        photos: [
            "Whispers of the Shoreline1.jpeg",
            "Whispers of the Shoreline2.jpeg",
            "Whispers of the Shoreline3.jpeg",
            "Whispers of the Shoreline4.jpeg"
        ]
    },
    coastalquiet: {
        title: "Coastal Quiet",
        photos: [
            "Coastal Quiet1.jpeg",
            "Coastal Quiet2.jpeg",
            "Coastal Quiet3.jpeg",
            "Coastal Quiet4.jpeg"
        ]
    },
    celestial: {
        title: "Celestial Bloom",
        photos: ["Celestial Bloom1.jpg", "Celestial Bloom2.jpg"]
    },
    quietcurrent: {
        title: "Quiet Current",
        photos: [
            "Quiet Current.jpg",
            "Quiet Current1.jpg",
            "Quiet Current2.jpg",
            "Quiet Current3.jpg",
            "Quiet Current4.jpg"
        ]
    },
    emerald: {
        title: "Emerald Lake Glow — SOLD",
        photos: ["Emerald Lake Glow.jpg", "Emerald Lake Glow1.jpg", "Emerald Lake Glow2.jpg"]
    },
    housesbluehill: {
        title: "Houses on the Blue Hill",
        photos: [
            "House on the blue hill.jpeg",
            "House on the blue hill1.jpeg",
            "House on the blue hill2.jpeg",
            "House on the blue hill3.jpeg"
        ]
    },
    littlehill: {
        title: "Little Hill, Quiet Sea",
        photos: [
            "Little Hill, Quiet Sea.jpeg",
            "Little Hill, Quiet Sea left view.jpeg",
            "Little Hill, Quiet Sea middle view.jpeg",
            "Little Hill, Quiet Sea right view.jpeg"
        ]
    },
    sunsetmosaic: {
        title: "Sunset Mosaic Hills",
        photos: [
            "Sunset Mosaic Hills.jpg",
            "Sunset Mosaic Hills1.jpeg",
            "Sunset Mosaic Hills2.jpeg",
            "Sunset Mosaic Hills3.jpeg",
            "Sunset Mosaic Hills4.jpeg"
        ]
    },
    gatheredsilence: {
        title: "Gathered Silence",
        photos: [
            "Gathered Silence.jpg",
            "Gathered Silence1.jpg",
            "Gathered Silence2.jpg",
            "Gathered Silence3.jpg",
            "Gathered Silence4.jpg"
        ]
    },
    quiethorizongrove: {
        title: "Quiet Horizon Grove",
        photos: [
            "Quiet Horizon Grove.jpg",
            "Quiet Horizon Grove1.jpg",
            "Quiet Horizon Grove2.jpg",
            "Quiet Horizon Grove3.jpg",
            "Quiet Horizon Grove4.jpg",
            "Quiet Horizon Grove5.jpg",
            "Quiet Horizon Grove6.jpg"
        ]
    },
    unspokenconnection: {
        title: "Unspoken Connection — SOLD",
        photos: [
            "Unspoken connection.jpg",
            "Unspoken connection1.jpg",   // FIX: was "Unsopken connection1.jpg"
            "Unspoken connection2.jpg",   // FIX: was "Unsopken connection2.jpg"
            "Unspoken connection3.jpg"    // FIX: was "Unsopken connection3.jpg"
        ]
    },
    postcards: {
        title: "Art Collection Postcards",
        photos: ["PostcardArtCollection1.png", "PostcardArtCollection2.png", "PostcardArtCollection3.png"]
    },
    bluehill: {
        title: "Houses on Blue Hill Postcard",
        photos: ["postcardhousesonbluehill.png", "postcardhousesonbluehill1.png"]
    },
    bookmark1: {
        title: "Velvet Roots Bookmark",
        photos: [
            "Bookmark Velvet Roots and Chromatic Forest Dream.png",
            "Bookmark Velvet Roots and Chromatic Forest Dream1.png",
            "Bookmark Velvet Roots and Chromatic Forest Dream2.png",
            "Bookmark Velvet Roots and Chromatic Forest Dream3.png",
            "Bookmark Velvet Roots and Chromatic Forest Dream4.png"
        ]
    },
    bookmark2: {
        title: "Candy Hills Bookmark",
        photos: [
            "Candy Hills Art Bookmark.png",
            "Candy Hills Art Bookmark1.png",
            "Candy Hills Art Bookmark2.png",
            "Candy Hills Art Bookmark3.png",
            "Candy Hills Art Bookmark4.png",
            "Candy Hills Art Bookmark5.png"
        ]
    },
    chromaticforest: {
        title: "Chromatic Forest Dream — SOLD",
        photos: ["Chromatic Forest Dream.jpg"]
    },
    quietrise: {
        title: "Quiet Rise — SOLD",
        photos: ["Quiet Rise.jpg"]
    }
};

/* ================================================
   GALLERY STATE
   ================================================ */
let currentGallery = null;
let currentPhotoIndex = 0;

/* ================================================
   BODY SCROLL LOCK HELPERS
   FIX: Lock body scroll when gallery modal opens to
        prevent double-scrolling on mobile.
   ================================================ */
function lockBodyScroll() {
    document.body.classList.add('modal-open');
}

function unlockBodyScroll() {
    // Only unlock if no other modals are open
    const galleryOpen  = document.getElementById('galleryModal')?.classList.contains('gallery-modal--active');
    const inquiryOpen  = document.getElementById('inquiryModal')?.style.display === 'flex';
    if (!galleryOpen && !inquiryOpen) {
        document.body.classList.remove('modal-open');
    }
}

/* ================================================
   GALLERY FUNCTIONS
   ================================================ */

/**
 * Open gallery modal with the specified gallery ID.
 * @param {string} galleryId
 */
function openGallery(galleryId) {
    try {
        if (!galleries[galleryId]) {
            console.error(`Gallery "${galleryId}" not found`);
            return;
        }

        currentGallery     = galleries[galleryId];
        currentPhotoIndex  = 0;

        const modal       = document.getElementById('galleryModal');
        const titleEl     = document.getElementById('galleryTitle');
        const totalPhotos = document.getElementById('totalPhotos');

        if (!modal || !titleEl || !totalPhotos) {
            console.error('Gallery modal elements not found');
            return;
        }

        modal.classList.add('gallery-modal--active');
        titleEl.textContent     = currentGallery.title;
        totalPhotos.textContent = currentGallery.photos.length;

        lockBodyScroll();
        updateGalleryDisplay();
    } catch (error) {
        console.error('Error opening gallery:', error);
    }
}

/**
 * Close the gallery modal.
 */
function closeGallery() {
    try {
        const modal     = document.getElementById('galleryModal');
        const mainImage = document.getElementById('galleryMainImage');

        if (modal) {
            modal.classList.remove('gallery-modal--active');
        }
        if (mainImage) {
            mainImage.classList.remove('gallery-modal__image--zoomed');
        }

        unlockBodyScroll();
    } catch (error) {
        console.error('Error closing gallery:', error);
    }
}

/**
 * Navigate to the next or previous photo.
 * @param {number} direction  1 = next, -1 = previous
 */
function changePhoto(direction) {
    try {
        if (!currentGallery) return;

        currentPhotoIndex += direction;

        // Wrap around
        if (currentPhotoIndex < 0) {
            currentPhotoIndex = currentGallery.photos.length - 1;
        } else if (currentPhotoIndex >= currentGallery.photos.length) {
            currentPhotoIndex = 0;
        }

        const mainImage = document.getElementById('galleryMainImage');
        if (mainImage) {
            mainImage.classList.remove('gallery-modal__image--zoomed');
        }

        updateGalleryDisplay();
    } catch (error) {
        console.error('Error changing photo:', error);
    }
}

/**
 * Update gallery display with the current photo.
 * FIX: Prevents layout thrashing by batching DOM reads before writes,
 *      and only rebuilds thumbnails when the gallery changes (not on
 *      every navigation step — thumbnails are updated via class toggle).
 */
let _lastRenderedGallery = null;

function updateGalleryDisplay() {
    try {
        if (!currentGallery) return;

        const mainImage          = document.getElementById('galleryMainImage');
        const currentPhotoEl     = document.getElementById('currentPhoto');
        const thumbnailsContainer = document.getElementById('galleryThumbnails');

        if (!mainImage || !currentPhotoEl || !thumbnailsContainer) {
            console.error('Gallery display elements not found');
            return;
        }

        const photoSrc = currentGallery.photos[currentPhotoIndex];

        // --- Batch DOM writes ---

        // Update main image
        mainImage.src = photoSrc;
        mainImage.alt = currentGallery.title;
        mainImage.onerror = function () {
            console.warn(`Failed to load image: ${photoSrc}`);
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
        };

        // Update counter (single write, no layout read)
        currentPhotoEl.textContent = currentPhotoIndex + 1;

        // Rebuild thumbnails only when switching galleries (avoid full re-render on every nav)
        if (_lastRenderedGallery !== currentGallery) {
            _lastRenderedGallery = currentGallery;

            // Use a DocumentFragment to avoid repeated reflows
            const fragment = document.createDocumentFragment();
            currentGallery.photos.forEach((photo, index) => {
                const thumb = document.createElement('img');
                thumb.src   = photo;
                thumb.alt   = `${currentGallery.title} — view ${index + 1}`;
                thumb.className = 'gallery-modal__thumbnail' +
                    (index === currentPhotoIndex ? ' gallery-modal__thumbnail--active' : '');
                thumb.loading = 'lazy';

                thumb.onerror = function () { this.style.display = 'none'; };
                thumb.onclick = () => {
                    currentPhotoIndex = index;
                    const mainImg = document.getElementById('galleryMainImage');
                    if (mainImg) mainImg.classList.remove('gallery-modal__image--zoomed');
                    updateGalleryDisplay();
                };

                fragment.appendChild(thumb);
            });

            thumbnailsContainer.innerHTML = '';
            thumbnailsContainer.appendChild(fragment);
        } else {
            // Gallery unchanged — just update active thumbnail class
            const thumbs = thumbnailsContainer.querySelectorAll('.gallery-modal__thumbnail');
            thumbs.forEach((thumb, index) => {
                thumb.classList.toggle('gallery-modal__thumbnail--active', index === currentPhotoIndex);
            });
        }

    } catch (error) {
        console.error('Error updating gallery display:', error);
    }
}

/**
 * Toggle zoom on main gallery image.
 */
function toggleZoom() {
    try {
        const mainImage = document.getElementById('galleryMainImage');
        if (mainImage) {
            mainImage.classList.toggle('gallery-modal__image--zoomed');
        }
    } catch (error) {
        console.error('Error toggling zoom:', error);
    }
}

/* ================================================
   ARTWORK DETAILS FUNCTIONS
   ================================================ */

/**
 * Toggle artwork details expansion.
 * @param {string} detailsId
 */
function toggleDetails(detailsId) {
    try {
        const details = document.getElementById(detailsId);
        if (!details) {
            console.error(`Details element "${detailsId}" not found`);
            return;
        }

        const isExpanding = !details.classList.contains('artwork-card__details--expanded');
        details.classList.toggle('artwork-card__details--expanded');

        // Update aria-expanded on the matching button
        const btn = document.querySelector(`[aria-controls="${detailsId}"]`);
        if (btn) btn.setAttribute('aria-expanded', isExpanding ? 'true' : 'false');

        if (isExpanding) {
            setTimeout(() => {
                const card = details.closest('.artwork-card');
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        }
    } catch (error) {
        console.error('Error toggling details:', error);
    }
}

/* ================================================
   INQUIRY MODAL FUNCTIONS
   ================================================ */

/**
 * Open inquiry modal for a specific artwork.
 * @param {string} artworkName
 */
function openInquiry(artworkName) {
    try {
        const modal       = document.getElementById('inquiryModal');
        const artworkInput = document.getElementById('artworkName');

        if (!modal) {
            console.error('Inquiry modal not found');
            return;
        }

        modal.style.display = 'flex';
        if (artworkInput) artworkInput.value = artworkName;

        lockBodyScroll();
    } catch (error) {
        console.error('Error opening inquiry modal:', error);
    }
}

/**
 * Close inquiry modal.
 */
function closeModal() {
    try {
        const modal = document.getElementById('inquiryModal');
        if (modal) modal.style.display = 'none';
        unlockBodyScroll();
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

/* ================================================
   PAYPAL FUNCTIONS
   ================================================ */

/**
 * Show / hide a PayPal container.
 * @param {string} containerId
 */
function showPayPal(containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`PayPal container "${containerId}" not found`);
            return;
        }
        container.classList.toggle('product-card__paypal-container--visible');
    } catch (error) {
        console.error('Error showing PayPal:', error);
    }
}

/* ================================================
   PAYPAL INITIALIZATION
   ================================================ */
function initializePayPal() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK not loaded. Buy buttons will not work.');
        return;
    }

    const buttons = [
        { containerId: 'paypal-container-UU98YLYC4VWEQ', hostedButtonId: 'UU98YLYC4VWEQ' },
        { containerId: 'paypal-container-JFLZR7HDL4QEE', hostedButtonId: 'JFLZR7HDL4QEE' },
        { containerId: 'paypal-container-JDCUGJP5UXL92', hostedButtonId: 'JDCUGJP5UXL92' },
        { containerId: 'paypal-container-4UN88NDECRJDG', hostedButtonId: '4UN88NDECRJDG' },
    ];

    buttons.forEach(({ containerId, hostedButtonId }) => {
        try {
            const container = document.getElementById(containerId);
            if (container) {
                paypal.HostedButtons({ hostedButtonId }).render(`#${containerId}`);
            }
        } catch (err) {
            console.error(`Error rendering PayPal button ${hostedButtonId}:`, err);
        }
    });
}

/* ================================================
   KEYBOARD NAVIGATION
   ================================================ */
function initializeKeyboardNav() {
    try {
        document.addEventListener('keydown', function (e) {
            const galleryModal  = document.getElementById('galleryModal');
            const inquiryModal  = document.getElementById('inquiryModal');
            const galleryOpen   = galleryModal?.classList.contains('gallery-modal--active');
            const inquiryOpen   = inquiryModal?.style.display === 'flex';

            if (galleryOpen) {
                switch (e.key) {
                    case 'Escape':    closeGallery();    break;
                    case 'ArrowLeft': changePhoto(-1);   break;
                    case 'ArrowRight':changePhoto(1);    break;
                }
            } else if (inquiryOpen && e.key === 'Escape') {
                closeModal();
            }
        });
    } catch (error) {
        console.error('Error initializing keyboard navigation:', error);
    }
}

/* ================================================
   MODAL BACKGROUND CLICK HANDLER
   ================================================ */
function initializeModalClickHandler() {
    try {
        document.addEventListener('click', function (event) {
            const galleryModal = document.getElementById('galleryModal');
            const inquiryModal = document.getElementById('inquiryModal');

            // Close gallery when clicking the dark overlay (not inner content)
            if (event.target === galleryModal) {
                closeGallery();
            }

            // Close inquiry when clicking outside modal content
            if (event.target === inquiryModal) {
                closeModal();
            }
        });
    } catch (error) {
        console.error('Error initializing modal click handler:', error);
    }
}

/* ================================================
   IMAGE ERROR HANDLING
   ================================================ */
function initializeImageErrorHandling() {
    try {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function () {
                if (!this.dataset.errorHandled) {
                    this.dataset.errorHandled = 'true';
                    console.warn(`Failed to load image: ${this.src}`);
                    this.style.opacity = '0.4';
                    this.alt = this.alt || 'Image not available';
                }
            });
        });
    } catch (error) {
        console.error('Error initializing image error handling:', error);
    }
}

/* ================================================
   INITIALIZATION
   ================================================ */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Hajar Art Gallery — Initializing...');

    try {
        initializeKeyboardNav();
        initializeModalClickHandler();
        initializeImageErrorHandling();

        if (typeof paypal !== 'undefined') {
            initializePayPal();
        } else {
            window.addEventListener('load', initializePayPal);
        }

        console.log('Hajar Art Gallery — Ready!');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

/* ================================================
   GLOBAL EXPORTS
   Required for inline onclick handlers in HTML
   ================================================ */
window.openGallery   = openGallery;
window.closeGallery  = closeGallery;
window.changePhoto   = changePhoto;
window.toggleZoom    = toggleZoom;
window.toggleDetails = toggleDetails;
window.openInquiry   = openInquiry;
window.closeModal    = closeModal;
window.showPayPal    = showPayPal;
