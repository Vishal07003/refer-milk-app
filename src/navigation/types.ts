export type AuthStackParamList = {
  Login: undefined;
  Otp: { phoneNumber: string };
  ProfileSetup: { phoneNumber?: string };
};
