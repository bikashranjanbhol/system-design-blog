import * as migration_20261114_042427_initial from './20261114_042427_initial';

export const migrations = [
  {
    up: migration_20261114_042427_initial.up,
    down: migration_20261114_042427_initial.down,
    name: '20261114_042427_initial'
  },
];
