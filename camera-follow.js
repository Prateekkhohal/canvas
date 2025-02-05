var CameraController = pc.createScript('cameraController');

CameraController.attributes.add('camera', {
    type: 'entity',
    title: 'Camera Entity'
});

CameraController.attributes.add('waypoints', {
    type: 'entity',
    array: true,
    title: 'Waypoints'
});

// Add speed control attributes
CameraController.attributes.add('moveSpeed', {
    type: 'number',
    default: 0.5,
    title: 'Movement Speed',
    description: 'Speed of camera movement (0.1 to 2.0)',
    min: 0.1,
    max: 2.0
});

CameraController.attributes.add('rotationSpeed', {
    type: 'number',
    default: 0.5,
    title: 'Rotation Speed',
    description: 'Speed of camera rotation (0.1 to 2.0)',
    min: 0.1,
    max: 2.0
});

CameraController.attributes.add('smoothFactor', {
    type: 'number',
    default: 1,
    title: 'Smooth Factor',
    description: 'Smoothness of camera movement (0.1 to 2.0)',
    min: 0.1,
    max: 2.0
});

CameraController.attributes.add('isLocked', {
    type: 'boolean',
    default: false,
    title: 'Is Locked'
});


CameraController.prototype.initialize = function() {
    // Initialize variables
    this.currentWaypointIndex = 0;
    this.isMoving = false;
    this.moveProgress = 0;
    
    // Log initial setup
    console.log("Camera Controller Initialized");
    console.log("Number of waypoints:", this.waypoints.length);
    
    // Reset camera to first waypoint
    if (this.waypoints.length > 0) {
        const startPos = this.waypoints[0].getPosition();
        const startRot = this.waypoints[0].getEulerAngles();
        this.camera.setPosition(startPos);
        this.camera.setEulerAngles(startRot);
    }

    // Setup scroll listener
    this.setupScrollHandler();
};

CameraController.prototype.lock = function() {
    this.isLocked = true;
    console.log('Camera movement locked');
};

CameraController.prototype.unlock = function() {
    this.isLocked = false;
    console.log('Camera movement unlocked');
};

CameraController.prototype.setupScrollHandler = function() {
    var self = this;
    
    window.addEventListener('wheel', function(e) {
        // Don't handle scroll if locked or already moving
        if (self.isLocked || self.isMoving) return;
        
        if (e.deltaY > 0) {
            // Scroll down - move to next waypoint
            if (self.currentWaypointIndex < self.waypoints.length - 1) {
                self.currentWaypointIndex++;
                self.moveToWaypoint();
            }
        } else {
            // Scroll up - move to previous waypoint
            if (self.currentWaypointIndex > 0) {
                self.currentWaypointIndex--;
                self.moveToWaypoint();
            }
        }
    });
};

CameraController.prototype.moveToPosition = function(position) {
    // console.log("Camera moving to position:", position);
    // Create temporary waypoint
    const tempWaypoint = new pc.Entity();
    tempWaypoint.setPosition(position);
    
    // Store current waypoint index
    const previousIndex = this.currentWaypointIndex;
    
    // Add temporary waypoint
    this.waypoints.push(tempWaypoint);
    this.currentWaypointIndex = this.waypoints.length - 1;
    
    // Move to position
    this.moveToWaypoint();
    
    // Clean up
    this.waypoints.pop();
    this.currentWaypointIndex = previousIndex;
};

CameraController.prototype.returnToWaypoint = function() {
    // Move back to current waypoint
    this.moveToWaypoint();
};


CameraController.prototype.moveToWaypoint = function() {
    if (this.currentWaypointIndex >= this.waypoints.length) return;
    
    this.isMoving = true;
    this.moveProgress = 0;
    
    // Store start and target positions/rotations
    this.startPos = this.camera.getPosition().clone();
    this.startRot = this.camera.getEulerAngles().clone();
    
    this.targetPos = this.waypoints[this.currentWaypointIndex].getPosition().clone();
    this.targetRot = this.waypoints[this.currentWaypointIndex].getEulerAngles().clone();
    
    // Calculate distance for speed adjustment
    this.totalDistance = this.startPos.distance(this.targetPos);
    
    // console.log("Moving to waypoint:", this.currentWaypointIndex);
    // console.log("From:", this.startPos, "To:", this.targetPos);
};

CameraController.prototype.update = function(dt) {
    if (!this.isMoving) return;

    // Update progress based on speed and distance
    const speedMultiplier = this.moveSpeed * (1 / Math.max(1, this.totalDistance * 0.1));
    this.moveProgress += dt * speedMultiplier * this.smoothFactor;
    
    if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.isMoving = false;
        this.app.fire('camera:reachedWaypoint', this.currentWaypointIndex);
    }

    // Calculate smooth interpolation
    var t = this.smoothStep(this.moveProgress);

    // Interpolate position
    var newPos = new pc.Vec3();
    newPos.lerp(this.startPos, this.targetPos, t);
    
    // Interpolate rotation with separate speed
    var rotT = Math.min(1, this.moveProgress * this.rotationSpeed * 2);
    var newRot = new pc.Vec3();
    newRot.lerp(this.startRot, this.targetRot, this.smoothStep(rotT));

    // Apply new position and rotation
    this.camera.setPosition(newPos);
    this.camera.setEulerAngles(newRot);

    // Debug output
    if (t === 1) {
        console.log("Movement complete");
        // console.log("Final position:", this.camera.getPosition());
    }
};

CameraController.prototype.smoothStep = function(t) {
    // Enhanced smooth step for better motion
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
};