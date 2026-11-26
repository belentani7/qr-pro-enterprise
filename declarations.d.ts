declare module 'react-native-reanimated' {
  export * from 'react-native-reanimated/lib/typescript/reanimated2';
  export function interpolate(value: number, inputRange: number[], outputRange: number[]): number;
  export function useAnimatedRef(): any;
  export function useAnimatedStyle(factory: () => any): any;
  export function useScrollOffset(): any;
  export function withTiming(value: number, config?: any): any;
  export function withSpring(value: number, config?: any): any;
  export const Extrapolate: { CLAMP: 'clamp'; EXTEND: 'extend'; IDENTITY: 'identity' };
  export namespace Animated {
    export interface Style extends Record<string, any> {}
  }
  export const Text: any;
  export const View: any;
  export const ScrollView: any;
}

declare module 'drizzle-orm' {
  export * from 'drizzle-orm';
  export function eq<T>(column: any, value: T): any;
  export function and(...conditions: any[]): any;
  export function or(...conditions: any[]): any;
  export function desc(column: any): any;
  export function asc(column: any): any;
  export function like(column: any, value: string): any;
  export function ilike(column: any, value: string): any;
  export function inArray<T>(column: any, values: T[]): any;
  export function isNotNull(column: any): any;
  export function isNull(column: any): any;
  export function sql(strings: TemplateStringsArray, ...values: any[]): any;
  export function count(column: any): any;
  export function sum(column: any): any;
  export function avg(column: any): any;
  export function min(column: any): any;
  export function max(column: any): any;
}

declare module 'drizzle-orm/mysql-core' {
  export * from 'drizzle-orm/mysql-core';
  export function int(name: string, config?: any): any;
  export function mysqlEnum<T extends string>(name: string, values: T[]): any;
  export function mysqlTable(name: string, columns: Record<string, any>): any;
  export function text(name: string, config?: any): any;
  export function timestamp(name: string, config?: any): any;
  export function varchar(name: string, config?: any): any;
  export function primaryKey(column: any): any;
  export function unique(name: string, columns: any[]): any;
  export function index(name: string, columns: any[]): any;
  export function foreignKey(config: any): any;
}

declare module 'drizzle-orm/mysql2' {
  export * from 'drizzle-orm/mysql2';
  export function drizzle(client: any, config?: any): any;
  export function migrate(db: any, migrationsFolder: string): Promise<void>;
}

declare module 'expo-audio' {
  export * from 'expo-audio';
}

declare module 'expo-video' {
  export * from 'expo-video';
}
