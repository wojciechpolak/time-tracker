// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { withDevtools } from '@angular-architects/ngrx-toolkit';

export const environment = {
    baseHref: '/',
    production: false,
    version: {
        commit: 'HEAD',
        commit_date: ''
    },
    storeWithDevTools: withDevtools,
};
