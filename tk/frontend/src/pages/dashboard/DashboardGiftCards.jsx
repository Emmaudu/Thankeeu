import { useSEO } from '../../hooks/useSEO';
import DashboardLayout from '../../components/DashboardLayout';
import GiftCardHistory from '../GiftCardHistory';

export default function DashboardGiftCards() {
  useSEO({ title: 'Gift Card History — Thankeeu', noIndex: true });
  return (
    <DashboardLayout title="Gift Card History" subtitle="Gift card codes you've received from card celebrations">
      <GiftCardHistory />
    </DashboardLayout>
  );
}
