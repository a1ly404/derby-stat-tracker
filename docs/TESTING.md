# Testing Setup and CI Configuration

## Overview

This project uses **happy-dom** instead of jsdom for browser environment simulation in tests. This choice was made after encountering persistent compatibility issues with jsdom in CI environments.

## Why happy-dom?

- **Better CI compatibility**: No webidl-conversions errors that plagued jsdom
- **Faster performance**: ~3x faster test execution (6s vs 18s+)
- **Lighter weight**: Smaller dependency footprint
- **More stable**: Fewer Node.js version compatibility issues

## Test Environment

### Local Development
```bash
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
npm run test:ci      # Simulate CI environment locally
```

### CI/CD Pipeline

The project has three GitHub Actions workflows:

1. **`quality-gate.yml`** ⭐ **RECOMMENDED**
   - Runs on all pushes and PRs
   - Executes: lint → test → build → coverage
   - Blocks deployment if any step fails

2. **`test-before-deploy.yml`**
   - Lightweight testing with PR comments
   - Good for simple workflows

3. **`ci.yml`**
   - Full CI/CD with Vercel deployment
   - Requires Vercel secrets configuration

### Environment Variables

CI environments use these variables for optimal performance:

```bash
NODE_OPTIONS=--experimental-vm-modules --max-old-space-size=4096
FORCE_COLOR=0
CI=true
VERCEL_ANALYTICS_DEBUG=false
NEXT_TELEMETRY_DISABLED=1
```

## Configuration Files

### `vitest.config.ts`
- Uses `happy-dom` environment
- Pool isolation with `pool: 'forks'`
- Test setup in `src/test/setup.ts`

### `src/test/setup.ts`
- Global test configuration
- Mock implementations for Supabase
- Browser API polyfills
- Test data factories and constants

## Test Structure

### Mock Architecture
- **Stateful mocks**: `createChainableQuery` for realistic query simulation
- **Factory functions**: `createTeam`, `createPlayer` for consistent test data
- **Error simulation**: Built-in error testing capabilities
- **Isolated per test**: No global state conflicts

### Coverage Targets
- Current coverage: **87.15%**
- Minimum recommended: 80%
- Run `npm run test:coverage` for detailed reports

## Troubleshooting

### Local Issues
1. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
2. Check Node.js version: Requires Node.js 18+ (20+ recommended)
3. Run `npm run test:ci` to simulate CI environment

### CI Issues
1. Check workflow logs for specific error details
2. Verify all dependencies are listed in `package.json`
3. Ensure happy-dom is installed: `npm list happy-dom`
4. Check Node.js version in workflow (should be 20+)

### Migration from jsdom

If you need to revert to jsdom:
1. `npm uninstall happy-dom && npm install --save-dev jsdom`
2. Change `environment: 'happy-dom'` to `environment: 'jsdom'` in `vitest.config.ts`
3. Update polyfills in `src/test/setup.ts`

## Future Improvements

- [ ] Add accessibility testing with jest-axe
- [ ] Implement visual regression testing
- [ ] Add performance benchmarking
- [ ] Expand edge case coverage
- [ ] Add contract testing for API calls

## Links

- [Happy-dom documentation](https://github.com/capricorn86/happy-dom)
- [Vitest documentation](https://vitest.dev)
- [Testing Library documentation](https://testing-library.com/docs/react-testing-library/intro)