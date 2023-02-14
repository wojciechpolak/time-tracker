/**
 * git-version-gen
 *
 * Time Tracker Copyright (C) 2023 Wojciech Polak
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require('fs');
const path = require('path');
const gitRevSync = require('git-rev-sync');

const GV_FILE = 'src/environments/git-version';

function getGitVersion() {
    try {
        if (fs.existsSync(path.join(process.cwd(), '.git'))) {
            return {
                commit: gitRevSync.short(),
                commit_date: gitRevSync.date(),
            };
        }
        else if (fs.existsSync(`./${GV_FILE}.json`)) {
            let gv = require(`./${GV_FILE}.json`);
            return {
                commit: gv.commit,
                commit_date: gv.commit_date,
            };
        }
        else {
            return {
                commit: 'HEAD',
                commit_date: '',
            };
        }
    }
    catch (e) {
        return {
            commit: 'HEAD',
            commit_date: '',
        };
    }
}

let json = JSON.stringify(getGitVersion(), null, 4);
const ts = `/* AUTO-GENERATED FILE */
/* eslint-disable */

export const gitVersion = ${json};
`;

fs.writeFileSync(`${GV_FILE}.ts`, ts, 'utf-8');
fs.writeFileSync(`${GV_FILE}.json`, json, 'utf-8');
