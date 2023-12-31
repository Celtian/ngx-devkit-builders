# Version

It creates file that contains information about version.

## Output

```typescript
// IMPORTANT: THIS FILE IS AUTO GENERATED!
/* eslint-disable */
export const VERSION = {
  version: '0.0.1',
  date: '2023-12-31T22:22:19.346Z',
  author: {
    name: 'Dominik Hladík',
    email: 'dominik.hladik@seznam.cz',
    url: 'https://github.com/Celtian',
  },
};
/* eslint-enable */
```

## Quick start

1. Go to angular.json

```json
{
  ...,
  "projects": {
    "your-project-name": { // project will be different
      ...,
      "architect": {
        ...,
        "version": { // name can be different if you want
          "builder": "ngx-devkit-builders:version",
          "options": { // not needed
            "outputFile": "src/environments/version.ts", // or src/assets/version.json
            "fields": ["version", "date", "author", "git"], // or custom selection
            "lint": "eslint", // or "tslint"
            "variable": "VERSION", // or whatever you want
            "verbose": false // or true
          }
        }
      }
  }
}
```

2. Run command

```bash
ng run your-project-name:version
```
