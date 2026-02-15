# Production Security Headers Configuration

This guide covers security headers configuration for deploying the React SPA across different platforms.

## Security Headers Overview

| Header | Purpose |
|--------|---------|
| `X-Frame-Options` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | Prevents MIME sniffing attacks |
| `Strict-Transport-Security` | Forces HTTPS for all future visits (HSTS) |
| `Content-Security-Policy` | Controls resource loading, prevents XSS |
| `Referrer-Policy` | Controls referrer information sent to other sites |
| `Permissions-Policy` | Disables unused browser features |

---

## Nginx

### Full Configuration

```nginx
# /etc/nginx/sites-available/your-app.conf

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}

# Redirect www to non-www
server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    return 301 https://yourdomain.com$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    root /var/www/your-spa/dist;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # ===========================================
    # SECURITY HEADERS
    # ===========================================

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # CSP - Adjust domains based on your needs
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;" always;

    # ===========================================
    # PERFORMANCE
    # ===========================================

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Cache static assets (1 year)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
    }

    # ===========================================
    # SPA ROUTING
    # ===========================================

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy (if API on same domain)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Block sensitive files
    location ~ /\. {
        deny all;
    }
}
```

---

## Azure Static Web Apps

### staticwebapp.config.json

```json
{
  "globalHeaders": {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;"
  },
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/api/*"]
  },
  "mimeTypes": {
    ".json": "application/json",
    ".woff2": "font/woff2"
  }
}
```

> **Note:** Azure Static Web Apps automatically enables HSTS on custom domains with HTTPS.

---

## Azure App Service (Windows)

### web.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />
        <add name="Permissions-Policy" value="camera=(), microphone=(), geolocation=(), payment=()" />
        <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;" />
      </customHeaders>
    </httpProtocol>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
  </system.webServer>
</configuration>
```

---

## Azure Front Door / CDN

### Configure via Azure Portal or Bicep/Terraform

**Azure Portal:**
1. Go to Front Door profile → Security policies
2. Add custom rules for headers under "Rules Engine"

**Bicep example:**

```bicep
resource frontDoorRuleSet 'Microsoft.Cdn/profiles/ruleSets@2023-05-01' = {
  name: 'SecurityHeaders'
  parent: frontDoorProfile
}

resource securityHeadersRule 'Microsoft.Cdn/profiles/ruleSets/rules@2023-05-01' = {
  name: 'AddSecurityHeaders'
  parent: frontDoorRuleSet
  properties: {
    order: 1
    actions: [
      {
        name: 'ModifyResponseHeader'
        parameters: {
          headerAction: 'Overwrite'
          headerName: 'X-Frame-Options'
          value: 'SAMEORIGIN'
        }
      }
      {
        name: 'ModifyResponseHeader'
        parameters: {
          headerAction: 'Overwrite'
          headerName: 'X-Content-Type-Options'
          value: 'nosniff'
        }
      }
      {
        name: 'ModifyResponseHeader'
        parameters: {
          headerAction: 'Overwrite'
          headerName: 'Strict-Transport-Security'
          value: 'max-age=31536000; includeSubDomains; preload'
        }
      }
      // Add more headers as needed
    ]
  }
}
```

---

## Vercel

### vercel.json

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## Netlify

### netlify.toml

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
```

Or use `_headers` file in the publish directory:

```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;
```

---

## Cloudflare Pages

### _headers file

Create `_headers` in your build output directory:

```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;
```

> **Note:** Cloudflare automatically adds HSTS when "Always Use HTTPS" is enabled.

---

## AWS CloudFront + S3

### CloudFront Response Headers Policy (via AWS Console or Terraform)

**Terraform:**

```hcl
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "security-headers-policy"

  security_headers_config {
    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    content_type_options {
      override = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;"
      override                = true
    }
  }
}

resource "aws_cloudfront_distribution" "spa" {
  # ... other config ...

  default_cache_behavior {
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    # ... other config ...
  }
}
```

---

## Content-Security-Policy Customization

Adjust CSP based on your needs:

| If you use... | Add to CSP |
|---------------|------------|
| Google Fonts | `font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;` |
| Google Analytics | `script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com;` |
| Stripe | `script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com;` |
| YouTube embeds | `frame-src https://www.youtube.com;` |
| Images from CDN | `img-src 'self' data: https://your-cdn.com;` |

---

## Testing Your Headers

After deployment, verify your security headers:

1. **SecurityHeaders.com** - https://securityheaders.com
2. **Mozilla Observatory** - https://observatory.mozilla.org
3. **Chrome DevTools** - Network tab → Response Headers

**Expected grade: A or A+**

---

## API Security Headers

The NestJS API only needs minimal headers (already configured in `main.ts`):

```typescript
app
  .getHttpAdapter()
  .getInstance()
  .addHook('onSend', (req, reply, payload, done) => {
    reply.removeHeader('X-Powered-By');
    reply.header('X-Content-Type-Options', 'nosniff');
    done();
  });
```

CSP, X-Frame-Options, and HSTS are not needed for JSON APIs - they protect HTML documents.
