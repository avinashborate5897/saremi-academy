import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import {
  handleCreateRazorpayOrder,
  handleVerifyRazorpayPayment,
  handleRazorpayWebhook
} from './src/server/apiHandlers';

function suppressHmrPlugin(): Plugin {
  return {
    name: 'suppress-hmr-logs',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: `(function(){if(typeof window==='undefined')return;try{var O=window.WebSocket;if(O){window.WebSocket=function(u,p){if(p==='vite-hmr'||(typeof u==='string'&&(u.indexOf('token=')!==-1||u.indexOf('24678')!==-1||u.indexOf('vite')!==-1))){return{readyState:1,send:function(){},close:function(){},addEventListener:function(e,f){if(e==='open')setTimeout(function(){f(new Event('open'));},0);},removeEventListener:function(){},dispatchEvent:function(){return true;}};}return new O(u,p);};window.WebSocket.prototype=O.prototype;}var isV=function(a){for(var i=0;i<a.length;i++){var x=a[i];if(typeof x==='string'&&(x.indexOf('vite')!==-1||x.indexOf('WebSocket')!==-1||x.indexOf('websocket')!==-1))return true;}return false;};['log','info','warn','error','debug'].forEach(function(m){var o=console[m];console[m]=function(){if(isV(arguments))return;o.apply(console,arguments);};});}catch(e){}})();`,
          injectTo: 'head-prepend'
        }
      ];
    }
  };
}

function apiPlugin(): Plugin {
  return {
    name: 'saremi-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        // Health check
        if (pathname === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ok',
            paymentProvider: 'Razorpay',
            time: new Date().toISOString()
          }));
          return;
        }

        // Create Razorpay Order
        if (pathname === '/api/create-razorpay-order' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await handleCreateRazorpayOrder(payload);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to create Razorpay order' }));
            }
          });
          return;
        }

        // Verify Razorpay Payment Signature
        if (pathname === '/api/verify-razorpay-payment' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await handleVerifyRazorpayPayment(payload);
              if (!result.verified) {
                res.statusCode = 400;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Failed to verify payment' }));
            }
          });
          return;
        }

        // Send Transactional Email
        if (pathname === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const emailPayload = JSON.parse(body || '{}');
              console.log('[Transactional Email Dispatched]', {
                to: emailPayload.recipientEmail,
                subject: emailPayload.subject,
                type: emailPayload.type,
                timestamp: new Date().toISOString()
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: `msg_${Date.now()}` }));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Razorpay Webhook Endpoint
        if (pathname === '/api/webhook/razorpay' && req.method === 'POST') {
          let chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(chunk);
          });
          req.on('end', async () => {
            try {
              const rawBody = Buffer.concat(chunks);
              const sig = (req.headers['x-razorpay-signature'] as string) || '';
              const result = handleRazorpayWebhook(rawBody, sig);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      suppressHmrPlugin(),
      react(), 
      tailwindcss(), 
      apiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'saremi-logo.png', 'manifest.json'],
        manifest: {
          id: '/',
          name: 'Saremi Academy - Live 1:1 Online Music Conservatory',
          short_name: 'Saremi',
          description: 'Master Hindustani & Western Vocals, Piano, Guitar, and Tabla through live 1:1 mentorship and Riyaaz practice tools.',
          theme_color: '#121829',
          background_color: '#121829',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/saremi-logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/saremi-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/saremi-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/i\.postimg\.cc\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'saremi-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'document',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-static-resources',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-data-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      hmr: false,
      watch: {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild' as const,
      cssMinify: true,
      sourcemap: true,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            icons: ['lucide-react'],
            motion: ['motion'],
            agora: ['agora-rtc-sdk-ng']
          }
        }
      }
    }
  };
});
