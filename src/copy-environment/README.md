# Robots

It creates simplified robots.txt.

## Example output

Copied file from `projects/your-project-name/src/environments/environment.sample.ts` into
`projects/your-project-name/src/environments/environment.ts`.

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
        "copy-environment": { // name can be different if you want
          "builder": "ngx-devkit-builders:copy-environment",
          "options": {
            "source": "environment.sample.ts",
            "target": "environment.ts",
            "overwrite": false, // or true
            "verbose": false // or true
          }
        }
      }
  }
}
```

2. Run command

```bash
ng run your-project-name:copy-environment
```
