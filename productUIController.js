// ProductUIController.js
var ProductUIController = pc.createScript('productUIController');

// Product related
ProductUIController.attributes.add('product', {
    type: 'entity',
    title: 'Product'
});

ProductUIController.attributes.add('cameraFocusPoint', {
    type: 'entity',
    title: 'Camera Focus Point'
});

// Tap to experience related
ProductUIController.attributes.add('tapToExperienceScreen', {
    type: 'entity',
    title: 'Tap To Experience Screen'
});

ProductUIController.attributes.add('tapToExperienceButton', {
    type: 'entity',
    title: 'Tap To Experience Button'
});

// Product UI related
ProductUIController.attributes.add('productUI', {
    type: 'entity',
    title: 'Product UI'
});

ProductUIController.attributes.add('colorButtons', {
    type: 'entity',
    array: true,
    title: 'Color Buttons'
});

ProductUIController.attributes.add('features', {
    type: 'json',
    array: true,
    title: 'Features',
    schema: [{
        name: 'button',
        type: 'entity',
        title: 'Feature Button'
    }, {
        name: 'isVideo',
        type: 'boolean',
        title: 'Is Video'
    }, {
        name: 'videoAsset',
        type: 'asset',
        title: 'Video Asset'
    }, {
        name: 'imageAsset',
        type: 'asset',
        title: 'Image Asset'
    }]
});

// Feature screen related
ProductUIController.attributes.add('featureScreen', {
    type: 'entity',
    title: 'Feature Screen'
});

ProductUIController.attributes.add('displayArea', {
    type: 'entity',
    title: 'Display Area'
});

// Back buttons
ProductUIController.attributes.add('productUIBackButton', {
    type: 'entity',
    title: 'Product UI Back Button'
});

ProductUIController.attributes.add('featureScreenCloseButton', {
    type: 'entity',
    title: 'Feature Screen Close Button'
});

// Camera references
ProductUIController.attributes.add('camera', {
    type: 'entity',
    title: 'Camera Entity'
});

ProductUIController.attributes.add('cameraController', {
    type: 'entity',
    title: 'Camera Controller Entity'
});

ProductUIController.attributes.add('rotationSpeed', {
    type: 'number',
    default: 2,
    title: 'Rotation Speed'
});

ProductUIController.prototype.initialize = function() {
    // Initial states
    this.productUI.enabled = false;
    this.featureScreen.enabled = false;
    this.tapToExperienceScreen.enabled = false;

    // Store initial rotation
    if (this.product) {
        this.initialRotation = this.product.getEulerAngles().clone();
        console.log('Stored initial product rotation:', this.initialRotation.toString());
    }

    this.isDragging = false;
    this.lastMouseX = 0;
    this.currentYRotation = this.initialRotation ? this.initialRotation.y : 0;

    this.setupButtons();
    this.setupProductRotation();
};

ProductUIController.prototype.setupButtons = function() {
    // Tap to experience
    if (this.tapToExperienceButton && this.tapToExperienceButton.element) {
        this.tapToExperienceButton.element.on('click', () => {
            this.onTapToExperience();
        });
    }

    // Color buttons
    this.colorButtons.forEach((button, index) => {
        if (button && button.element) {
            button.element.on('click', () => {
                console.log('Color changed to index:', index);
            });
        }
    });

    // Feature buttons
    this.features.forEach((feature, index) => {
        if (feature.button && feature.button.element) {
            feature.button.element.on('click', () => {
                this.showFeature(index);
            });
        }
    });

    // Back buttons
    if (this.productUIBackButton && this.productUIBackButton.element) {
        this.productUIBackButton.element.on('click', () => {
            this.hideProductUI();
        });
    }

    if (this.featureScreenCloseButton && this.featureScreenCloseButton.element) {
        this.featureScreenCloseButton.element.on('click', () => {
            this.hideFeatureScreen();
        });
    }
};

ProductUIController.prototype.onTapToExperience = function() {
    // Hide tap to experience screen
    this.tapToExperienceScreen.enabled = false;
    
    // Force stop rotation
    if (this.product && this.initialRotation) {
        this.product.setEulerAngles(
            this.initialRotation.x,
            this.initialRotation.y,
            this.initialRotation.z
        );
    }
    
    // Lock camera movement
    if (this.cameraController && 
        this.cameraController.script.cameraController) {
        this.cameraController.script.cameraController.lock();
    }
    
    // Move camera to focus position
    if (this.cameraController && 
        this.cameraController.script.cameraController) {
        this.cameraController.script.cameraController.moveToPosition(
            this.cameraFocusPoint.getPosition()
        );
    }

    // Show product UI
    this.productUI.enabled = true;
};

ProductUIController.prototype.showFeature = function(featureIndex) {
    const feature = this.features[featureIndex];
    if (!feature || !this.featureScreen || !this.displayArea) return;

    this.featureScreen.enabled = true;
    const displayMaterial = this.displayArea.render.material;
    
    try {
        if (feature.isVideo && feature.videoAsset) {
            console.log('Setting up video feature');
            // Create and setup video player
            this.setupVideoPlayer(feature.videoAsset, displayMaterial);
        } else if (!feature.isVideo && feature.imageAsset) {
            console.log('Setting up image feature');
            // Cleanup any existing video player
            this.cleanupVideoPlayer();
            
            // Set the image to emissive map
            if (displayMaterial) {
                displayMaterial.emissiveMap = feature.imageAsset.resource;
                displayMaterial.update();
            }
        }
    } catch (error) {
        console.error('Error setting up feature:', error);
    }
};

