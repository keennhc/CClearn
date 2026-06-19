// add issues here and ask claude to fix them ex: "Please fix issues in issues.md"

1. community admin chat text input, upload icon, and send button are too close to the bottom edge please add spacing
2. still getting error:
   [backend] [Nest] 70197 - 06/19/2026, 4:30:07 PM ERROR [NestApplication] Error: listen EADDRINUSE: address already in use :::3000 +1ms
   [backend] node:net:1908
   [backend] const ex = new UVExceptionWithHostPort(err, 'listen', address, port);
   [backend] ^
   [backend]
   [backend] Error: listen EADDRINUSE: address already in use :::3000
   [backend] at Server.setupListenHandle [as _listen2] (node:net:1908:16)
   [backend] at listenInCluster (node:net:1965:12)
   [backend] at Server.listen (node:net:2067:7)
   [backend] at ExpressAdapter.listen (/Users/kcaw/Projects/CClearn/node*modules/.pnpm/@nestjs+platform-express@11.1.26*@nestjs+common@11.1.26_class-transformer@0.5.1*class-validat_xus3ngag3bsoala5ejgohdieay/node_modules/@nestjs/platform-express/adapters/express-adapter.js:115:32)
   [backend] at /Users/kcaw/Projects/CClearn/node_modules/.pnpm/@nestjs+core@11.1.26*@nestjs+common@11.1.26_class-transformer@0.5.1_class-validator@0.14.4_re_yflhbuopqgxx4o4dywswyrlhfy/node*modules/@nestjs/core/nest-application.js:190:30
   [backend] at new Promise (<anonymous>)
   [backend] at NestApplication.listen (/Users/kcaw/Projects/CClearn/node_modules/.pnpm/@nestjs+core@11.1.26*@nestjs+common@11.1.26_class-transformer@0.5.1_class-validator@0.14.4_re_yflhbuopqgxx4o4dywswyrlhfy/node_modules/@nestjs/core/nest-application.js:180:16)
   [backend] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
   [backend] at async bootstrap (/Users/kcaw/Projects/CClearn/apps/backend/src/main.ts:28:3) {
   [backend] code: 'EADDRINUSE',
   [backend] errno: -48,
   [backend] syscall: 'listen',
   [backend] address: '::',
   [backend] port: 3000
   [backend] }
   [backend]
   [backend] Node.js v20.20.2
