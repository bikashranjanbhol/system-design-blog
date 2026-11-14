import * as migration_20261114_042427_initial from './20261114_042427_initial';
import * as migration_20261114_121500_media_object_key from './20261114_121500_media_object_key';

export const migrations = [
  {
    up: migration_20261114_042427_initial.up,
    down: migration_20261114_042427_initial.down,
    name: '20261114_042427_initial'
  },
  {
    up: migration_20261114_121500_media_object_key.up,
    down: migration_20261114_121500_media_object_key.down,
    name: '20261114_121500_media_object_key'
  },
];
