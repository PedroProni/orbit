import { MISSING_ID, ROUTE_PARAM_SOURCES } from '../fixtures/viewer/route-param-sources.constant';

export function fillRouteParams(path: string, ids: Record<string, string>): string {
  const segments = path.split('/');
  return segments.map((segment, index) => (segment.startsWith(':') ? (ids[ROUTE_PARAM_SOURCES[`${segments[index - 1]}/${segment}`]] ?? MISSING_ID) : segment)).join('/');
}
