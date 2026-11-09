import basicAuth from 'basic-auth';
import { Request, Response, NextFunction } from 'express';
import { EnvConfigService } from '@common/env/services/env-config.service';

export const authMiddlewareFactory = (envConfigService: EnvConfigService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = basicAuth(req);
    const username = envConfigService.getSwaggerUsername();
    const password = envConfigService.getSwaggerPassword();

    if (!user || user.name !== username || user.pass !== password) {
      res.set('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
      return res.status(401).send('Authentication required.');
    }

    next();
  };
};
