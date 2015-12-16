# zappr

Approvals for Github pull requests.

## Development

**Build & run:**

```
npm install
npm run build
npm start
```

**Debug client & server:**

```
npm run build-client -- -d
npm run build-server -- -d
npm run run-all
```

Enable debug logs in the browser console:

```
window.DEBUG.enable('zappr:*')
```

**Test:**

```
npm test
```

**Docker image:**

```
./tools/build.sh
```
