# 🤖 Robots

It creates simplified robots.txt for your Angular project. 🚀

## 📋 Example Output

```
User-agent: *

Allow: /

Sitemap: https://www.mydomain.com/sitemap.xml
```

or

```
User-agent: *

Disallow: /
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
        "robots": {
          "builder": "ngx-devkit-builders:robots",
          "options": {
            "sitemap": "https://www.mydomain.com/sitemap.xml",
            "verbose": false
          },
          "configurations": {
            "production": {
              "allow": true
            },
            "development": {
              "allow": false
            }
          }
        }
      }
    }
  }
}
```

### ▶️ Run the builder

```bash
# Production configuration (allows crawling)
ng run your-project-name:robots:production

# Development configuration (disallows crawling)
ng run your-project-name:robots:development
```

## ⚙️ Options

| Option    | Type      | Default | Description                               |
| --------- | --------- | ------- | ----------------------------------------- |
| `sitemap` | `string`  | -       | URL to sitemap.xml                        |
| `allow`   | `boolean` | -       | Whether to allow or disallow web crawling |
| `verbose` | `boolean` | `false` | Show detailed output                      |
