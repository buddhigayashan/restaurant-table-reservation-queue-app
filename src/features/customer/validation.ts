import type { CustomerSignUpInput } from '@/types/customer';
import type { BookingInput } from '@/types/reservation';

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : 'Enter a valid email address.';
}

export function validateSignUp(input: CustomerSignUpInput): string | null {
  if (!input.fullName.trim()) return 'Enter your full name.';
  const emailError = validateEmail(input.email);
  if (emailError) return emailError;
  const phone = input.phoneNumber.trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return 'Enter a valid phone number.';
  }
  if (input.password.length < 6) return 'Use a password with at least 6 characters.';
  if (input.password !== input.confirmPassword) return 'Passwords do not match.';
  return null;
}

export function validateBooking(input: BookingInput, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return 'Choose a date.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return 'Choose a valid time.';
  const [year, month, day] = input.date.split('-').map(Number);
  const [hour, minute] = input.time.split(':').map(Number);
  const selected = new Date(year, month - 1, day, hour, minute);
  if (
    selected.getFullYear() !== year ||
    selected.getMonth() !== month - 1 ||
    selected.getDate() !== day
  ) return 'Choose a valid date.';
  if (selected <= now) return 'Choose a future date and time.';
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 20) {
    return 'Enter a guest count from 1 to 20.';
  }
  if (input.specialRequest.length > 500) return 'Keep special requests within 500 characters.';
  return null;
}
