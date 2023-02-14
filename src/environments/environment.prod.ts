import { gitVersion } from './git-version';

export const environment = {
    baseHref: '/',
    production: true,
    version: gitVersion,
};
