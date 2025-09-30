/**
 * 🎨 HFRF Pixel-Perfect UI/UX Generator
 * 
 * Generiert pixelgenaue, auditierbare Benutzeroberflächen für RF-Operationen
 * Basierend auf JavaScript-Komponenten mit exakter Design-Kontrolle
 * 
 * Features:
 * - Pixelgenaue Positionierung und Größen
 * - Auditierbare UI-Elemente für TX-Freigabe
 * - Live-Canvas mit Echtzeit-Interaktion
 * - Modulare Komponenten-Architektur
 * - Design-System mit konsistenten Styles
 */

class PixelPerfectUIGenerator {
    constructor() {
        this.components = new Map();
        this.auditLog = [];
        this.designSystem = this.createDesignSystem();
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
    }

    /**
     * 🎨 Design System - Pixelgenaue Styles und Farben
     */
    createDesignSystem() {
        return {
            // Farbpalette - HFRF Brand Colors
            colors: {
                primary: '#00ff88',      // HFRF Green
                secondary: '#ff6b35',    // HFRF Orange
                background: '#1e3c72',   // HFRF Blue
                surface: 'rgba(255, 255, 255, 0.1)',
                text: '#ffffff',
                textSecondary: 'rgba(255, 255, 255, 0.8)',
                success: '#00ff88',
                warning: '#ffaa00',
                error: '#ff4444',
                info: '#00aaff'
            },
            
            // Typography - Pixelgenaue Schriftgrößen
            typography: {
                h1: { fontSize: '2.5em', fontWeight: 'bold', lineHeight: '1.2' },
                h2: { fontSize: '2em', fontWeight: 'bold', lineHeight: '1.3' },
                h3: { fontSize: '1.5em', fontWeight: '600', lineHeight: '1.4' },
                body: { fontSize: '1em', fontWeight: 'normal', lineHeight: '1.5' },
                caption: { fontSize: '0.875em', fontWeight: 'normal', lineHeight: '1.4' }
            },
            
            // Spacing - 8px Grid System
            spacing: {
                xs: '4px',
                sm: '8px',
                md: '16px',
                lg: '24px',
                xl: '32px',
                xxl: '48px'
            },
            
            // Border Radius - Konsistente Rundungen
            borderRadius: {
                sm: '4px',
                md: '8px',
                lg: '12px',
                xl: '16px',
                full: '50%'
            },
            
            // Shadows - Tiefe und Elevation
            shadows: {
                sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
                md: '0 4px 8px rgba(0, 0, 0, 0.15)',
                lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
                xl: '0 16px 32px rgba(0, 0, 0, 0.25)'
            }
        };
    }

    /**
     * 🚀 Initialisierung des UI-Generators
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🎨 Initializing Pixel-Perfect UI Generator...');
        
        // Canvas für Live-Interaktion erstellen
        this.createLiveCanvas();
        
        // Basis-Komponenten registrieren
        this.registerBaseComponents();
        
        // Event-System initialisieren
        this.initializeEventSystem();
        
        this.isInitialized = true;
        console.log('✅ Pixel-Perfect UI Generator initialized');
    }

    /**
     * 🖼️ Live-Canvas für Echtzeit-Interaktion erstellen
     */
    createLiveCanvas() {
        // Canvas-Element erstellen
        const canvas = document.createElement('canvas');
        canvas.id = 'hfrf-live-canvas';
        canvas.width = 1200;
        canvas.height = 800;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1000';
        canvas.style.pointerEvents = 'auto';
        canvas.style.border = '2px solid #00ff88';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 8px 32px rgba(0, 255, 136, 0.3)';
        
        // Canvas zum Body hinzufügen
        document.body.appendChild(canvas);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvas-Event-Listener
        this.setupCanvasEvents();
        
        console.log('🖼️ Live-Canvas created:', canvas.width + 'x' + canvas.height);
    }

