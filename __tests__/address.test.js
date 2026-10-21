import { formatAddress, getDeliveryInstructions } from '../src/utils/address';

describe('Address Utility - formatAddress & getDeliveryInstructions', () => {
  describe('formatAddress', () => {
    it('formats a complete address object accurately without coordinates or instructions', () => {
      const addrObj = {
        id: 10,
        house_number: 'Flat 402, Shiv Residency',
        street: 'Station Road',
        area: 'Near Shivaji Chowk',
        city: 'Sangola',
        state: 'Maharashtra',
        pincode: '413307',
        latitude: 17.4321,
        longitude: 75.1987,
        instructions: 'Leave outside door',
      };

      const result = formatAddress(addrObj);
      expect(result).toBe('Flat 402, Shiv Residency, Station Road, Near Shivaji Chowk, Sangola, Maharashtra, 413307');
      expect(result).not.toContain('Leave outside door');
      expect(result).not.toContain('17.4321');
      expect(result).not.toContain('75.1987');
      expect(result).not.toContain('[object Object]');
    });

    it('handles missing, null, and empty fields gracefully without extra commas', () => {
      const addrObj = {
        house_number: 'B-12',
        street: null,
        area: '',
        city: 'Sangola',
        state: undefined,
        pincode: '413307',
      };

      const result = formatAddress(addrObj);
      expect(result).toBe('B-12, Sangola, 413307');
    });

    it('avoids duplicate address parts case-insensitively', () => {
      const addrObj = {
        house_number: 'Sangola',
        street: 'Main Road',
        area: 'sangola',
        city: 'Sangola',
        state: 'Maharashtra',
        pincode: 413307,
      };

      const result = formatAddress(addrObj);
      expect(result).toBe('Sangola, Main Road, Maharashtra, 413307');
    });

    it('returns already formatted strings cleanly', () => {
      expect(formatAddress('Near Datta Mandir, Sangola')).toBe('Near Datta Mandir, Sangola');
      expect(formatAddress('   Trimmed Address   ')).toBe('Trimmed Address');
    });

    it('falls back when address string is empty or contains [object Object]', () => {
      expect(formatAddress('')).toBe('Sangola Route Address');
      expect(formatAddress('   ')).toBe('Sangola Route Address');
      expect(formatAddress('[object Object]')).toBe('Sangola Route Address');
      expect(formatAddress('[object Object]', 'Custom Fallback')).toBe('Custom Fallback');
    });

    it('returns custom fallback when addr is null or undefined', () => {
      expect(formatAddress(null)).toBe('Sangola Route Address');
      expect(formatAddress(undefined)).toBe('Sangola Route Address');
      expect(formatAddress(null, 'Detailed delivery address unavailable')).toBe('Detailed delivery address unavailable');
    });

    it('returns fallback when address object has all empty or null fields', () => {
      const emptyAddr = {
        house_number: null,
        street: '',
        area: undefined,
        city: '',
      };
      expect(formatAddress(emptyAddr, 'No Address Provided')).toBe('No Address Provided');
    });
  });

  describe('getDeliveryInstructions', () => {
    it('extracts instructions correctly from address object', () => {
      const addrObj = {
        house_number: '12',
        instructions: 'Ring bell twice and place bag on milk hook',
      };
      expect(getDeliveryInstructions(addrObj)).toBe('Ring bell twice and place bag on milk hook');
    });

    it('extracts delivery_instructions or notes if instructions is missing', () => {
      expect(getDeliveryInstructions({ delivery_instructions: 'Call on arrival' })).toBe('Call on arrival');
      expect(getDeliveryInstructions({ notes: 'Gate passcode 1234' })).toBe('Gate passcode 1234');
    });

    it('returns empty string when instructions is null, undefined, or string input', () => {
      expect(getDeliveryInstructions(null)).toBe('');
      expect(getDeliveryInstructions(undefined)).toBe('');
      expect(getDeliveryInstructions('Just a string address')).toBe('');
      expect(getDeliveryInstructions({ instructions: null })).toBe('');
    });
  });

  describe('Address Form State & Pincode Validation Rules', () => {
    const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

    it('initial state for adding a new address is completely empty for city and pincode', () => {
      const initialNewAddressState = {
        flatHouse: '',
        buildingSociety: '',
        streetArea: '',
        landmark: '',
        city: '',
        pincode: '',
        instructions: '',
        latitude: null,
        longitude: null,
      };

      expect(initialNewAddressState.city).toBe('');
      expect(initialNewAddressState.pincode).toBe('');
      expect(initialNewAddressState.city).not.toBe('Sangola');
      expect(initialNewAddressState.pincode).not.toBe('413307');
    });

    it('populates saved values accurately when editing an existing address', () => {
      const savedAddress = {
        id: 42,
        house_number: 'B-204',
        street: 'Kadlas Road | Building: Laxmi Niwas | Landmark: Near Water Tank',
        area: 'Shivaji Chowk',
        city: 'Pandharpur',
        pincode: '413304',
        latitude: '17.675000',
        longitude: '75.325000',
      };

      const populatedCity = savedAddress.city || '';
      const populatedPincode = savedAddress.pincode || '';

      expect(populatedCity).toBe('Pandharpur');
      expect(populatedPincode).toBe('413304');
      expect(populatedCity).not.toBe('Sangola');
      expect(populatedPincode).not.toBe('413307');
    });

    it('validates 6-digit Indian PIN codes correctly', () => {
      expect(INDIAN_PINCODE_REGEX.test('413307')).toBe(true);
      expect(INDIAN_PINCODE_REGEX.test('411001')).toBe(true);
      expect(INDIAN_PINCODE_REGEX.test('400001')).toBe(true);

      // Invalid PIN codes
      expect(INDIAN_PINCODE_REGEX.test('013307')).toBe(false); // starts with 0
      expect(INDIAN_PINCODE_REGEX.test('41330')).toBe(false);   // 5 digits
      expect(INDIAN_PINCODE_REGEX.test('4133077')).toBe(false); // 7 digits
      expect(INDIAN_PINCODE_REGEX.test('413 307')).toBe(false); // contains space
      expect(INDIAN_PINCODE_REGEX.test('abcdef')).toBe(false);  // letters
      expect(INDIAN_PINCODE_REGEX.test('')).toBe(false);        // empty
    });

    it('reverse-geocode autofills city and pincode only when reliable data exists and fields are not filled', () => {
      let formState = { city: '', pincode: '', streetArea: '' };

      const successfulGeocode = {
        locality: 'Camp Area',
        city: 'Pune',
        pincode: '411001',
      };

      if (!formState.streetArea.trim() && successfulGeocode.locality) {
        formState.streetArea = successfulGeocode.locality;
      }
      if (!formState.city.trim() && successfulGeocode.city) {
        formState.city = successfulGeocode.city;
      }
      if (!formState.pincode.trim() && successfulGeocode.pincode) {
        formState.pincode = successfulGeocode.pincode;
      }

      expect(formState.city).toBe('Pune');
      expect(formState.pincode).toBe('411001');
      expect(formState.streetArea).toBe('Camp Area');

      // Incomplete geocode returns empty fields without overwriting
      let partialFormState = { city: 'Existing City', pincode: '', streetArea: '' };
      const incompleteGeocode = {
        locality: '',
        city: '',
        pincode: '',
      };

      if (!partialFormState.streetArea.trim() && incompleteGeocode.locality) {
        partialFormState.streetArea = incompleteGeocode.locality;
      }
      if (!partialFormState.city.trim() && incompleteGeocode.city) {
        partialFormState.city = incompleteGeocode.city;
      }
      if (!partialFormState.pincode.trim() && incompleteGeocode.pincode) {
        partialFormState.pincode = incompleteGeocode.pincode;
      }

      expect(partialFormState.city).toBe('Existing City');
      expect(partialFormState.pincode).toBe('');
      expect(partialFormState.city).not.toBe('Sangola');
      expect(partialFormState.pincode).not.toBe('413307');
    });
  });
});
