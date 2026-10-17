import { useAuth } from '@/context/AuthContext.jsx';
import { useRouter } from '@/context/RouterContext.jsx';
import { LoadingSpinner } from '@/components/ui/index.jsx';
import Discover from './CustomerPageComponents/Discover';
import MyBids from './CustomerPageComponents/MyBid';
import Properties from './CustomerPageComponents/Properties';
import MallDetail from './CustomerPageComponents/MallDetail';
import PropertyDetail from './CustomerPageComponents/PropertyDetail';
import BidPage from './CustomerPageComponents/BidPage';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { route } = useRouter();
  if (!user) return <LoadingSpinner />;
  const segments = route.split('/').filter(Boolean);
  if (segments.length === 4 && segments[0] === 'app' && segments[1] === 'customer' && segments[2] === 'mall') {
    const mallId = segments[3];
    return <MallDetail mallId={mallId} user={user} />;
  }
  if (segments.length === 4 && segments[0] === 'app' && segments[1] === 'customer' && segments[2] === 'property') {
    const storeId = segments[3];
    return <PropertyDetail storeId={storeId} user={user} />;
  }
  if (segments.length === 6 && segments[0] === 'app' && segments[1] === 'customer' && segments[2] === 'bid' && segments[4] === 'store') {
    const eventId = segments[3];
    const storeId = segments[5];
    return <BidPage eventId={eventId} storeId={storeId} user={user} />;
  }
  const pageKey = segments[segments.length - 1] || 'customer';

  if (pageKey === 'customer') return <Discover user={user} />;
  if (pageKey === 'properties') return <Properties user={user} />;
  if (pageKey === 'bids') return <MyBids user={user} />;
  return <Discover user={user} />;
}
