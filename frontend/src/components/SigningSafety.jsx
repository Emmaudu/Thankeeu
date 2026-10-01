/**
 * SigningSafety.jsx — helps a signature actually reach the card.
 *
 *   <KeepPageOpenNote hasMedia />  the note under the Sign button.
 *   useLeaveWarning(busy)          asks "Leave site?" while a signature is still sending.
 */
import { useEffect } from 'react';

export function KeepPageOpenNote({ hasMedia = false, className = '' }) {
  return (
    <p className={`mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 ${className}`} role="note">
      <strong className="font-bold">Please keep this page open.</strong>{' '}
      When you have finished, press Sign and wait until the confirmation page appears.
      {hasMedia
        ? ' Photos, videos and voice notes can take a little longer to upload.'
        : ' It usually takes a few seconds.'}
      {' '}Closing the page early may stop your message from being added.
    </p>
  );
}

/** While `busy`, the browser asks for confirmation before the page is closed. */
export function useLeaveWarning(busy) {
  useEffect(() => {
    if (!busy) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // required by some browsers to show the prompt
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [busy]);
}