ProductUIController.prototype.hideFeatureScreen = function() {
    if (this.featureScreen) {
        this.featureScreen.enabled = false;
        
        // Cleanup video if exists
        this.cleanupVideoPlayer();
        
        // Reset display material
        if (this.displayArea && this.displayArea.render) {
            const material = this.displayArea.render.material;
            if (material) {
                material.emissiveMap = null;
                material.useLighting = true;
                material.update();
            }
        }
    }
};

ProductUIController.prototype.hideProductUI = function() {
    // Hide all UI
    this.productUI.enabled = false;
    this.featureScreen.enabled = false;
    
    // Reset product rotation
    if (this.product) {
        this.product.setEulerAngles(0, 0, 0);
    }
    
    // Enable tap to experience
    this.tapToExperienceScreen.enabled = true;
    
    // Unlock camera movement
    if (this.cameraController && 
        this.cameraController.script.cameraController) {
        this.cameraController.script.cameraController.unlock();
    }
    
    // Return camera to waypoint
    if (this.cameraController && 
        this.cameraController.script.cameraController) {
        this.cameraController.script.cameraController.returnToWaypoint();
    }
    
    // Explicitly start auto-rotation again
    this.app.fire('product:startRotation', this.product);
};
ProductUIController.prototype.setupProductRotation = function() {
    // Store bound event handlers
    this.onMouseDown = (e) => {
        if (this.productUI && this.productUI.enabled) {
            console.log('Mouse down detected');
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.currentYRotation = this.product.getEulerAngles().y;
        }
    };

    this.onMouseMove = (e) => {
        if (this.isDragging && this.productUI && this.productUI.enabled && this.product) {
            const deltaX = e.clientX - this.lastMouseX;
            this.currentYRotation += deltaX * this.rotationSpeed * 0.1;
            
            // Apply rotation preserving initial X and Z
            this.product.setEulerAngles(
                this.initialRotation.x,
                this.currentYRotation,
                this.initialRotation.z
            );
            
            this.lastMouseX = e.clientX;
        }
    };



    this.onMouseUp = () => {
        this.isDragging = false;
    };

    this.onTouchStart = (e) => {
        if (this.productUI && this.productUI.enabled) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
        }
    };

    this.onTouchMove = (e) => {
        if (this.isDragging && this.productUI && this.productUI.enabled && this.product) {
            const deltaX = e.touches[0].clientX - this.lastMouseX;
            const currentRotation = this.product.getEulerAngles();
            this.product.setEulerAngles(
                currentRotation.x,
                currentRotation.y + (deltaX * this.rotationSpeed * 0.1),
                currentRotation.z
            );
            this.lastMouseX = e.touches[0].clientX;
        }
    };

    this.onTouchEnd = () => {
        this.isDragging = false;
    };

    // Add event listeners
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    
    window.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.onTouchEnd);
};

ProductUIController.prototype.getInputX = function(event) {
    // Handle both mouse and touch events
    if (event.touches) {
        return event.touches[0].clientX;
    }
    return event.clientX;
};


ProductUIController.prototype.setupVideoPlayer = function(videoAsset, screenMaterial) {
    // Create video element
    const video = document.createElement('video');
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.autoplay = false;

    // Hide video in DOM
    const style = video.style;
    style.width = '1px';
    style.height = '1px';
    style.position = 'absolute';
    style.opacity = '0';
    style.zIndex = '-1000';
    style.pointerEvents = 'none';
    document.body.appendChild(video);

    // Create video texture
    const videoTexture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: false
    });
    videoTexture.setSource(video);

    // Set video source
    video.src = videoAsset.getFileUrl();
    video.load();

    // Store references for cleanup
    this.currentVideo = video;
    this.currentVideoTexture = videoTexture;

    // Handle video ready
    video.addEventListener('canplaythrough', () => {
        if (screenMaterial) {
            screenMaterial.emissiveMap = videoTexture;
            screenMaterial.useLighting = false;
            screenMaterial.update();
            
            video.play().catch(error => {
                console.warn("Video play was prevented:", error);
            });
        }
    }, { once: true });

    // Setup update function for texture
    this.videoUpdateCallback = () => {
        if (videoTexture) {
            videoTexture.upload();
        }
    };
    
    // Start updating the texture
    this.app.on('update', this.videoUpdateCallback);

    // Fix Autoplay Issues
    const resumeAudioContext = () => {
        if (this.app.systems.sound && this.app.systems.sound.context && this.app.systems.sound.context.state !== 'running') {
            this.app.systems.sound.context.resume().then(() => {
                video.play().catch(console.error);
            }).catch(console.error);
        }
    };

    document.addEventListener("click", resumeAudioContext, { once: true });
    document.addEventListener("touchstart", resumeAudioContext, { once: true });
};

ProductUIController.prototype.cleanupVideoPlayer = function() {
    // Remove update callback
    if (this.videoUpdateCallback) {
        this.app.off('update', this.videoUpdateCallback);
        this.videoUpdateCallback = null;
    }

    // Cleanup video
    if (this.currentVideo) {
        this.currentVideo.pause();
        this.currentVideo.remove();
        this.currentVideo = null;
    }

    // Destroy texture
    if (this.currentVideoTexture) {
        this.currentVideoTexture.destroy();
        this.currentVideoTexture = null;
    }
};

ProductUIController.prototype.destroy = function() {
    // Remove event listeners
    if (this.onMouseDown) {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
    
    this.cleanupVideoPlayer();
};