import { useSEO } from '../../hooks/useSEO';
import CompanyLayout from '../../components/company/CompanyLayout';
import GiftCardHistory from '../GiftCardHistory';

export default function CompanyGiftCardsPage() {
  useSEO({ title: 'Gift Card History — Thankeeu', noIndex: true });
  return (
    <CompanyLayout title="Gift Card History" subtitle="Gift card codes received from card celebrations">
      <GiftCardHistory />
    </CompanyLayout>
  );
}
