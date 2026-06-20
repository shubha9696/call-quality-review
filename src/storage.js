/**
 * In-memory storage module.
 * 
 * This is the ONLY file that needs to change when swapping
 * to a real database (e.g. PostgreSQL, MongoDB).
 * 
 * All other modules interact with storage exclusively through
 * the exported interface below.
 */

// In-memory store: Map<callId, callObject>
const calls = new Map();

/**
 * Save a fully-processed call object.
 * @param {object} call - The call object with transcript, moments, summary, etc.
 */
function saveCall(call) {
  calls.set(call.id, call);
}

/**
 * Retrieve a single call by ID.
 * @param {string} id - The call ID.
 * @returns {object|undefined} The call object, or undefined if not found.
 */
function getCall(id) {
  return calls.get(id);
}

/**
 * Retrieve all stored calls.
 * @returns {object[]} Array of all call objects.
 */
function getAllCalls() {
  return Array.from(calls.values());
}

/**
 * Delete a call by ID.
 * @param {string} id
 * @returns {boolean} true if the call existed and was deleted.
 */
function deleteCall(id) {
  return calls.delete(id);
}

/**
 * Clear all stored data (useful for testing).
 */
function clearAll() {
  calls.clear();
}

module.exports = {
  saveCall,
  getCall,
  getAllCalls,
  deleteCall,
  clearAll,
};
