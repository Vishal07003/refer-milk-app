import { getInitials, getUserDisplayName } from '../src/utils/initials';

describe('initials utility tests', () => {
  describe('getInitials', () => {
    it('returns empty fallback for null/undefined/empty input', () => {
      expect(getInitials(null)).toBe('');
      expect(getInitials(undefined)).toBe('');
      expect(getInitials('')).toBe('');
      expect(getInitials('   ')).toBe('');
      expect(getInitials(null, 'FB')).toBe('FB');
    });

    it('returns single letter for single word names', () => {
      expect(getInitials('Rahul')).toBe('R');
      expect(getInitials('  rahul  ')).toBe('R');
      expect(getInitials('Deepak')).toBe('D');
    });

    it('returns two letters for two word names', () => {
      expect(getInitials('Rahul Sharma')).toBe('RS');
      expect(getInitials('john doe')).toBe('JD');
      expect(getInitials('  Amit   Kumar  ')).toBe('AK');
    });

    it('returns first and last letter for multi-word names', () => {
      expect(getInitials('Mohandas Karamchand Gandhi')).toBe('MG');
      expect(getInitials('Dr. APJ Abdul Kalam')).toBe('DK');
    });
  });

  describe('getUserDisplayName', () => {
    it('returns combined first and last name', () => {
      expect(getUserDisplayName({ first_name: 'Rahul', last_name: 'Sharma' })).toBe('Rahul Sharma');
      expect(getUserDisplayName({ first_name: 'Rahul' })).toBe('Rahul');
    });

    it('falls back to user_name or name', () => {
      expect(getUserDisplayName({ user_name: 'DeliveryPartner1' })).toBe('DeliveryPartner1');
      expect(getUserDisplayName({ name: 'Pure Milk Delivery' })).toBe('Pure Milk Delivery');
    });

    it('falls back to mobile number if name is missing', () => {
      expect(getUserDisplayName({ mobile_number: '9876543210' })).toBe('9876543210');
    });

    it('returns custom fallback when user is null or empty', () => {
      expect(getUserDisplayName(null, 'Guest')).toBe('Guest');
      expect(getUserDisplayName({}, 'Delivery Partner')).toBe('Delivery Partner');
    });
  });
});
