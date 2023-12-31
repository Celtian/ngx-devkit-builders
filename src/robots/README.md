# Robots

It creates simplified robots.txt.

## Example output

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
        "robots": { // name can be different if you want
          "builder": "ngx-devkit-builders:robots",
          "options": {
            "sitemap": "https://www.mydomain.com/sitemap.xml",
            "verbose": false // or true
          },
          "configurations": {
            "production": { // name can be different if you want
              "allow": true // or true
            },
            "development": { // name can be different if you want
              "allow": false // or true
            }
          }
        }
      }
  }
}
```

2. Run command

```bash
ng run your-project-name:robots:production
```

or

```bash
ng run your-project-name:robots:development
```
