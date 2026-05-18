# Approach 1: Ultraviolet Service Worker Proxy

## How it works
Ultraviolet registers a Service Worker in your browser that intercepts every
network request and rewrites it through a bare server. The GitHub Pages site
itself only serves static files — the heavy lifting happens in the browser.

## Setup (5 steps)

### 1. Fork the official repo
Go to: https://github.com/titaniumnetwork-dev/Ultraviolet-App
Click "Fork" → your GitHub account.

### 2. Enable GitHub Pages
In your fork: Settings → Pages → Source: GitHub Actions
(The repo already has a workflow file — it deploys automatically.)

### 3. Your proxy is live at:
  https://YOUR-USERNAME.github.io/Ultraviolet-App/

### 4. Optional: custom domain
Settings → Pages → Custom domain → enter your domain.

### 5. Update the bare server (important)
The default bare server may be slow or down. Edit `uv.config.js`:

```js
self.__uv$config = {
  prefix: '/uv/service/',
  bare: 'https://uv-bare.your-username.workers.dev/', // your own Cloudflare Worker
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/uv/uv.handler.js',
  bundle: '/uv/uv.bundle.js',
  config: '/uv/uv.config.js',
  sw: '/uv/uv.sw.js',
};
```

## Pros
- Fully hosted on GitHub Pages (free)
- Handles most sites including those with heavy JS
- Active open-source project with updates

## Cons
- Needs a "bare server" (a small backend) for best results
- Some sites detect and block service worker proxies
- Setup requires forking and understanding the config

## Links
- https://github.com/titaniumnetwork-dev/Ultraviolet-App
- https://github.com/tomphttp/bare-server-node (bare server)
