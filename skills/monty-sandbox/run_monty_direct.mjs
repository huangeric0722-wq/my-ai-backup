import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Directly load the native addon
// Path might need adjustment based on where the package manager put it
const nativeAddon = require('../../node_modules/@pydantic/monty-linux-x64-gnu/monty.linux-x64-gnu.node');
const { Monty, MontyException, MontyTypingError } = nativeAddon;

import fs from 'fs';

// Parse command line arguments
const scriptPath = process.argv[2];
const inputJson = process.argv[3];

if (!scriptPath) {
  console.error(JSON.stringify({ error: "Missing script path argument" }));
  process.exit(1);
}

try {
  const code = fs.readFileSync(scriptPath, 'utf8');
  let inputs = {};
  if (inputJson) {
    try {
      inputs = JSON.parse(inputJson);
    } catch (e) {
      console.error(JSON.stringify({ error: "Invalid input JSON", details: e.message }));
      process.exit(1);
    }
  }

  const m = new Monty(code, {
    scriptName: scriptPath,
    inputs: Object.keys(inputs)
  });

  const result = m.run({
    inputs: inputs,
    limits: {
      maxDurationSecs: 5,
      maxMemory: 10 * 1024 * 1024,
      maxRecursionDepth: 500
    }
  });

  console.log(JSON.stringify({ 
    status: "success", 
    output: result 
  }, null, 2));

} catch (error) {
  let errorResponse = {
    status: "error",
    message: error.message
  };

  if (error instanceof MontyException) {
     errorResponse.type = "MontyException";
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
