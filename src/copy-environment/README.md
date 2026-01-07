# 📄 Copy Environment

It copies environment files for your Angular project. 🚀

## 📋 Example Output

Copied file from `projects/your-project-name/src/environments/environment.sample.ts` into
`projects/your-project-name/src/environments/environment.ts`. ✅

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
        "copy-environment": {
          "builder": "ngx-devkit-builders:copy-environment",
          "options": {
            "source": "environment.sample.ts",
            "target": "environment.ts",
            "overwrite": false,
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
ng run your-project-name:copy-environment
```

## ⚙️ Options

| Option      | Type      | Default | Description                               |
| ----------- | --------- | ------- | ----------------------------------------- |
| `source`    | `string`  | -       | Source environment file name              |
| `target`    | `string`  | -       | Target environment file name              |
| `overwrite` | `boolean` | `false` | Whether to overwrite existing target file |
| `verbose`   | `boolean` | `false` | Show detailed output                      |
