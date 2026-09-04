// Used for the GitHub Pages deployment, where the app is served from the
// /time-tracker/ subpath instead of the domain root.

import { withDevToolsStub } from '@ngrx-toolkit/core';
import { gitVersion } from './git-version';

export const environment = {
    baseHref: '/time-tracker/',
    production: true,
    version: gitVersion,
    storeWithDevTools: withDevToolsStub,
};
