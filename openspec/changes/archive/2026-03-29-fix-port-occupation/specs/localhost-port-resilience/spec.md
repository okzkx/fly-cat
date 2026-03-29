## ADDED Requirements

### Requirement: Orphaned Dev Process Cleanup on Startup
The system MUST detect and kill orphaned Node.js dev processes from previous sessions that are holding ports in the configured development port range before starting a new dev session.

#### Scenario: Preferred dev port is held by orphaned Node process
- **WHEN** a developer starts the Tauri development workflow and the preferred Vite port is occupied by an orphaned `node.exe` (Windows) or `node` (Unix) process from a previous dev session
- **THEN** the system kills the orphaned process tree before starting the new dev server
- **AND** the new dev server starts on the preferred port

#### Scenario: Port is held by non-Node process
- **WHEN** a developer starts the Tauri development workflow and a port in the dev range is occupied by a non-Node process
- **THEN** the system does NOT kill that process
- **AND** `findAvailablePort` selects the next available port in the range

#### Scenario: Multiple orphaned Node processes across port range
- **WHEN** a developer starts the Tauri development workflow and multiple ports in the dev range are occupied by orphaned Node.js processes
- **THEN** the system kills all orphaned process trees
- **AND** `findAvailablePort` finds the preferred port available

#### Scenario: Cleanup command fails
- **WHEN** the system attempts to kill an orphaned process and the kill command fails
- **THEN** a warning is logged to the console
- **AND** the dev startup continues without crashing
- **AND** `findAvailablePort` selects an alternative port
