// ProductManager.js
var ProductManager = pc.createScript('productManager');

ProductManager.attributes.add('productConfigs', {
    type: 'json',
    array: true,
    title: 'Product Configurations',
    schema: [{
        name: 'product',
        type: 'entity',
        title: 'Product Model'
    }, {
        name: 'focusPosition',
        type: 'entity',
        title: 'Focus Position'
    }, {
        name: 'productUIPanel',
        type: 'entity',
        title: 'Product UI Panel'
    }, {
        name: 'tapToExperience',
        type: 'entity',
        title: 'Tap To Experience Button'
    }]
});

// Change this to reference the camera entity directly
ProductManager.attributes.add('camera', {
    type: 'entity',
    title: 'Camera Entity'
});

// Keep this for accessing camera controller functionality
ProductManager.attributes.add('cameraController', {
    type: 'entity',
    title: 'Camera Controller Entity'
});

ProductManager.attributes.add('proximityThreshold', {
    type: 'number',
    default: 5,
    title: 'Proximity Threshold',
    description: 'Distance at which camera is considered near product'
});

ProductManager.prototype.initialize = function() {
    this.currentProductIndex = -1;
    this.rotatingProducts = new Map();
    this.initialRotations = new Map();
    
    console.log("Initializing ProductManager");
    
    // Store initial rotations and setup rotation states
    this.productConfigs.forEach((config, index) => {
        if (config.product) {
            // Store initial rotation
            const initialRotation = config.product.getEulerAngles().clone();
            this.initialRotations.set(config.product, initialRotation);
            this.rotatingProducts.set(config.product, true);
            
            // Setup UI elements - keep them independent of product rotation
            if (config.productUIPanel) {
                // Set UI panel to world space or make it a child of the scene
                config.productUIPanel.reparent(this.app.root);
                config.productUIPanel.enabled = false;
            }
            
            if (config.tapToExperience) {
                // Set tap to experience to world space
                if (config.tapToExperience.parent) {
                    config.tapToExperience.parent.reparent(this.app.root);
                }
                config.tapToExperience.enabled = false;
            }
            
            console.log(`Initial rotation for product ${index}:`, initialRotation.toString());
        }
    });
    
    this.setupProducts();
    this.app.on('camera:reachedWaypoint', this.onCameraReachedWaypoint, this);
};


// ProductManager.js
ProductManager.prototype.stopProductRotation = function(product) {
    if (product) {
        console.log('Stopping product rotation');
        this.rotatingProducts.set(product, false);
        
        // Find the config for this product
        const config = this.productConfigs.find(cfg => cfg.product === product);
        if (config) {
            // Reset UI orientations when stopping
            if (config.productUIPanel) {
                config.productUIPanel.setLocalEulerAngles(0, -product.getEulerAngles().y, 0);
            }
            if (config.tapToExperience && config.tapToExperience.parent) {
                config.tapToExperience.parent.setLocalEulerAngles(0, -product.getEulerAngles().y, 0);
            }
        }
    }
};

ProductManager.prototype.stopProductRotation = function(product) {
    if (product) {
        console.log('Stopping product rotation');
        this.rotatingProducts.set(product, false);
        
        // Reset to initial rotation that we stored
        const initialRotation = this.initialRotations.get(product);
        if (initialRotation) {
            product.setEulerAngles(
                initialRotation.x,
                initialRotation.y,
                initialRotation.z
            );
        }
    }
};

ProductManager.prototype.handleProductRotation = function(product) {
    if (product && this.rotatingProducts.has(product)) {
        console.log('Restarting product rotation');
        this.rotatingProducts.set(product, true);
        
        // Make sure product is visible
        product.enabled = true;
        
        // Find the config for this product
        const config = this.productConfigs.find(cfg => cfg.product === product);
        if (config) {
            // Reset UI states
            if (config.productUIPanel) {
                config.productUIPanel.enabled = false;
            }
            if (config.tapToExperience) {
                config.tapToExperience.enabled = true;
            }
        }
    }
};

ProductManager.prototype.debugProductConfigs = function() {
    console.log("Number of product configs:", this.productConfigs ? this.productConfigs.length : 0);
    
    if (this.productConfigs) {
        this.productConfigs.forEach((config, index) => {
            console.log(`Product ${index} configuration:`);
            console.log("- Product:", config.product ? "Found" : "Missing");
            console.log("- Focus Position:", config.focusPosition ? "Found" : "Missing");
            console.log("- UI Panel:", config.productUIPanel ? "Found" : "Missing");
            console.log("- Tap To Experience:", config.tapToExperience ? "Found" : "Missing");
            const initialRotation = config.product.getEulerAngles().clone();
            this.initialRotations.set(config.product, initialRotation);
            console.log(`Initial rotation for product ${index}:`, initialRotation.toString());
            if (config.tapToExperience) {
                console.log("  - Has Element Component:", config.tapToExperience.element ? "Yes" : "No");
            }
        });
    }
    const config = this.productConfigs[index];
    if (config) {
        console.log('UI State Debug:', {
            productRotation: config.product.getEulerAngles().toString(),
            uiPanelRotation: config.productUIPanel ? 
                config.productUIPanel.getLocalEulerAngles().toString() : 'N/A',
            uiPanelEnabled: config.productUIPanel ? 
                config.productUIPanel.enabled : 'N/A',
            tapButtonRotation: config.tapToExperience ? 
                config.tapToExperience.getLocalEulerAngles().toString() : 'N/A',
            tapButtonEnabled: config.tapToExperience ? 
                config.tapToExperience.enabled : 'N/A'
        });
    }
};

