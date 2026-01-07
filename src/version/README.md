# 🔢 Version

It creates file that contains information about version. 🚀

## 📋 Example Output

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

## 🚀 Quick Start

### 📝 Add to angular.json

```json
{
  ...,
  "projects": {
    "your-project-name": {
      ...,
      "architect": {
        ...,
        "version": {
          "builder": "ngx-devkit-builders:version",
          "options": {
            "outputFile": "src/environments/version.ts",
            "fields": ["version", "date", "author", "git"],
            "lint": "eslint",
            "variable": "VERSION",
            "verbose": false
          }
        }
      }
    }
  }
}
```

### ▶️ Run the builder

```bash
ng run your-project-name:version
```

## ⚙️ Options

| Option       | Type       | Default                                | Description                              |
| ------------ | ---------- | -------------------------------------- | ---------------------------------------- |
| `outputFile` | `string`   | `src/environments/version.ts`          | Output file path (supports .ts or .json) |
| `fields`     | `string[]` | `["version", "date", "author", "git"]` | Fields to include in version file        |
| `lint`       | `string`   | `eslint`                               | Linter to use (eslint or tslint)         |
| `variable`   | `string`   | `VERSION`                              | Variable name for TypeScript output      |
| `verbose`    | `boolean`  | `false`                                | Show detailed output                     |
