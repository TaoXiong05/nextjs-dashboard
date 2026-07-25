// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// 使用 authConfig 初始化 NextAuth 实例并导出 auth 中间件
export default NextAuth(authConfig).auth;

export const config = {
  // matcher 决定哪些路由路径需要触发此中间件
  // 使用正则排除静态资源、图片、favicon 等，只对 API 和页面路由生效
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};


// sadasdasda