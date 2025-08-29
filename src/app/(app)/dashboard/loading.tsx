import { ClientLoader } from '@/components/client-loader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full absolute inset-0">
      <ClientLoader />
    </div>
  );
}