    /**
     * 🎯 Canvas-Event-System einrichten
     */
    setupCanvasEvents() {
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = this.canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
            
            this.auditLog.push({
                timestamp: new Date().toISOString(),
                action: 'canvas_interaction',
                type: 'mousedown',
                x: lastX,
                y: lastY
            });
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // Zeichne Linie
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.strokeStyle = this.designSystem.colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        });

        this.canvas.addEventListener('mouseup', () => {
            isDrawing = false;
            this.auditLog.push({
                timestamp: new Date().toISOString(),
                action: 'canvas_interaction',
                type: 'mouseup'
            });
        });

        // Touch Events für Mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            lastX = touch.clientX - rect.left;
            lastY = touch.clientY - rect.top;
            isDrawing = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.strokeStyle = this.designSystem.colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            lastX = currentX;
            lastY = currentY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDrawing = false;
        });
    }

    /**
     * 🧩 Basis-Komponenten registrieren
     */
    registerBaseComponents() {
        // Button-Komponente
        this.registerComponent('Button', this.createButtonComponent());
        
        // Input-Komponente
        this.registerComponent('Input', this.createInputComponent());
        
        // Panel-Komponente
        this.registerComponent('Panel', this.createPanelComponent());
        
        // Spectrum Display
        this.registerComponent('SpectrumDisplay', this.createSpectrumDisplayComponent());
        
        // Frequency Control
        this.registerComponent('FrequencyControl', this.createFrequencyControlComponent());
        
        // TX Control (Auditierbar)
        this.registerComponent('TXControl', this.createTXControlComponent());
        
        // Status Display
        this.registerComponent('StatusDisplay', this.createStatusDisplayComponent());
        
        console.log('🧩 Base components registered:', this.components.size);
    }

    /**
     * 📝 Komponente registrieren
     */
    registerComponent(name, component) {
        this.components.set(name, component);
    }

    /**
     * 🔘 Button-Komponente erstellen
     */
    createButtonComponent() {
        return {
            render: (props) => {
                const {
                    text = 'Button',
                    onClick = () => {},
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    x = 0,
                    y = 0,
                    width = 120,
                    height = 40
                } = props;

                const button = document.createElement('button');
                button.textContent = text;
                button.style.position = 'absolute';
                button.style.left = x + 'px';
                button.style.top = y + 'px';
                button.style.width = width + 'px';
                button.style.height = height + 'px';
                button.style.border = 'none';
                button.style.borderRadius = this.designSystem.borderRadius.md;
                button.style.fontSize = this.designSystem.typography.body.fontSize;
                button.style.fontWeight = '600';
                button.style.cursor = disabled ? 'not-allowed' : 'pointer';
                button.style.transition = 'all 0.2s ease';
                button.disabled = disabled;

                // Variant-Styles
                switch (variant) {
                    case 'primary':
                        button.style.background = `linear-gradient(45deg, ${this.designSystem.colors.primary}, #00cc6a)`;
                        button.style.color = '#000';
                        button.style.boxShadow = this.designSystem.shadows.md;
                        break;
                    case 'secondary':
                        button.style.background = `linear-gradient(45deg, ${this.designSystem.colors.secondary}, #e55a2b)`;
                        button.style.color = '#fff';
                        button.style.boxShadow = this.designSystem.shadows.md;
                        break;
                    case 'danger':
                        button.style.background = `linear-gradient(45deg, ${this.designSystem.colors.error}, #cc3333)`;
                        button.style.color = '#fff';
                        button.style.boxShadow = this.designSystem.shadows.md;
                        break;
                }

                // Size-Styles
                switch (size) {
                    case 'sm':
                        button.style.height = '32px';
                        button.style.fontSize = '0.875em';
                        break;
                    case 'lg':
                        button.style.height = '48px';
                        button.style.fontSize = '1.125em';
                        break;
                }

                // Hover-Effekte
                button.addEventListener('mouseenter', () => {
                    if (!disabled) {
                        button.style.transform = 'translateY(-2px)';
                        button.style.boxShadow = this.designSystem.shadows.lg;
                    }
                });

                button.addEventListener('mouseleave', () => {
                    if (!disabled) {
                        button.style.transform = 'translateY(0)';
                        button.style.boxShadow = this.designSystem.shadows.md;
                    }
                });

                // Click-Event mit Audit-Log
                button.addEventListener('click', (e) => {
                    if (!disabled) {
                        this.auditLog.push({
                            timestamp: new Date().toISOString(),
                            action: 'button_click',
                            component: 'Button',
                            text: text,
                            x: x,
                            y: y
                        });
                        onClick(e);
                    }
                });

                return button;
            }
        };
    }

    /**
     * 📝 Input-Komponente erstellen
     */
    createInputComponent() {
        return {
            render: (props) => {
                const {
                    type = 'text',
                    placeholder = '',
                    value = '',
                    onChange = () => {},
                    x = 0,
                    y = 0,
                    width = 200,
                    height = 40
                } = props;

                const input = document.createElement('input');
                input.type = type;
                input.placeholder = placeholder;
                input.value = value;
                input.style.position = 'absolute';
                input.style.left = x + 'px';
                input.style.top = y + 'px';
                input.style.width = width + 'px';
                input.style.height = height + 'px';
                input.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                input.style.borderRadius = this.designSystem.borderRadius.md;
                input.style.background = this.designSystem.colors.surface;
                input.style.color = this.designSystem.colors.text;
                input.style.fontSize = this.designSystem.typography.body.fontSize;
                input.style.padding = '0 12px';
                input.style.outline = 'none';
                input.style.transition = 'border-color 0.2s ease';

                // Focus-Styles
                input.addEventListener('focus', () => {
                    input.style.borderColor = this.designSystem.colors.primary;
                });

                input.addEventListener('blur', () => {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                });

                // Change-Event mit Audit-Log
                input.addEventListener('input', (e) => {
                    this.auditLog.push({
                        timestamp: new Date().toISOString(),
                        action: 'input_change',
                        component: 'Input',
                        type: type,
                        value: e.target.value,
                        x: x,
                        y: y
                    });
                    onChange(e);
                });

                return input;
            }
        };
    }

    /**
     * 📦 Panel-Komponente erstellen
     */
    createPanelComponent() {
        return {
            render: (props) => {
                const {
                    title = '',
                    x = 0,
                    y = 0,
                    width = 300,
                    height = 200,
                    children = []
                } = props;

                const panel = document.createElement('div');
                panel.style.position = 'absolute';
                panel.style.left = x + 'px';
                panel.style.top = y + 'px';
                panel.style.width = width + 'px';
                panel.style.height = height + 'px';
                panel.style.background = this.designSystem.colors.surface;
                panel.style.borderRadius = this.designSystem.borderRadius.lg;
                panel.style.padding = this.designSystem.spacing.lg;
                panel.style.backdropFilter = 'blur(10px)';
                panel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                panel.style.boxShadow = this.designSystem.shadows.lg;

                // Titel
                if (title) {
                    const titleElement = document.createElement('h3');
                    titleElement.textContent = title;
                    titleElement.style.margin = '0 0 16px 0';
                    titleElement.style.color = this.designSystem.colors.primary;
                    titleElement.style.fontSize = this.designSystem.typography.h3.fontSize;
                    titleElement.style.fontWeight = this.designSystem.typography.h3.fontWeight;
                    panel.appendChild(titleElement);
                }

                // Children hinzufügen
                children.forEach(child => {
                    if (child instanceof HTMLElement) {
                        panel.appendChild(child);
                    }
                });

                return panel;
            }
        };
    }

    /**
     * 📊 Spectrum Display Komponente
     */
    createSpectrumDisplayComponent() {
        return {
            render: (props) => {
                const {
                    x = 0,
                    y = 0,
                    width = 400,
                    height = 200,
                    data = []
                } = props;

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.style.position = 'absolute';
                canvas.style.left = x + 'px';
                canvas.style.top = y + 'px';
                canvas.style.border = '1px solid #333';
                canvas.style.borderRadius = this.designSystem.borderRadius.md;
                canvas.style.background = '#000';

                const ctx = canvas.getContext('2d');

                // Spectrum zeichnen
                const drawSpectrum = () => {
                    ctx.clearRect(0, 0, width, height);
                    
                    // Grid
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    for (let i = 0; i <= 10; i++) {
                        const x = (i / 10) * width;
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, height);
                        ctx.stroke();
                    }
                    
                    // Spectrum Trace
                    if (data.length > 0) {
                        ctx.strokeStyle = this.designSystem.colors.primary;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        
                        data.forEach((value, index) => {
                            const x = (index / data.length) * width;
                            const y = height - ((value + 100) / 100) * height;
                            
                            if (index === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }
                        });
                        
                        ctx.stroke();
                    }
                };

                // Initial draw
                drawSpectrum();

                // Update-Funktion
                canvas.updateSpectrum = (newData) => {
                    data.length = 0;
                    data.push(...newData);
                    drawSpectrum();
                };

                return canvas;
            }
        };
    }

    /**
     * 🎛️ Frequency Control Komponente
     */
    createFrequencyControlComponent() {
        return {
            render: (props) => {
                const {
                    x = 0,
                    y = 0,
                    width = 300,
                    height = 100,
                    frequency = 144300000,
                    onChange = () => {}
                } = props;

                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = x + 'px';
                container.style.top = y + 'px';
                container.style.width = width + 'px';
                container.style.height = height + 'px';

                // Frequency Input
                const freqInput = this.components.get('Input').render({
                    type: 'number',
                    placeholder: 'Frequency in Hz',
                    value: frequency,
                    x: 0,
                    y: 0,
                    width: width - 100,
                    height: 40,
                    onChange: (e) => {
                        const newFreq = parseFloat(e.target.value);
                        if (!isNaN(newFreq)) {
                            onChange(newFreq);
                        }
                    }
                });

                // Set Button
                const setButton = this.components.get('Button').render({
                    text: 'Set',
                    variant: 'primary',
                    x: width - 80,
                    y: 0,
                    width: 80,
                    height: 40,
                    onClick: () => {
                        const newFreq = parseFloat(freqInput.value);
                        if (!isNaN(newFreq)) {
                            onChange(newFreq);
                        }
                    }
                });

                // Frequency Display
                const freqDisplay = document.createElement('div');
                freqDisplay.style.position = 'absolute';
                freqDisplay.style.left = '0px';
                freqDisplay.style.top = '50px';
                freqDisplay.style.width = width + 'px';
                freqDisplay.style.height = '40px';
                freqDisplay.style.color = this.designSystem.colors.primary;
                freqDisplay.style.fontSize = '1.2em';
                freqDisplay.style.fontWeight = 'bold';
                freqDisplay.style.textAlign = 'center';
                freqDisplay.style.lineHeight = '40px';
                freqDisplay.textContent = `${(frequency / 1e6).toFixed(3)} MHz`;

                // Update Display
                const updateDisplay = (newFreq) => {
                    freqDisplay.textContent = `${(newFreq / 1e6).toFixed(3)} MHz`;
                    freqInput.value = newFreq;
                };

                container.appendChild(freqInput);
                container.appendChild(setButton);
                container.appendChild(freqDisplay);

                // Update-Funktion
                container.updateFrequency = updateDisplay;

                return container;
            }
        };
    }

    /**
     * 🔴 TX Control Komponente (Auditierbar)
     */
    createTXControlComponent() {
        return {
            render: (props) => {
                const {
                    x = 0,
                    y = 0,
                    width = 200,
                    height = 80,
                    isTransmitting = false,
                    onTXStart = () => {},
                    onTXStop = () => {}
                } = props;

                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = x + 'px';
                container.style.top = y + 'px';
                container.style.width = width + 'px';
                container.style.height = height + 'px';

                // TX Button
                const txButton = this.components.get('Button').render({
                    text: isTransmitting ? 'STOP TX' : 'START TX',
                    variant: isTransmitting ? 'danger' : 'primary',
                    x: 0,
                    y: 0,
                    width: width,
                    height: 40,
                    onClick: () => {
                        if (isTransmitting) {
                            this.auditLog.push({
                                timestamp: new Date().toISOString(),
                                action: 'tx_stop',
                                component: 'TXControl',
                                x: x,
                                y: y
                            });
                            onTXStop();
                        } else {
                            this.auditLog.push({
                                timestamp: new Date().toISOString(),
                                action: 'tx_start',
                                component: 'TXControl',
                                x: x,
                                y: y
                            });
                            onTXStart();
                        }
                    }
                });

                // Status Display
                const statusDisplay = document.createElement('div');
                statusDisplay.style.position = 'absolute';
                statusDisplay.style.left = '0px';
                statusDisplay.style.top = '50px';
                statusDisplay.style.width = width + 'px';
                statusDisplay.style.height = '30px';
                statusDisplay.style.color = isTransmitting ? this.designSystem.colors.error : this.designSystem.colors.success;
                statusDisplay.style.fontSize = '1em';
                statusDisplay.style.fontWeight = 'bold';
                statusDisplay.style.textAlign = 'center';
                statusDisplay.style.lineHeight = '30px';
                statusDisplay.textContent = isTransmitting ? 'TRANSMITTING' : 'STANDBY';

                container.appendChild(txButton);
                container.appendChild(statusDisplay);

                // Update-Funktion
                container.updateTXStatus = (newStatus) => {
                    isTransmitting = newStatus;
                    txButton.textContent = newStatus ? 'STOP TX' : 'START TX';
                    txButton.style.background = newStatus ? 
                        `linear-gradient(45deg, ${this.designSystem.colors.error}, #cc3333)` :
                        `linear-gradient(45deg, ${this.designSystem.colors.primary}, #00cc6a)`;
                    statusDisplay.textContent = newStatus ? 'TRANSMITTING' : 'STANDBY';
                    statusDisplay.style.color = newStatus ? this.designSystem.colors.error : this.designSystem.colors.success;
                };

                return container;
            }
        };
    }

    /**
     * 📊 Status Display Komponente
     */
    createStatusDisplayComponent() {
        return {
            render: (props) => {
                const {
                    x = 0,
                    y = 0,
                    width = 300,
                    height = 150,
                    status = {}
                } = props;

                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = x + 'px';
                container.style.top = y + 'px';
                container.style.width = width + 'px';
                container.style.height = height + 'px';
                container.style.background = this.designSystem.colors.surface;
                container.style.borderRadius = this.designSystem.borderRadius.lg;
                container.style.padding = this.designSystem.spacing.md;
                container.style.border = '1px solid rgba(255, 255, 255, 0.2)';

                // Status Items
                const statusItems = [
                    { label: 'Frequency', value: `${(status.frequency || 0) / 1e6} MHz`, color: this.designSystem.colors.primary },
                    { label: 'Mode', value: status.mode || 'SSB', color: this.designSystem.colors.info },
                    { label: 'Signal', value: `${status.signal || -80} dBm`, color: this.designSystem.colors.success },
                    { label: 'SNR', value: `${status.snr || 15} dB`, color: this.designSystem.colors.warning }
                ];

                statusItems.forEach((item, index) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.style.display = 'flex';
                    itemDiv.style.justifyContent = 'space-between';
                    itemDiv.style.alignItems = 'center';
                    itemDiv.style.marginBottom = '8px';
                    itemDiv.style.height = '24px';

                    const label = document.createElement('span');
                    label.textContent = item.label + ':';
                    label.style.color = this.designSystem.colors.textSecondary;
                    label.style.fontSize = '0.9em';

                    const value = document.createElement('span');
                    value.textContent = item.value;
                    value.style.color = item.color;
                    value.style.fontWeight = 'bold';
                    value.style.fontSize = '0.9em';

                    itemDiv.appendChild(label);
                    itemDiv.appendChild(value);
                    container.appendChild(itemDiv);
                });

                // Update-Funktion
                container.updateStatus = (newStatus) => {
                    const items = container.querySelectorAll('div > span:last-child');
                    items[0].textContent = `${(newStatus.frequency || 0) / 1e6} MHz`;
                    items[1].textContent = newStatus.mode || 'SSB';
                    items[2].textContent = `${newStatus.signal || -80} dBm`;
                    items[3].textContent = `${newStatus.snr || 15} dB`;
                };

                return container;
            }
        };
    }

    /**
     * 🎯 Event-System initialisieren
     */
    initializeEventSystem() {
        // Global Event Bus
        this.eventBus = new EventTarget();
        
        // Standard-Events
        this.eventBus.addEventListener('component_created', (e) => {
            console.log('🧩 Component created:', e.detail);
        });
        
        this.eventBus.addEventListener('audit_log', (e) => {
            console.log('📝 Audit log:', e.detail);
        });
    }

    /**
     * 🏗️ UI-Layout erstellen
     */
    createUILayout(layoutConfig) {
        const {
            title = 'HFRF Pixel-Perfect UI',
            width = 1200,
            height = 800,
            components = []
        } = layoutConfig;

        // Container erstellen
        const container = document.createElement('div');
        container.id = 'hfrf-pixel-ui-container';
        container.style.position = 'relative';
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.background = `linear-gradient(135deg, ${this.designSystem.colors.background} 0%, #2a5298 100%)`;
        container.style.borderRadius = this.designSystem.borderRadius.xl;
        container.style.overflow = 'hidden';
        container.style.boxShadow = this.designSystem.shadows.xl;

        // Titel
        const titleElement = document.createElement('h1');
        titleElement.textContent = title;
        titleElement.style.position = 'absolute';
        titleElement.style.top = '20px';
        titleElement.style.left = '50%';
        titleElement.style.transform = 'translateX(-50%)';
        titleElement.style.color = this.designSystem.colors.text;
        titleElement.style.fontSize = this.designSystem.typography.h1.fontSize;
        titleElement.style.fontWeight = this.designSystem.typography.h1.fontWeight;
        titleElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
        titleElement.style.margin = '0';
        container.appendChild(titleElement);

        // Komponenten hinzufügen
        components.forEach(compConfig => {
            const component = this.components.get(compConfig.type);
            if (component) {
                const element = component.render(compConfig.props);
                container.appendChild(element);
                
                // Event auslösen
                this.eventBus.dispatchEvent(new CustomEvent('component_created', {
                    detail: { type: compConfig.type, props: compConfig.props }
                }));
            }
        });

        return container;
    }

    /**
     * 📝 Audit-Log abrufen
     */
    getAuditLog() {
        return this.auditLog;
    }

    /**
     * 🧹 Audit-Log leeren
     */
    clearAuditLog() {
        this.auditLog = [];
    }

    /**
     * 💾 Audit-Log exportieren
     */
    exportAuditLog() {
        const logData = {
            timestamp: new Date().toISOString(),
            total_events: this.auditLog.length,
            events: this.auditLog
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hfrf-audit-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 🎨 Design-System abrufen
     */
    getDesignSystem() {
        return this.designSystem;
    }

    /**
     * 🧩 Komponente abrufen
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * 🖼️ Canvas abrufen
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * 🎯 Canvas löschen
     */
    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Globale Instanz erstellen
window.HFRFPixelPerfectUI = new PixelPerfectUIGenerator();

// Auto-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.HFRFPixelPerfectUI.initialize();
});

console.log('🎨 HFRF Pixel-Perfect UI Generator loaded');
