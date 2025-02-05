var ScreenLogger = pc.createScript('screenLogger');

// Initialize method
ScreenLogger.prototype.initialize = function() {
    this.createLoggerContainer();
    this.interceptConsole();
    this.logs = [];
    this.maxLogs = 100;
};

// Create logger container method
ScreenLogger.prototype.createLoggerContainer = function() {
    // Create container for logger
    this.loggerDiv = document.createElement('div');
    this.loggerDiv.id = 'screen-logger';
    
    // Style the container
    Object.assign(this.loggerDiv.style, {
        position: 'fixed',
        top: '10px',
        left: '10px',
        width: '300px',
        height: '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10px',
        overflowY: 'auto',
        zIndex: '1000',
        border: '1px solid #444',
        borderRadius: '5px',
        userSelect: 'text',
        webkitUserSelect: 'text',
        mozUserSelect: 'text',
        msUserSelect: 'text'
    });

    // Create header
    const header = document.createElement('div');
    Object.assign(header.style, {
        position: 'sticky',
        top: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '5px',
        marginBottom: '10px',
        borderBottom: '1px solid #444'
    });

    // Create clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    Object.assign(clearButton.style, {
        backgroundColor: '#444',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        marginRight: '5px',
        cursor: 'pointer',
        borderRadius: '3px'
    });
    clearButton.onclick = () => this.clearLogs();

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide';
    Object.assign(toggleButton.style, {
        backgroundColor: '#444',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        cursor: 'pointer',
        borderRadius: '3px'
    });
    toggleButton.onclick = () => this.toggleLogger();

    // Add buttons to header
    header.appendChild(clearButton);
    header.appendChild(toggleButton);

    // Create content container
    this.logContent = document.createElement('div');
    
    // Add elements to DOM
    this.loggerDiv.appendChild(header);
    this.loggerDiv.appendChild(this.logContent);
    document.body.appendChild(this.loggerDiv);

    // Make logger draggable
    this.makeDraggable(this.loggerDiv, header);
};

// Make draggable method
ScreenLogger.prototype.makeDraggable = function(element, dragHandle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    dragHandle.style.cursor = 'move';
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
};

// Safe stringify method
ScreenLogger.prototype.safeStringify = function(obj, indent = 2) {
    let cache = new Set();
    
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) {
                return '[Circular Reference]';
            }
            cache.add(value);
        }
        
        try {
            if (value instanceof Error) {
                return `[Error: ${value.message}]`;
            }
            if (value instanceof HTMLElement) {
                return `[HTMLElement: ${value.tagName.toLowerCase()}]`;
            }
            if (value instanceof pc.Asset) {
                return `[Asset: ${value.name} (${value.id})]`;
            }
            if (typeof value === 'function') {
                return '[Function]';
            }
            return value;
        } catch (err) {
            return '[Unable to stringify]';
        }
    }, indent);
};

// Log message method
ScreenLogger.prototype.logMessage = function(type, args) {
    const messages = Array.from(args).map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            try {
                return this.safeStringify(arg);
            } catch (err) {
                return '[Complex Object]';
            }
        }
        return String(arg);
    });

    const log = {
        type: type,
        message: messages.join(' '),
        timestamp: new Date().toLocaleTimeString()
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
        this.logs.shift();
    }

    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${type}`;
    Object.assign(logElement.style, {
        borderBottom: '1px solid #333',
        padding: '5px 0',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    });

    const timestamp = document.createElement('span');
    timestamp.textContent = `[${log.timestamp}] `;
    timestamp.style.color = '#888';
    logElement.appendChild(timestamp);

    const message = document.createElement('span');
    message.textContent = log.message;
    switch(type) {
        case 'warn':
            message.style.color = '#ffdd00';
            break;
        case 'error':
            message.style.color = '#ff4444';
            break;
        case 'info':
            message.style.color = '#44aaff';
            break;
        default:
            message.style.color = '#ffffff';
    }
    logElement.appendChild(message);

    this.logContent.appendChild(logElement);
    this.loggerDiv.scrollTop = this.loggerDiv.scrollHeight;
};

// Intercept console method
ScreenLogger.prototype.interceptConsole = function() {
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console)
    };

    const self = this;

    console.log = function() { 
        self.logMessage('log', arguments); 
        originalConsole.log.apply(console, arguments);
    };
    console.warn = function() { 
        self.logMessage('warn', arguments); 
        originalConsole.warn.apply(console, arguments);
    };
    console.error = function() { 
        self.logMessage('error', arguments); 
        originalConsole.error.apply(console, arguments);
    };
    console.info = function() { 
        self.logMessage('info', arguments); 
        originalConsole.info.apply(console, arguments);
    };
};

// Clear logs method
ScreenLogger.prototype.clearLogs = function() {
    this.logs = [];
    this.logContent.innerHTML = '';
};

// Toggle logger method
ScreenLogger.prototype.toggleLogger = function() {
    if (this.logContent.style.display === 'none') {
        this.logContent.style.display = 'block';
        this.loggerDiv.style.height = '400px';
    } else {
        this.logContent.style.display = 'none';
        this.loggerDiv.style.height = 'auto';
    }
};