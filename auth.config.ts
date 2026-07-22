// auth.config.ts
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  // 1. 自定义页面路径
  pages: {
    signIn: '/login', // 替代 NextAuth 默认的登录页，重定向到我们自定义的 /login 页面
  },

  // 2. 访问控制回调函数
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user; // 判断用户是否已登录
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard'); // 判断是否访问后台

      if (isOnDashboard) {
        if (isLoggedIn) return true;  // 已登录，允许访问 /dashboard
        return false;                 // 未登录，拦截并重定向到 /login
      } else if (isLoggedIn) {
        // 已登录用户访问登录页或首页时，自动跳回 /dashboard
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true; // 其它公开页面默认放行
    },
  },

  // 3. 认证提供者 (Providers) 占位
  providers: [], // 稍后在 auth.ts 中补充具体的账号密码登录逻辑
} satisfies NextAuthConfig;