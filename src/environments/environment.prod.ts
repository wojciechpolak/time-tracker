import { withDevToolsStub } from '@angular-architects/ngrx-toolkit';
import { gitVersion } from './git-version';

export const environment = {
    baseHref: '/',
    production: true,
    version: gitVersion,
    storeWithDevTools: withDevToolsStub,
};
