import { useState } from 'react';
import { Home, Loader2, Phone, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) throw error;

      setIsOtpSent(true);
      setSuccessMessage('OTP sent to your phone!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error signing in with Google:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error signing in with Apple:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-lg mb-4">
            <Home className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Welcome to BFI
          </h1>
          <p className="text-gray-400 text-lg">
            Your property intelligence companion
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 md:p-8 space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full px-4 py-4 bg-white text-black rounded-lg hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <button
            onClick={handleAppleSignIn}
            disabled={isLoading}
            className="w-full px-4 py-4 bg-white text-black rounded-lg hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">Or continue with phone</span>
            </div>
          </div>

          {!isOtpSent ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-12 pr-4 py-4 bg-gray-800 text-white rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900 border border-green-700 rounded-lg p-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm">{successMessage}</p>
              </div>
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-gray-800 text-white rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-center text-2xl tracking-wider"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 disabled:bg-gray-700 disabled:text-gray-500 font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
              <button
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                  setSuccessMessage('');
                }}
                className="w-full text-gray-400 hover:text-white text-sm"
              >
                Use a different number
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
