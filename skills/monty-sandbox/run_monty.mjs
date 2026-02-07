import fs from 'fs';
import { Monty, MontyException, MontyTypingError } from '../../node_modules/@pydantic/monty/index.js';

// Parse command line arguments
// Usage: node run_monty.mjs <script_path> [input_json]
const scriptPath = process.argv[2];
const inputJson = process.argv[3];

if (!scriptPath) {
  console.error(JSON.stringify({ error: "Missing script path argument" }));
  process.exit(1);
}

try {
  // Read Python script
  const code = fs.readFileSync(scriptPath, 'utf8');
  
  // Parse inputs if provided
  let inputs = {};
  if (inputJson) {
    try {
      inputs = JSON.parse(inputJson);
    } catch (e) {
      console.error(JSON.stringify({ error: "Invalid input JSON", details: e.message }));
      process.exit(1);
    }
  }

  // Configure Monty
  const m = new Monty(code, {
    scriptName: scriptPath,
    inputs: Object.keys(inputs) // Declare input variables for Monty
  });

  // Execute with limits
  const result = m.run({
    inputs: inputs,
    limits: {
      maxDurationSecs: 5,        // 5 seconds timeout
      maxMemory: 10 * 1024 * 1024, // 10MB memory limit
      maxRecursionDepth: 500     // Prevent stack overflow
    }
  });

  // Output success result
  console.log(JSON.stringify({ 
    status: "success", 
    output: result 
  }, null, 2));

} catch (error) {
  // Handle specific Monty errors
  let errorResponse = {
    status: "error",
    message: error.message
  };

  if (error instanceof MontyException) {
     errorResponse.type = "MontyException";
     // Check if traceback method exists (might vary by version)
     if (typeof error.traceback === 'function') {
         errorResponse.traceback = error.traceback();
     }
  } else if (error instanceof MontyTypingError) {
    errorResponse.type = "TypeError";
    if (typeof error.displayDiagnostics === 'function') {
        errorResponse.diagnostics = error.displayDiagnostics();
    }
  } else {
    errorResponse.type = "SystemError";
  }

  console.error(JSON.stringify(errorResponse, null, 2));
  process.exit(1);
}
