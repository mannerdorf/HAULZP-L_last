import { redirect } from 'next/navigation';

export default function MainlinePage() {
  redirect('/upload/expenses?sub=mainline');
}
