/**
 * OAMTM Mission Simulator - 2025 PN7 Quasi-Moon
 * Anflug-/Doppler-Simulation für Browser
 */
import { promises as fs } from 'fs';

class MissionSimulator {
  constructor() {
    this.time = 0;
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.target = { x: 100, y: 0, z: 0 }; // PN7 position
    this.dt = 0.1; // time step
    this.running = false;
  }

  // Hohmann transfer simulation
  calculateHohmannTransfer() {
    const r1 = 1.0; // Earth orbit radius (AU)
    const r2 = 1.002; // PN7 orbit radius (AU)
    
    const v1 = Math.sqrt(1.0 / r1); // Earth orbital velocity
    const v2 = Math.sqrt(1.0 / r2); // PN7 orbital velocity
    
    // Transfer ellipse velocities
    const a = (r1 + r2) / 2; // semi-major axis
    const v_transfer_1 = Math.sqrt(2 * (1.0 / r1 - 1.0 / (2 * a)));
    const v_transfer_2 = Math.sqrt(2 * (1.0 / r2 - 1.0 / (2 * a)));
    
    const deltaV1 = v_transfer_1 - v1;
    const deltaV2 = v2 - v_transfer_2;
    
    return {
      deltaV1: deltaV1 * 29.78, // km/s (Earth orbital velocity)
      deltaV2: deltaV2 * 29.78,
      totalDeltaV: (deltaV1 + deltaV2) * 29.78,
      transferTime: Math.PI * Math.sqrt(a * a * a) * 365.25 // days
    };
  }

  // Doppler shift calculation
  calculateDopplerShift(velocity, frequency) {
    const c = 299792458; // speed of light m/s
    return frequency * (velocity / c);
  }

  // Update simulation step
  update() {
    if (!this.running) return;
    
    // Simple guidance law towards target
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dz = this.target.z - this.position.z;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 0.1) {
      // Proportional navigation
      const k = 0.1;
      this.velocity.x += k * dx * this.dt;
      this.velocity.y += k * dy * this.dt;
      this.velocity.z += k * dz * this.dt;
    } else {
      // Arrived at target
      this.running = false;
      console.log('Mission: Arrived at 2025 PN7');
    }
    
    // Update position
    this.position.x += this.velocity.x * this.dt;
    this.position.y += this.velocity.y * this.dt;
    this.position.z += this.velocity.z * this.dt;
    
    this.time += this.dt;
  }

  // Get current mission status
  getStatus() {
    const distance = Math.sqrt(
      Math.pow(this.target.x - this.position.x, 2) +
      Math.pow(this.target.y - this.position.y, 2) +
      Math.pow(this.target.z - this.position.z, 2)
    );
    
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
    
    const dopplerShift = this.calculateDopplerShift(speed, 437200000); // UHF uplink
    
    return {
      time: this.time,
      position: { ...this.position },
      velocity: { ...this.velocity },
      distance: distance,
      speed: speed,
      dopplerShift: dopplerShift,
      target: { ...this.target },
      running: this.running
    };
  }

  // Start simulation
  start() {
    this.running = true;
    console.log('Mission: Starting approach to 2025 PN7');
  }

  // Stop simulation
  stop() {
    this.running = false;
    console.log('Mission: Simulation stopped');
  }

  // Reset simulation
  reset() {
    this.time = 0;
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.running = false;
    console.log('Mission: Simulation reset');
  }
}

// Export for use in other modules
export { MissionSimulator };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const sim = new MissionSimulator();
  
  console.log('🌑 OAMTM Mission Simulator - 2025 PN7');
  console.log('=====================================');
  
  // Calculate Hohmann transfer
  const hohmann = sim.calculateHohmannTransfer();
  console.log('Hohmann Transfer Analysis:');
  console.log(`  ΔV1: ${hohmann.deltaV1.toFixed(2)} km/s`);
  console.log(`  ΔV2: ${hohmann.deltaV2.toFixed(2)} km/s`);
  console.log(`  Total ΔV: ${hohmann.totalDeltaV.toFixed(2)} km/s`);
  console.log(`  Transfer Time: ${hohmann.transferTime.toFixed(1)} days`);
  console.log('');
  
  // Run simulation
  sim.start();
  
  let step = 0;
  const maxSteps = 1000;
  
  while (sim.running && step < maxSteps) {
    sim.update();
    
    if (step % 100 === 0) {
      const status = sim.getStatus();
      console.log(`T+${status.time.toFixed(1)}s: Distance=${status.distance.toFixed(2)}, Speed=${status.speed.toFixed(2)}, Doppler=${status.dopplerShift.toFixed(0)}Hz`);
    }
    
    step++;
  }
  
  const finalStatus = sim.getStatus();
  console.log('');
  console.log('Final Status:');
  console.log(`  Time: ${finalStatus.time.toFixed(1)}s`);
  console.log(`  Position: (${finalStatus.position.x.toFixed(2)}, ${finalStatus.position.y.toFixed(2)}, ${finalStatus.position.z.toFixed(2)})`);
  console.log(`  Distance: ${finalStatus.distance.toFixed(2)}`);
  console.log(`  Arrived: ${!finalStatus.running ? 'Yes' : 'No'}`);
}