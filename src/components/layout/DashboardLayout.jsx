import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import AIAssistantPanel from './AIAssistantPanel'

export default function DashboardLayout({ onLock }) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  return (
    <div className="h-screen flex flex-col bg-medicalWhite overflow-hidden">
      <Navbar onLock={onLock} onOpenAIPanel={() => setAiPanelOpen(true)} />

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 overflow-auto p-4 md:p-6 w-full min-w-0">
          <Outlet />
        </main>
        <AIAssistantPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      </div>
    </div>
  )
}
