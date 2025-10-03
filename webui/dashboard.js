class HFRFDashboard {
    constructor() {
        this.currentFrequency = 144300000;
        this.spectrumCanvas = document.getElementById('spectrum');
        this.ctx = this.spectrumCanvas.getContext('2d');
        this.init();
    }

    async init() {
        await this.loadPresets();
        this.setupEventListeners();
        this.startSpectrumUpdate();
    }

    async loadPresets() {
        try {
            const response = await fetch('/api/presets');
            const presets = await response.json();
            this.renderPresetButtons(presets);
        } catch (error) {
            console.error('Fehler beim Laden der Presets:', error);
            this.showStatus('Fehler beim Laden der Presets', 'error');
        }
    }

    renderPresetButtons(presets) {
        const container = document.getElementById('preset-buttons');
        container.innerHTML = '';
        
        presets.forEach(preset => {
            const button = document.createElement('button');
            button.className = 'preset-btn';
            button.textContent = `${preset.name} (${(preset.frequency / 1e6).toFixed(2)} MHz)`;
            button.onclick = () => this.activatePreset(preset.name);
            container.appendChild(button);
        });
    }

    async activatePreset(presetName) {
        try {
            const response = await fetch('/api/transmit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preset: presetName })
            });
            
            if (response.ok) {
                this.showStatus(`Preset ${presetName} aktiviert`, 'success');
            } else {
                this.showStatus(`Fehler beim Aktivieren von ${presetName}`, 'error');
            }
        } catch (error) {
            console.error('Fehler beim Aktivieren des Presets:', error);
            this.showStatus('Fehler beim Aktivieren des Presets', 'error');
        }
    }

    async setFrequency(frequency) {
        try {
            const response = await fetch('/api/frequency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frequency: frequency })
            });
            
            if (response.ok) {
                this.currentFrequency = frequency;
                this.showStatus(`Frequenz auf ${(frequency / 1e6).toFixed(2)} MHz gesetzt`, 'success');
            } else {
                this.showStatus('Fehler beim Setzen der Frequenz', 'error');
            }
        } catch (error) {
            console.error('Fehler beim Setzen der Frequenz:', error);
            this.showStatus('Fehler beim Setzen der Frequenz', 'error');
        }
    }

    async startSpectrumUpdate() {
        while (true) {
            await this.updateSpectrum();
            await new Promise(resolve => setTimeout(resolve, 100)); // 10 FPS
        }
    }

    async updateSpectrum() {
        try {
            const response = await fetch('/api/spectrum');
            const spectrumData = await response.json();
            this.drawSpectrum(spectrumData);
        } catch (error) {
            console.error('Fehler beim Laden der Spektrumdaten:', error);
        }
    }

    drawSpectrum(data) {
        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Background grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Spectrum trace
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (index / data.length) * width;
            const y = height - ((value + 100) / 100) * height; // Scale dB values
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // Frequency markers
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const centerFreq = this.currentFrequency / 1e6;
        const bandwidth = 2.4; // MHz
        const startFreq = centerFreq - bandwidth / 2;
        
        for (let i = 0; i <= 5; i++) {
            const freq = startFreq + (i * bandwidth / 5);
            const x = (i / 5) * width;
            this.ctx.fillText(`${freq.toFixed(1)} MHz`, x, height - 5);
        }
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    setupEventListeners() {
        // Frequency input
        const frequencyInput = document.getElementById('frequency-input');
        frequencyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const frequency = parseFloat(frequencyInput.value);
                if (!isNaN(frequency)) {
                    this.setFrequency(frequency);
                }
            }
        });
    }
}

// Global function for frequency setting
function setFrequency() {
    const frequencyInput = document.getElementById('frequency-input');
    const frequency = parseFloat(frequencyInput.value);
    if (!isNaN(frequency)) {
        dashboard.setFrequency(frequency);
    }
}

// Start the dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new HFRFDashboard();
});


