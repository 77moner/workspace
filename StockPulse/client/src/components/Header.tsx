import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ui/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export function Header() {
  const navigate = useNavigate()
  
  const handleHomeClick = () => {
    navigate("/")
  }
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="text-xl font-bold cursor-pointer hover:text-blue-600 transition-colors" onClick={handleHomeClick}>Home</div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}