# 📦 Sort Component Imports Builder

An Angular builder that automatically sorts the `imports` array within `@Component` decorators using TypeScript AST analysis. ✨

## 📋 Example Output

```typescript
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ThemeColorSelectComponent,
    ThemeTypeSelectComponent,
    ToolbarComponent,
    ToolbarLogoComponent,
    ToolbarMenuComponent,
  ],
  ...
})
```

_Imports are sorted alphabetically._

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
        "sort-imports": {
          "builder": "ngx-devkit-builders:sort-imports",
          "options": {
            "dryRun": false,
            "verbose": false,
            "includeDirectives": true
          }
        }
      }
    }
  }
}
```

### ▶️ Run the builder

```bash
# Sort imports in a specific project
ng run your-project-name:sort-imports

# Dry run to preview changes
ng run your-project-name:sort-imports --dryRun=true

# Verbose output with detailed import information
ng run your-project-name:sort-imports --verbose=true

# Components only (exclude directives)
ng run your-project-name:sort-imports --includeDirectives=false
```

## ⚙️ Options

| Option              | Type      | Default | Description                                  |
| ------------------- | --------- | ------- | -------------------------------------------- |
| `project`           | `string`  | -       | The name of the project to sort imports for  |
| `dryRun`            | `boolean` | `false` | Run without making changes to files          |
| `verbose`           | `boolean` | `false` | Show detailed output                         |
| `includeDirectives` | `boolean` | `true`  | Include directives in addition to components |
