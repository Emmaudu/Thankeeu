import { useSEO } from '../../hooks/useSEO';
import MemberLayout from '../../components/member/MemberLayout';
import GiftCardHistory from '../GiftCardHistory';

export default function MemberGiftCardsPage() {
  useSEO({ title: 'Gift Card History — Thankeeu', noIndex: true });
  return (
    <MemberLayout title="Gift Card History" subtitle="Gift card codes you've received from card celebrations">
      <GiftCardHistory />
    </MemberLayout>
  );
}
