import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: "Play", path: "/play" },
    { name: "Learn", path: "/tutorial" },
    { name: "Multiplayer", path: "/multiplayer" }
  ];

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
              <path d="M12 6.5a1 1 0 00-1 1v1h2v-1a1 1 0 00-1-1z" fill="currentColor"/>
              <path d="M15 9H9v2h6v-2z" fill="currentColor"/>
              <path d="M10 11v4h4v-4h-4z" fill="currentColor"/>
              <path d="M8 9v2H6v2h2v2h2v2h4v-2h2v-2h2v-2h-2V9h-6z" fill="currentColor"/>
            </svg>
            <h1 className="text-xl font-bold">Chess Master</h1>
          </div>
        </Link>
        
        <div className="hidden md:flex space-x-4">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button 
                variant={location === item.path ? "secondary" : "ghost"}
                className={location === item.path ? "text-primary" : "text-white hover:text-primary hover:bg-white/10"}
              >
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Button 
            className="hidden md:flex bg-accent hover:bg-accent/90 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button 
                  variant={location === item.path ? "secondary" : "ghost"}
                  className={`w-full text-left ${location === item.path ? "text-primary" : "text-white"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
            <Button className="bg-accent hover:bg-accent/90 text-white">
              Sign In
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
