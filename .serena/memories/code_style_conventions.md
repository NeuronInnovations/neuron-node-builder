# Code Style and Conventions

## JavaScript Style (JSHint Configuration)

### Formatting Rules
- **Indentation**: 4 spaces (NO tabs)
- **Semicolons**: Optional (asi: true - automatic semicolon insertion allowed)
- **Braces**: Required for all control structures (curly: true)
- **Opening brace**: Same line as `if`/`for`/`function`
- **Closing brace**: On its own line

### Code Quality Rules
- **Equality**: `== null` is allowed (eqnull: true), but prefer strict equality elsewhere
- **For-in loops**: Must have property filtering (forin: true)
- **Immediate functions**: Must be wrapped in parentheses (immed: true)
- **Whitespace**: No non-breaking space characters (nonbsp: true)
- **Functions in loops**: Allowed (loopfunc: true)
- **Variable shadowing**: Allowed (shadow: true)
- **Bracket notation**: Allowed - foo['bar'] is acceptable (sub: true)
- **__proto__**: Allowed for Node.js compatibility (proto: true)

### ECMAScript Version
- **ES Version**: ES11 (ES2020) - esversion: 11
- Modern JavaScript features are supported

### License Headers
- All files must have the Apache 2.0 license header at the top:
```javascript
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
```

## TypeScript Style (Playwright Tests)

### Configuration (tsconfig.playwright.json)
- **Target**: ES2022
- **Module**: CommonJS
- **Module Resolution**: Node
- **Types**: Node, @playwright/test
- **Strict**: Type checking enabled (skipLibCheck: true)
- **Interop**: ES modules interop enabled

## File Naming Conventions
- Node files: `node-name.js` and `node-name.html` (kebab-case)
- Services: `ServiceName.js` (PascalCase)
- Tests: `feature.spec.ts` or `*_spec.js`
- Config files: lowercase with hyphens or dots

## Code Organization

### Node-RED Custom Nodes
Each node consists of:
1. **JavaScript file** (.js) - Server-side logic
2. **HTML file** (.html) - Client-side UI definition

### Service Pattern
Services in `neuron/services/` follow a module.exports pattern:
```javascript
module.exports = {
    functionName: function() {
        // implementation
    }
};
```

## Git Workflow

### Branches
- `master` - Main branch for latest stable release (target for bug fixes)
- `dev` - Development branch for new features
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Messages
- Concise, descriptive messages
- Reference issue numbers when applicable
- Use conventional commits style when possible

## Testing Conventions

### Unit Tests (Mocha)
- File pattern: `*_spec.js`
- Located in `test/unit/` and `test/nodes/`
- Use BDD style (describe, it)
- Timeout: 3000ms default

### Visual Tests (Playwright)
- File pattern: `*.spec.ts`
- Located in `tests/visual/`
- Use TypeScript
- Support dark color scheme
- Viewport: 1440x900
- Projects: chromium-mac, chromium-win

## Documentation Standards
- JSDoc comments for functions and modules
- Inline comments for complex logic
- README files for major features
- API documentation in separate API.md file