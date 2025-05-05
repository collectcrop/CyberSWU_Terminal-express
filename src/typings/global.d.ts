// src/typings/global.d.ts
export {}

declare global {
  interface Env {
    DOCKERFILE_PATH: string;
    JWT_SECRET: string;
    DATABASE_URL: string;
  }
    // 这里必须使用 var 才能正确声明到 globalThis，let/const 会失效
    // eslint-disable-next-line no-var
    var env: Env
}
