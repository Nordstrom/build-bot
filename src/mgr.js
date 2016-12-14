module.exports = {
	// Request a build/deploy - create dynamo record with requested state
    request() {},

	// Start a build/deploy - change requested to started state
    start() {},

	// Finish a build/deploy - change started to finished state
    finish() {},

	// Commit a build/deploy - change finished to committed state
    commit() {},

	// Cancel a build/deploy - change requested, started, or finished to canceled state
    cancel() {}
}
