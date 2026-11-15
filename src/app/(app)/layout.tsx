import { Suspense } from "react"
import { AppGate, FullPageLoading } from "@/components/app-gate"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <AppGate>{children}</AppGate>
    </Suspense>
  )
}