ProductManager.prototype.setupProducts = function() {
    this.productConfigs.forEach((config, index) => {
        if (!config.product) {
            console.warn(`Product not found for config ${index}`);
            return;
        }
        
        // Log product position
        console.log(`Product ${index} Position:`, config.product.getPosition().toString());
        
        // Initialize rotation state
        this.rotatingProducts.set(config.product, true);
        console.log(`Started rotation for product ${index}`);
        
        // Setup UI elements
        if (config.productUIPanel) {
            config.productUIPanel.enabled = false;
            // Ensure UI is properly oriented in world space
            config.productUIPanel.setLocalEulerAngles(0, 0, 0);
        }
        
        if (config.tapToExperience) {
            if (!config.tapToExperience.element) {
                console.error(`Tap to experience button ${index} missing Element component!`);
                return;
            }
            
            config.tapToExperience.enabled = false;
            // Ensure button is properly oriented in world space
            if (config.tapToExperience.parent) {
                config.tapToExperience.parent.setLocalEulerAngles(0, 0, 0);
            }
            
            config.tapToExperience.element.on('click', () => {
                console.log(`Tap to experience clicked for product ${index}`);
                this.onTapToExperience(index);
            });
        }
    });
};

ProductManager.prototype.update = function(dt) {
    // Update product rotations
    this.productConfigs.forEach((config, index) => {
        if (config.product && this.rotatingProducts.get(config.product) === true) {
            // Only rotate the product entity itself, not its children
            const productModel = config.product;
            productModel.rotate(0, 90 * dt, 0);
            
            // Keep UI elements at their original rotation
            if (config.productUIPanel) {
                const currentProductRotation = productModel.getEulerAngles().y;
                // Counter-rotate UI to keep it facing camera
                config.productUIPanel.setLocalEulerAngles(0, -currentProductRotation, 0);
            }
            
            if (config.tapToExperience && config.tapToExperience.parent) {
                const currentProductRotation = productModel.getEulerAngles().y;
                // Counter-rotate tap to experience to keep it facing camera
                config.tapToExperience.parent.setLocalEulerAngles(0, -currentProductRotation, 0);
            }
        }
    });

    // Check camera proximity
    if (this.camera) {
        const cameraPosition = this.camera.getPosition();
        
        this.productConfigs.forEach((config, index) => {
            if (config.product) {
                const productPosition = config.product.getPosition();
                const distance = this.getDistance(cameraPosition, productPosition);
                
                if (distance < this.proximityThreshold) {
                    if (this.rotatingProducts.get(config.product) === true) {
                        console.log(`Camera near product ${index} - stopping rotation`);
                        this.stopProductRotation(config.product);
                        
                        if (config.tapToExperience) {
                            config.tapToExperience.enabled = true;
                        }
                    }
                }
            }
        });
    }
};


ProductManager.prototype.getDistance = function(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
};

ProductManager.prototype.handleProductProximity = function(index, isNear) {
    const config = this.productConfigs[index];
    if (!config) return;

    if (isNear) {
        // Stop rotation and reset to initial rotation
        this.rotatingProducts.set(config.product, false);
        const initialRotation = this.initialRotations.get(config.product);
        if (initialRotation) {
            config.product.setEulerAngles(
                initialRotation.x,
                initialRotation.y,
                initialRotation.z
            );
        }
        
        // Enable tap to experience
        if (config.tapToExperience) {
            config.tapToExperience.enabled = true;
            if (config.tapToExperience.parent) {
                config.tapToExperience.parent.enabled = true;
            }
        }
    } else {
        // Start rotation from initial rotation
        this.rotatingProducts.set(config.product, true);
        
        // Disable tap to experience
        if (config.tapToExperience) {
            config.tapToExperience.enabled = false;
            if (config.tapToExperience.parent) {
                config.tapToExperience.parent.enabled = false;
            }
        }
    }
};

ProductManager.prototype.onCameraReachedWaypoint = function(waypointIndex) {
    console.log(`Camera reached waypoint ${waypointIndex}`);
    
    // Reset all products
    this.productConfigs.forEach((config, index) => {
        this.rotatingProducts.set(config.product, true);
        if (config.tapToExperience) {
            config.tapToExperience.enabled = false;
        }
    });

    // Handle the product at current waypoint
    const config = this.productConfigs[waypointIndex];
    if (config) {
        this.rotatingProducts.set(config.product, false);
        if (config.tapToExperience) {
            config.tapToExperience.enabled = true;
            console.log(`Enabled tap to experience for waypoint ${waypointIndex}`);
        }
    }
};

ProductManager.prototype.onTapToExperience = function(index) {
    const config = this.productConfigs[index];
    if (!config) return;

    // Stop rotation
    this.rotatingProducts.set(config.product, false);

    // Move camera to focus position
    if (this.cameraController && 
        this.cameraController.script.cameraController && 
        config.focusPosition) {
        console.log('Moving camera to focus position');
        this.cameraController.script.cameraController.moveToPosition(config.focusPosition.getPosition());
    }

    // Enable product UI and ensure it's facing camera
    if (config.productUIPanel) {
        config.productUIPanel.enabled = true;
        config.productUIPanel.setLocalEulerAngles(0, -config.product.getEulerAngles().y, 0);
    }

    // Disable tap to experience button
    if (config.tapToExperience) {
        config.tapToExperience.enabled = false;
        if (config.tapToExperience.parent) {
            config.tapToExperience.parent.enabled = false;
        }
    }
};