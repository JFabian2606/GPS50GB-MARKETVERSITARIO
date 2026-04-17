import { LoaderOne } from '@/components/ui/loader'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white backdrop-blur-sm">
      <LoaderOne />
    </div>
  )
}
