import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  let className = 'badge ';
  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'HEALTHY':
      className += 'badge-active';
      break;
    case 'PENDING':
      className += 'badge-pending';
      break;
    case 'SUSPENDED':
    case 'REJECTED':
    case 'FAILED':
    case 'COMPROMISED':
      className += 'badge-suspended';
      break;
    case 'ADMIN':
      className += 'badge-role-admin';
      break;
    case 'ACCOUNT_HOLDER':
      className += 'badge-role-user';
      break;
    default:
      className += 'badge-secondary';
  }

  return <span className={className}>{status}</span>;
}
