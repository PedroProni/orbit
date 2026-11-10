import { INestApplication, RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { REQUIRED_SCOPES_KEY } from '../../src/infrastructure/auth/auth.constants';
import { RouteEntry } from './route-entry.type';

const toArray = (value: string | string[] | undefined): string[] => (value === undefined ? [''] : Array.isArray(value) ? value : [value]);

const joinPath = (base: string, path: string): string => `/${[base, path].join('/').split('/').filter(Boolean).join('/')}`;

export function listRoutes(app: INestApplication): RouteEntry[] {
  const routes = new Map<string, RouteEntry>();
  for (const module of app.get(ModulesContainer).values()) {
    for (const wrapper of module.controllers.values()) {
      const type = wrapper.metatype as (new (...args: unknown[]) => unknown) | null;
      if (!type) continue;
      const bases = toArray(Reflect.getMetadata(PATH_METADATA, type));
      const classScopes: string[] | undefined = Reflect.getMetadata(REQUIRED_SCOPES_KEY, type);
      const prototype = type.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(prototype)) {
        const handler = prototype[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        const paths: string | string[] | undefined = Reflect.getMetadata(PATH_METADATA, handler);
        const method: RequestMethod | undefined = Reflect.getMetadata(METHOD_METADATA, handler);
        if (paths === undefined || method === undefined) continue;
        const scopes: string[] = Reflect.getMetadata(REQUIRED_SCOPES_KEY, handler) ?? classScopes ?? [];
        for (const base of bases) {
          for (const path of toArray(paths)) {
            const entry = { method: RequestMethod[method], path: joinPath(base, path), scopes };
            routes.set(`${entry.method} ${entry.path}`, entry);
          }
        }
      }
    }
  }
  return [...routes.values()].sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));
}
