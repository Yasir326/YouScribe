import { Summary } from '@/src/type'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
} from '@/src/app/components/ui/sidebar'

type SideMenuProps = {
  summaries: Summary[]
  onSelectSummary: (id: string) => void
}

export default function SideMenu({ summaries, onSelectSummary }: SideMenuProps) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r h-[calc(100vh-4rem)]">
        <SidebarHeader className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex flex-col relative items-end">
              <div>
                <div className="pt-0">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">YouScribe</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Summaries</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {summaries.map((summary) => (
                  <SidebarMenuItem key={summary.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectSummary(summary.id)}
                      className="w-full"
                    >
                      {summary.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}