var f = require("./f.js")

function Simulator(zones, timeline) {
	this.zones = zones
	this.timeline = timeline
}
// Convert the zones callFactor,
// together with the zones puplation
// at time t, and return a normalised
// list of number of calls per block
Simulator.prototype.normalize = function(zones, populations) {
	//calls = f.map(zones, function(x) { return x[callFactor; })
	//return f.reduce(
}

Simulator.prototype.start = function() {

	calls = this.normalize(this.zones, this.timeline[0])

	this.hour = 0
}

Simulator.prototype.step = function() {
	this.hour += 1
	this.calculate(this.timeline[this.hour])	
}

Simulator.prototype.calculate = function(pop) {
		
}



exports.Simulator = Simulator
