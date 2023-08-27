// Jest tests for utility functions in ./src/utils.ts

import ora from 'ora';
import { spinner, stopSpinner } from '../src/utils';

jest.mock('ora');

describe('stopSpinner', () => {
  it('should call ora.stop() if spinner.isSpinning is true', () => {
    jest.spyOn(spinner, 'isSpinning');
    (spinner.isSpinning as jest.Mock).mockReturnValue(true);
    stopSpinner();
    expect(spinner.stop).toHaveBeenCalled();
  });
  it('should not call ora.stop() if spinner.isSpinning is false', () => {
    (spinner.isSpinning as jest.Mock).mockReturnValue(false);
    stopSpinner();
    expect(spinner.stop).not.toHaveBeenCalled();
  });
});
