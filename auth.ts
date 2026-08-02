import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import PostgresAdapter from '@auth/pg-adapter';
import { Pool } from 'pg';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User, Role } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const isLocalDb = process.env.POSTGRES_URL?.includes('localhost');

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: isLocalDb ? false : 'require',
});

// @auth/pg-adapter 需要 node-postgres 的 Pool，跟上面业务查询用的
// postgres.js 客户端是两个库，各管各的，互不影响
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
        return user[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // 有 Credentials provider 存在时 Auth.js 强制用 JWT 会话（不会用数据库存 session），
    // 但 adapter 依然会在 GitHub 登录时把用户 upsert 进 users/accounts 表
    session: { strategy: 'jwt' },
    adapter: PostgresAdapter(pool),
    callbacks: {
        ...authConfig.callbacks,
        // 登录时才查库拿角色，写进 token，避免每次请求都查数据库
        async jwt({ token, user }) {
            if (user?.email) {
                const dbUser = await getUser(user.email);
                token.role = dbUser?.role ?? 'user';
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = (token.role as Role | undefined) ?? 'user';
            }
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return user;
                    }
                }
                console.log('Invalid credentials');
                return null;
            },
        }),
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            // GitHub 会验证邮箱所有权，允许跟已有的同邮箱账号自动关联
            allowDangerousEmailAccountLinking: true,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // Google 同理，邮箱是验证过的，允许自动关联
            allowDangerousEmailAccountLinking: true,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
});