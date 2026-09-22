import { User } from '@models';

import { TimeSheetDisplayUtil } from './time-sheet-display.util';

describe('TimeSheetDisplayUtil', () => {
  let util: TimeSheetDisplayUtil;

  beforeEach(() => {
    util = new TimeSheetDisplayUtil();
  });

  describe('getUserName', () => {
    it('should return empty string when userId is empty', () => {
      expect(util.getUserName('', undefined)).toBe('');
    });

    it('should return Unknown User when user is missing', () => {
      expect(util.getUserName('user-1', undefined)).toBe('Unknown User');
    });

    it('should return full name when name and surname are set', () => {
      const user = new User();
      user.name = 'Jane';
      user.surname = 'Doe';
      user.email = 'jane@example.com';

      expect(util.getUserName('user-1', user)).toBe('Jane Doe');
    });

    it('should fall back to email when name is empty', () => {
      const user = new User();
      user.email = 'jane@example.com';

      expect(util.getUserName('user-1', user)).toBe('jane@example.com');
    });

    it('should return Unknown User when user has no display fields', () => {
      const user = new User();

      expect(util.getUserName('user-1', user)).toBe('Unknown User');
    });
  });
});
