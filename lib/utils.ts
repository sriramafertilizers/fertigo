import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ExpiryStatus {
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'GOOD' | 'NONE';
  label: string;
  daysLeft: number | null;
  formattedDate: string | null;
}

export function getExpiryStatus(expiryDateStr?: string | null): ExpiryStatus {
  if (!expiryDateStr) {
    return { status: 'NONE', label: 'No Expiry Set', daysLeft: null, formattedDate: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  if (isNaN(expDate.getTime())) {
    return { status: 'NONE', label: 'Invalid Date', daysLeft: null, formattedDate: null };
  }

  const diffTime = expDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${expDate.getDate()} ${monthNames[expDate.getMonth()]} ${expDate.getFullYear()}`;

  if (daysLeft < 0) {
    return {
      status: 'EXPIRED',
      label: `EXPIRED (${Math.abs(daysLeft)} days ago)`,
      daysLeft,
      formattedDate,
    };
  }

  if (daysLeft === 0) {
    return {
      status: 'EXPIRED',
      label: 'Expires Today!',
      daysLeft: 0,
      formattedDate,
    };
  }

  if (daysLeft <= 30) {
    return {
      status: 'CRITICAL',
      label: `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
      daysLeft,
      formattedDate,
    };
  }

  if (daysLeft <= 90) {
    return {
      status: 'WARNING',
      label: `Expires in ${daysLeft} days`,
      daysLeft,
      formattedDate,
    };
  }

  return {
    status: 'GOOD',
    label: `Valid till ${formattedDate}`,
    daysLeft,
    formattedDate,
  };
}
