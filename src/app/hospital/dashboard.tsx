import { useWindowDimensions } from 'react-native';
import HospitalHomeMobile from '@/hospital/HomeMobile';
import Overview from '@/hospital/portal/Overview';

// Phones get Home; the hospital portal gets the shift board.
export default function Dashboard() {
  const { width } = useWindowDimensions();
  return width < 768 ? <HospitalHomeMobile /> : <Overview />;
}
