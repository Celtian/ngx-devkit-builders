<p align="center">
  <a href="https://github.com/Celtian/ngx-devkit-builders" target="blank"><img src="assets/logo.svg?sanitize=true" alt="" width="120"></a>
  <h1 align="center">NgxDevkitBuilders</h1>
</p>

[![npm version](https://badge.fury.io/js/ngx-devkit-builders.svg)](https://badge.fury.io/js/ngx-devkit-builders)
[![Package License](https://img.shields.io/npm/l/ngx-devkit-builders.svg)](https://www.npmjs.com/ngx-devkit-builders)
[![NPM Downloads](https://img.shields.io/npm/dm/ngx-devkit-builders.svg)](https://www.npmjs.com/ngx-devkit-builders)
[![Build & Publish](https://github.com/celtian/ngx-devkit-builders/workflows/Build%20&%20Publish/badge.svg)](https://github.com/celtian/ngx-devkit-builders/actions)
[![stars](https://badgen.net/github/stars/celtian/ngx-devkit-builders)](https://github.com/celtian/ngx-devkit-builders/)
[![forks](https://badgen.net/github/forks/celtian/ngx-devkit-builders)](https://github.com/celtian/ngx-devkit-builders/)
[![HitCount](http://hits.dwyl.com/celtian/ngx-devkit-builders.svg)](http://hits.dwyl.com/celtian/ngx-devkit-builders)

This package contains Architect builders used to build and test Angular applications and libraries.

> ✓ _Angular 15 compatible_

## Builders

| Name    | Description                   |
| ------- | ----------------------------- |
| version | Create build information file |

_More builders can be added in the future._

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

```
ng run your-project-name:version
```

## License

Copyright &copy; 2022 - 2023 [Dominik Hladik](https://github.com/Celtian)

All contents are licensed under the [MIT license].

[mit license]: LICENSE
