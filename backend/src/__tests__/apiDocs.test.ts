import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { app } from '../server';

/**
 * Keeps docs/openapi.yaml honest: every documented operation must exist in the Express app and
 * every Express API route must be documented.
 */
const spec = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../docs/openapi.yaml'), 'utf8')) as any;

/** Express 4 stores a mount path as a regexp like ^\/api\/v1\/?(?=\/|$); turn it back into "/api/v1". */
const mountPath = (re: RegExp): string => {
  const src = re.source;
  if (src === '^\\/?(?=\\/|$)') return '';
  return src.replace(/^\^/, '').replace('\\/?(?=\\/|$)', '').split('\\/').join('/');
};

const routesFromApp = (): Set<string> => {
  const found = new Set<string>();
  const walk = (stack: any[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) found.add(`${method.toUpperCase()} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        walk(layer.handle.stack, `${prefix}${mountPath(layer.regexp)}`);
      }
    }
  };
  walk((app as any)._router.stack, '');
  return found;
};

const normalise = (s: string) =>
  s
    .replace(/:(\w+)/g, '{p}')
    .replace(/\{(\w+)\}/g, '{p}')
    .replace(/(\/)$/, '') || '/';

describe('OpenAPI document matches the real routes', () => {
  const apiRoutes = [...routesFromApp()]
    .filter((r) => r.split(' ')[1].startsWith('/api/v1'))
    .map((r) => {
      const [method, p] = r.split(' ');
      return `${method} ${normalise(p.replace('/api/v1', '') || '/')}`;
    });
  const actual = new Set(apiRoutes);

  const documented = new Set<string>();
  for (const [p, ops] of Object.entries<any>(spec.paths)) {
    for (const method of Object.keys(ops)) documented.add(`${method.toUpperCase()} ${normalise(p)}`);
  }

  it('found the real routes (guards against a vacuous pass)', () => {
    expect(actual.size).toBeGreaterThan(25);
  });

  it('every documented operation exists', () => {
    expect([...documented].filter((d) => !actual.has(d))).toEqual([]);
  });

  it('every API route is documented', () => {
    expect([...actual].filter((r) => !documented.has(r))).toEqual([]);
  });
});
