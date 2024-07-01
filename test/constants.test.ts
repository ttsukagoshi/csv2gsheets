// Test consistency of constants

import { DEFAULT_CONFIG, CONFIG_KEYS } from '../src/constants';

describe('CONFIG_KEYS', () => {
  it('should match the keys of DEFAULT_CONFIG', () => {
    const configKeys = Object.keys(CONFIG_KEYS);
    const defaultConfigKeys = Object.keys(DEFAULT_CONFIG);
    expect(configKeys).toEqual(defaultConfigKeys);
  });
});
